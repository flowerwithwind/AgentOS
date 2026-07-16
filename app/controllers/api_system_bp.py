"""
系统管理 Blueprint

替代 Tornado api_system.py + admin.py 中的 API Handler。
涵盖：用户、角色、权限、对话、会话、API Token、系统设置、数智大屏、数字员工按名称查询。
"""
import os
import uuid
from flask import Blueprint, request, jsonify, g
from app.utils.response import success, error, paginated
from app.models.user import UserRepository
from app.models.role import FunctionRepository, RoleRepository
from app.models.api_token import ApiTokenRepository
from app.models.conversation import ConversationRepository, SessionRepository
from app.models.system_settings import SystemSettingsRepository
from app.models.db import get_connection
from app.auth_helper import login_required

system_bp = Blueprint("system", __name__)


# ====== Users ======

@system_bp.route("/api/users", methods=["GET"])
@login_required
def list_users():
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("pageSize", "20"))
    users, total = UserRepository.list_users(page, page_size)
    items = [{"id": u["id"], "username": u["username"], "roleId": u["role_id"],
              "roleName": u["role_name"] or "普通用户", "createAt": u["create_at"]} for u in users]
    return jsonify(paginated(items, total, page, page_size))


@system_bp.route("/api/users/create", methods=["POST"])
@login_required
def create_user():
    body = request.get_json(silent=True) or {}
    username = body.get("username", "").strip()
    password = body.get("password", "")
    role_id = int(body.get("roleId", 2))
    if not username or not password:
        return jsonify(error(400, "用户名和密码不能为空")), 400
    ok = UserRepository.create_user(username, password, role_id)
    return jsonify(success(None, "创建成功") if ok else error(409, "用户名已存在"))


@system_bp.route("/api/users/<int:user_id>", methods=["PUT"])
@login_required
def update_user(user_id):
    body = request.get_json(silent=True) or {}
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()
    role_id = int(body.get("roleId", 2))
    if not username:
        return jsonify(error(400, "用户名不能为空")), 400
    ok = UserRepository.update_user(user_id, username, password or None)
    if ok:
        UserRepository.update_user_role(user_id, role_id)
        return jsonify(success(None, "更新成功"))
    return jsonify(error(400, "更新失败")), 400


@system_bp.route("/api/users/<int:user_id>/delete", methods=["DELETE"])
@login_required
def delete_user(user_id):
    ok = UserRepository.delete_user(user_id)
    return jsonify(success(None, "删除成功") if ok else error(400, "删除失败"))


# ====== Roles ======

@system_bp.route("/api/roles", methods=["GET"])
@login_required
def list_roles():
    roles = RoleRepository.list_all()
    items = [{"id": r["id"], "name": r["name"], "isSystem": r["is_system"],
              "userCount": RoleRepository.get_user_count(r["id"])} for r in roles]
    return jsonify(success(items))


@system_bp.route("/api/roles/create", methods=["POST"])
@login_required
def create_role():
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()
    if not name:
        return jsonify(error(400, "角色名称不能为空")), 400
    ok = RoleRepository.create(name)
    return jsonify(success(None, "创建成功") if ok else error(409, "角色名已存在"))


@system_bp.route("/api/roles/<int:role_id>/delete", methods=["DELETE"])
@login_required
def delete_role(role_id):
    ok = RoleRepository.delete(role_id)
    return jsonify(success(None, "删除成功") if ok else error(400, "系统角色不可删除或不存在"))


# ====== Permissions ======

@system_bp.route("/api/permissions/roles", methods=["GET"])
@login_required
def permission_roles():
    roles = RoleRepository.list_all()
    items = [{"id": r["id"], "name": r["name"]} for r in roles]
    return jsonify(success(items))


