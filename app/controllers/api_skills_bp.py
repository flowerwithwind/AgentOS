"""
技能管理 Blueprint

替代 Tornado api_skills.py：
- GET  /skills            技能列表（分页）
- GET  /skills/all        全部技能（选项用）
- POST /skills/create     创建技能
- PUT  /skills/<id>       更新技能
- DELETE /skills/<id>/delete  删除技能
"""
from flask import Blueprint, request, jsonify
from app.utils.response import success, error, paginated
from app.models.skill import SkillRepository
from app.auth_helper import login_required

skills_bp = Blueprint("skills", __name__)


@skills_bp.route("", methods=["GET"])
@login_required
def list_skills():
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("pageSize", "10"))
    keyword = request.args.get("keyword", "").strip()
    skills_list, total = SkillRepository.list(page, page_size, keyword)
    items = [
        {"id": s["id"], "name": s["name"], "description": s["description"], "createAt": s["create_at"]}
        for s in skills_list
    ]
    return jsonify(paginated(items, total, page, page_size))


@skills_bp.route("/all", methods=["GET"])
@login_required
def all_skills():
    skills_list = SkillRepository.get_all()
    items = [{"id": s["id"], "name": s["name"]} for s in skills_list]
    return jsonify(success(items))


@skills_bp.route("/create", methods=["POST"])
@login_required
def create_skill():
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()
    description = body.get("description", "").strip()
    if not name:
        return jsonify(error(400, "技能名称不能为空")), 400
    ok = SkillRepository.create(name, description)
    return jsonify(success(None, "创建成功") if ok else error(400, "创建失败"))


@skills_bp.route("/<int:skill_id>", methods=["PUT"])
@login_required
def update_skill(skill_id):
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()
    description = body.get("description", "").strip()
    if not name:
        return jsonify(error(400, "技能名称不能为空")), 400
    ok = SkillRepository.update(skill_id, name, description)
    return jsonify(success(None, "更新成功") if ok else error(400, "更新失败"))


@skills_bp.route("/<int:skill_id>/delete", methods=["DELETE"])
@login_required
def delete_skill(skill_id):
    ok, msg = SkillRepository.delete(skill_id)
    return jsonify(success(None, msg) if ok else error(400, msg))
