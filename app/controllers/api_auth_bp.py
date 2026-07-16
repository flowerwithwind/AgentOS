"""
API 认证 Blueprint

替代 Tornado api_auth.py：
- POST /login     登录
- POST /register  注册
- GET  /me        当前用户信息
- POST /logout    退出登录
"""
from flask import Blueprint, request, jsonify, session
from app.services.auth_service import AuthService
from app.utils.response import success, error
from app.auth_helper import login_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    username = body.get("username", "")
    password = body.get("password", "")
    if not username or not password:
        return jsonify(error(400, "用户名和密码不能为空")), 400

    result = AuthService.authenticate(username, password)
    if not result:
        return jsonify(error(401, "用户名或密码错误")), 401

    session["username"] = username
    user_info = AuthService.get_user_info(username)
    return jsonify(success(user_info))


@auth_bp.route("/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}
    username = body.get("username", "")
    password = body.get("password", "")
    confirm = body.get("confirmPassword", "")
    if not username or not password:
        return jsonify(error(400, "用户名和密码不能为空")), 400
    if password != confirm:
        return jsonify(error(400, "两次输入的密码不一致")), 400

    ok, msg = AuthService.register(username, password)
    if ok:
        return jsonify(success({"username": username}, msg))
    return jsonify(error(422, msg)), 422


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    from flask import g
    username = g.username
    user_info = AuthService.get_user_info(username)
    if user_info:
        return jsonify(success(user_info))
    return jsonify(error(404, "用户不存在")), 404


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    session.pop("username", None)
    return jsonify(success(None, "已退出登录"))
