"""
仪表盘 Blueprint

替代 Tornado api_dashboard.py：
- GET /api/dashboard/stats    仪表盘统计数据
- GET /api/menus              当前用户可见菜单
"""
from flask import Blueprint, jsonify, g
from app.utils.response import success
from app.models.db import get_connection
from app.models.user import UserRepository
from app.models.role import RoleRepository
from app.auth_helper import login_required

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/stats", methods=["GET"])
@login_required
def dashboard_stats():
    with get_connection() as conn:
        user_count = conn.execute("SELECT COUNT(*) AS cnt FROM users").fetchone()["cnt"]
        model_count = conn.execute("SELECT COUNT(*) AS cnt FROM models").fetchone()["cnt"]
        source_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_sources").fetchone()["cnt"]
        record_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_records").fetchone()["cnt"]
        api_token_count = conn.execute("SELECT COUNT(*) AS cnt FROM api_tokens").fetchone()["cnt"]

        recent_users = []
        for r in conn.execute(
            "SELECT u.id, u.username, u.create_at, COALESCE(r.name,'普通用户') AS role_name "
            "FROM users u LEFT JOIN roles r ON r.id = u.role_id ORDER BY u.id DESC LIMIT 5"
        ).fetchall():
            recent_users.append(dict(r))

        recent_records = []
        for r in conn.execute(
            "SELECT id, title, source_name, keyword, collected_at "
            "FROM lookout_records ORDER BY id DESC LIMIT 5"
        ).fetchall():
            recent_records.append(dict(r))

    return jsonify(success({
        "userCount": user_count,
        "modelCount": model_count,
        "sourceCount": source_count,
        "recordCount": record_count,
        "apiTokenCount": api_token_count,
        "recentUsers": recent_users,
        "recentRecords": recent_records,
    }))


@dashboard_bp.route("/api/menus", methods=["GET"])
@login_required
def menus():
    username = g.username
    user = UserRepository.get_user_by_username(username)
    role_id = user["role_id"] if user else 2
    menus_list = RoleRepository.get_menus_for_role(role_id)

    menu_map = {}
    tree = []
    for m in menus_list:
        item = dict(
            id=m["id"], name=m["name"], icon=m["icon"],
            url=m["url"], parentId=m["parent_id"], children=[],
        )
        menu_map[m["id"]] = item
        if m["parent_id"] == 0:
            tree.append(item)
        elif m["parent_id"] in menu_map:
            menu_map[m["parent_id"]]["children"].append(item)

    return jsonify(success(tree))