@system_bp.route("/api/permissions/functions", methods=["GET"])
@login_required
def permission_functions():
    role_id = int(request.args.get("roleId", "0"))
    funcs = FunctionRepository.list_all()
    granted = set(RoleRepository.get_permissions(role_id)) if role_id else set()

    func_map = {}
    tree = []
    for f in funcs:
        item = dict(id=f["id"], name=f["name"], parentId=f["parent_id"],
                    key=str(f["id"]), children=[])
        func_map[f["id"]] = item
        if f["parent_id"] == 0:
            tree.append(item)
        elif f["parent_id"] in func_map:
            if "children" not in func_map[f["parent_id"]]:
                func_map[f["parent_id"]]["children"] = []
            func_map[f["parent_id"]]["children"].append(item)

    # 标记已授权
    def mark_checked(items_list):
        for it in items_list:
            it["checked"] = it["id"] in granted
            if it.get("children"):
                mark_checked(it["children"])
    mark_checked(tree)

    return jsonify(success(tree))


@system_bp.route("/api/permissions/save", methods=["POST"])
@login_required
def permission_save():
    body = request.get_json(silent=True) or {}
    role_id = int(body.get("roleId", 0))
    function_ids = [int(x) for x in body.get("functionIds", [])]
    RoleRepository.set_permissions(role_id, function_ids)
    return jsonify(success(None, "保存成功"))


# ====== Conversations ======

@system_bp.route("/api/conversations", methods=["GET"])
@login_required
def list_conversations():
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("pageSize", "20"))
    username = request.args.get("username", "")
    keyword = request.args.get("keyword", "")
    date_from = request.args.get("dateFrom", "")
    date_to = request.args.get("dateTo", "")
    records, total = ConversationRepository.list_page(
        page, page_size, username=username, keyword=keyword,
        date_from=date_from, date_to=date_to,
    )
    items = [dict(r) for r in records]
    return jsonify(paginated(items, total, page, page_size))


@system_bp.route("/api/conversations/export", methods=["GET"])
@login_required
def export_conversations():
    username = request.args.get("username", "")
    keyword = request.args.get("keyword", "")
    date_from = request.args.get("dateFrom", "")
    date_to = request.args.get("dateTo", "")
    csv_content = ConversationRepository.export_csv(
        username=username, keyword=keyword, date_from=date_from, date_to=date_to,
    )
    from flask import Response
    return Response(
        csv_content,
        mimetype="text/csv; charset=utf-8-sig",
        headers={"Content-Disposition": "attachment; filename=conversations.csv"},
    )


# ====== Sessions ======

@system_bp.route("/api/sessions", methods=["GET"])
@login_required
def list_sessions():
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("pageSize", "10"))
    keyword = request.args.get("keyword", "").strip()
    date_from = request.args.get("dateFrom", "").strip()
    date_to = request.args.get("dateTo", "").strip()
    sessions, total = SessionRepository.list(page, page_size, keyword, date_from, date_to)
    items = []
    for s in sessions:
        items.append({
            "id": s["id"], "userId": s["user_id"], "username": s["username"],
            "title": s["title"], "messageCount": s["message_count"],
            "startTime": s["start_time"], "endTime": s.get("end_time", ""),
            "createdAt": s["created_at"],
        })
    return jsonify(paginated(items, total, page, page_size))


@system_bp.route("/api/sessions/<int:session_id>/messages", methods=["GET"])
@login_required
def session_messages(session_id):
    conv = SessionRepository.get_by_id(session_id)
    if not conv:
        return jsonify(error(404, "会话不存在")), 404
    messages = SessionRepository.get_messages(session_id)
    return jsonify(success({"conversation": dict(conv), "messages": [dict(m) for m in messages]}))


@system_bp.route("/api/sessions/<int:session_id>/delete", methods=["DELETE"])
@login_required
def delete_session(session_id):
    ok, msg = SessionRepository.delete(session_id)
    return jsonify(success(None, msg) if ok else error(400, msg))


# ====== API Tokens ======

