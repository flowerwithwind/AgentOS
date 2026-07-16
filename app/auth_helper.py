"""
认证辅助：login_required 装饰器 + 用户信息获取

替代 Tornado 的 @tornado.web.authenticated 和 BaseHandler.get_user_id()
支持两种认证方式：
1. Session 认证（浏览器端）
2. Bearer Token 认证（API 调用）
"""
import functools
from flask import session, request, jsonify, g
from app.models.user import UserRepository
from app.middleware.auth_middleware import validate_api_token


def login_required(f):
    """要求登录的装饰器，未认证返回 401 JSON"""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        # 1. 检查 Session 认证
        username = session.get("username")
        if username:
            g.username = username
            return f(*args, **kwargs)

        # 2. 检查 Bearer Token 认证
        token_info = validate_api_token(request)
        if token_info:
            g.username = token_info.get("username", "api_user")
            g.api_token_id = token_info.get("id")
            return f(*args, **kwargs)

        return jsonify({"code": 401, "message": "未认证，请先登录"}), 401

    return decorated


def get_current_user_id():
    """获取当前登录用户的 ID，依赖 g.username 已设置"""
    username = g.get("username")
    if not username:
        return None
    user = UserRepository.get_user_by_username(username)
    return user["id"] if user else None
