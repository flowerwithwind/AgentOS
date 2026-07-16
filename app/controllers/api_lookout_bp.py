"""
瞭望采集 Blueprint

替代 Tornado api_lookout.py：
- GET    /sources                   信息源列表
- POST   /sources/create            创建信息源
- PUT    /sources/<id>              更新信息源
- DELETE /sources/<id>/delete       删除信息源
- POST   /collect                   执行采集
- GET    /warehouse                 数据仓库列表
- DELETE /warehouse/<id>/delete     删除记录
- POST   /deep-collect              启动深度采集
- GET    /deep-collect/progress     深度采集进度
"""
from flask import Blueprint, request, jsonify
from app.utils.response import success, error, paginated
from app.services.lookout_service import LookoutService
from app.models.lookout import LookoutSourceRepository, LookoutRecordRepository, DeepCollectTask
from app.auth_helper import login_required

lookout_bp = Blueprint("lookout", __name__)


@lookout_bp.route("/sources", methods=["GET"])
@login_required
def list_sources():
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("pageSize", "10"))
    sources, total = LookoutService.get_sources(page, page_size)
    items = []
    for s in sources:
        items.append({
            "id": s["id"], "name": s["name"],
            "urlTemplate": s["url_template"],
            "pnParam": s["pn_param"], "pageSize": s["page_size"],
            "keywordPlaceholder": s["keyword_placeholder"],
            "status": s["status"], "createAt": s["create_at"],
        })
    return jsonify(paginated(items, total, page, page_size))


@lookout_bp.route("/sources/create", methods=["POST"])
@login_required
def create_source():
    body = request.get_json(silent=True) or {}
    ok, msg = LookoutService.create_source(
        body.get("name", ""), body.get("urlTemplate", ""),
        body.get("pnParam", "pn"), int(body.get("pageSize", 10)),
        body.get("keywordPlaceholder", "{}"),
    )
    return jsonify(success(None, msg) if ok else error(400, msg))


@lookout_bp.route("/sources/<int:source_id>", methods=["PUT"])
@login_required
def update_source(source_id):
    body = request.get_json(silent=True) or {}
    ok, msg = LookoutService.update_source(
        source_id, body.get("name", ""), body.get("urlTemplate", ""),
        body.get("pnParam", "pn"), int(body.get("pageSize", 10)),
        body.get("keywordPlaceholder", "{}"),
    )
    return jsonify(success(None, msg) if ok else error(400, msg))


@lookout_bp.route("/sources/<int:source_id>/delete", methods=["DELETE"])
@login_required
def delete_source(source_id):
    ok, msg = LookoutService.delete_source(source_id)
    return jsonify(success(None, msg) if ok else error(400, msg))


@lookout_bp.route("/collect", methods=["POST"])
@login_required
def collect():
    body = request.get_json(silent=True) or {}
    ok, msg, results = LookoutService.collect(
        int(body.get("sourceId", 0)), body.get("keyword", ""),
        int(body.get("page", 0)), int(body.get("pageSize", 0)),
    )
    if ok:
        return jsonify(success({"records": results}, msg))
    return jsonify(error(400, msg)), 400


@lookout_bp.route("/warehouse", methods=["GET"])
@login_required
def warehouse_list():
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("pageSize", "20"))
    source_id_str = request.args.get("sourceId", "")
    keyword = request.args.get("keyword", "")
    date_from = request.args.get("dateFrom", "")
    date_to = request.args.get("dateTo", "")
    sid = int(source_id_str) if source_id_str and source_id_str.isdigit() else None

    records, total = LookoutService.get_warehouse(
        page, page_size, source_id=sid,
        keyword=keyword, date_from=date_from, date_to=date_to,
    )
    items = []
    for r_raw in records:
        r = dict(r_raw)
        items.append({
            "id": r["id"], "sourceId": r["source_id"],
            "title": r["title"], "url": r["url"],
            "summary": r["summary"], "publishTime": r["publish_time"],
            "sourceName": r["source_name"], "keyword": r["keyword"],
            "collectedAt": r["collected_at"],
            "hasFullContent": bool(r.get("full_content", "")),
        })
    return jsonify(paginated(items, total, page, page_size))


@lookout_bp.route("/warehouse/<int:record_id>/delete", methods=["DELETE"])
@login_required
def delete_warehouse_record(record_id):
    ok = LookoutRecordRepository.delete(record_id)
    return jsonify(success(None, "删除成功") if ok else error(400, "删除失败"))


@lookout_bp.route("/deep-collect", methods=["POST"])
@login_required
def deep_collect():
    body = request.get_json(silent=True) or {}
    record_ids = body.get("recordIds", [])
    if not record_ids:
        return jsonify(error(400, "请选择要采集的数据记录")), 400
    try:
        task_id = DeepCollectTask.start(record_ids)
        return jsonify(success({"taskId": task_id}, "采集任务已启动"))
    except Exception as e:
        return jsonify(error(500, f"启动采集失败: {str(e)}")), 500


@lookout_bp.route("/deep-collect/progress", methods=["GET"])
@login_required
def deep_collect_progress():
    task_id = request.args.get("taskId", "")
    if not task_id:
        return jsonify(error(400, "缺少 taskId")), 400
    progress = DeepCollectTask.get_progress(task_id)
    return jsonify(success(progress))