@system_bp.route("/api/tokens", methods=["GET"])
@login_required
def list_tokens():
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("pageSize", "15"))
    tokens, total = ApiTokenRepository.list_page(page, page_size)
    items = [{"id": t["id"], "name": t["name"], "apiKey": t["api_key"],
              "status": t["status"], "callCount": t["call_count"],
              "createAt": t["create_at"]} for t in tokens]
    return jsonify(paginated(items, total, page, page_size))


@system_bp.route("/api/tokens/create", methods=["POST"])
@login_required
def create_token():
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()
    if not name:
        return jsonify(error(400, "名称不能为空")), 400
    ok, api_key = ApiTokenRepository.create(name)
    if ok:
        return jsonify(success({"apiKey": api_key}, "创建成功"))
    return jsonify(error(400, "创建失败")), 400


@system_bp.route("/api/tokens/<int:token_id>/delete", methods=["DELETE"])
@login_required
def delete_token(token_id):
    ok = ApiTokenRepository.delete(token_id)
    return jsonify(success(None, "删除成功") if ok else error(400, "删除失败"))


# ====== Settings ======

@system_bp.route("/api/settings", methods=["GET"])
def get_settings():
    """无需认证，用于前端获取公开设置"""
    settings = SystemSettingsRepository.get_all()
    return jsonify(success(settings))


@system_bp.route("/api/settings/update", methods=["PUT"])
@login_required
def update_settings():
    body = request.get_json(silent=True) or {}
    SystemSettingsRepository.set_multi(body)
    return jsonify(success(None, "保存成功"))


@system_bp.route("/api/settings/logo", methods=["POST"])
@login_required
def upload_logo():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    upload_dir = os.path.join(base_dir, "app", "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file = request.files.get("file")
    if not file:
        return jsonify(error(400, "未选择文件")), 400

    ext = os.path.splitext(file.filename)[1] or ".png"
    filename = f"logo_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    logo_url = f"/static/uploads/{filename}"
    SystemSettingsRepository.set("site_logo", logo_url)
    return jsonify(success({"url": logo_url}, "上传成功"))


# ====== Big Screen ======

@system_bp.route("/api/bigscreen", methods=["GET"])
@login_required
def bigscreen():
    with get_connection() as conn:
        user_count = conn.execute("SELECT COUNT(*) AS cnt FROM users").fetchone()["cnt"]
        model_count = conn.execute("SELECT COUNT(*) AS cnt FROM models").fetchone()["cnt"]
        record_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_records").fetchone()["cnt"]
        source_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_sources").fetchone()["cnt"]
        source_stats = [dict(r) for r in conn.execute(
            "SELECT s.name, COUNT(lr.id) AS value FROM lookout_sources s "
            "LEFT JOIN lookout_records lr ON lr.source_id = s.id "
            "GROUP BY s.id ORDER BY value DESC"
        ).fetchall()]
        trend = [dict(r) for r in conn.execute(
            "SELECT date(collected_at) AS date, COUNT(*) AS count FROM lookout_records "
            "WHERE collected_at >= datetime('now', '-7 days') GROUP BY date ORDER BY date"
        ).fetchall()]
        model_stats = [dict(r) for r in conn.execute(
            "SELECT name, total_tokens AS tokens, total_calls AS calls FROM models ORDER BY total_tokens DESC"
        ).fetchall()]

    return jsonify(success({
        "userCount": user_count, "modelCount": model_count,
        "recordCount": record_count, "sourceCount": source_count,
        "sourceStats": source_stats, "trend": trend, "modelStats": model_stats,
    }))


# ====== Digital Employee by name (用户侧接口) ======

@system_bp.route("/api/digital_employee/by_name", methods=["GET"])
@login_required
def digital_employee_by_name():
    from app.models.digital_employee import DigitalEmployeeRepository
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify(error(400, "缺少名称参数")), 400
    emp = DigitalEmployeeRepository.get_by_name(name)
    if emp:
        return jsonify(success(emp))
    return jsonify(error(404, "数字员工不存在")), 404
