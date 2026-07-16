"""
数字员工 Blueprint

替代 Tornado api_digital_employees.py：
- GET  /digital-employees             列表（分页）
- POST /digital-employees/create      创建
- PUT  /digital-employees/<id>        更新
- DELETE /digital-employees/<id>/delete  删除
- GET  /digital-employees/<id>/detail  详情
"""
from flask import Blueprint, request, jsonify
from app.utils.response import success, error, paginated
from app.models.digital_employee import DigitalEmployeeRepository
from app.auth_helper import login_required

digital_employees_bp = Blueprint("digital_employees", __name__)


@digital_employees_bp.route("", methods=["GET"])
@login_required
def list_employees():
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("pageSize", "10"))
    keyword = request.args.get("keyword", "").strip()
    employees, total = DigitalEmployeeRepository.list(page, page_size, keyword)
    items = []
    for e in employees:
        items.append({
            "id": e["id"], "name": e["name"],
            "avatarUrl": e["avatar_url"],
            "welcomeMessage": e["welcome_message"],
            "systemPrompt": e["system_prompt"],
            "status": e["status"],
            "skillNames": e["skill_names"],
            "createAt": e["create_at"],
        })
    return jsonify(paginated(items, total, page, page_size))


@digital_employees_bp.route("/create", methods=["POST"])
@login_required
def create_employee():
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()
    if not name:
        return jsonify(error(400, "数字员工名称不能为空")), 400
    ok = DigitalEmployeeRepository.create(
        name, body.get("avatarUrl", ""), body.get("welcomeMessage", ""),
        body.get("systemPrompt", ""), body.get("skillIds", []),
    )
    return jsonify(success(None, "创建成功") if ok else error(400, "名称已存在或创建失败"))


@digital_employees_bp.route("/<int:employee_id>", methods=["PUT"])
@login_required
def update_employee(employee_id):
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()
    if not name:
        return jsonify(error(400, "数字员工名称不能为空")), 400
    ok = DigitalEmployeeRepository.update(
        employee_id, name, body.get("avatarUrl", ""),
        body.get("welcomeMessage", ""), body.get("systemPrompt", ""),
        body.get("skillIds", []),
    )
    return jsonify(success(None, "更新成功") if ok else error(400, "更新失败"))


@digital_employees_bp.route("/<int:employee_id>/delete", methods=["DELETE"])
@login_required
def delete_employee(employee_id):
    ok = DigitalEmployeeRepository.delete(employee_id)
    return jsonify(success(None, "删除成功") if ok else error(400, "删除失败"))


@digital_employees_bp.route("/<int:employee_id>/detail", methods=["GET"])
@login_required
def get_employee_detail(employee_id):
    employee = DigitalEmployeeRepository.get_by_id(employee_id)
    if employee:
        return jsonify(success(employee))
    return jsonify(error(404, "数字员工不存在")), 404
