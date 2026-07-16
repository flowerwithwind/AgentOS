"""
RBAC 权限校验中间件

提供 require_permission 装饰器，基于用户角色-功能权限校验。
Flask 版本：依赖 Flask g 对象获取当前用户。
"""
import functools
from flask import g, jsonify
from app.models.user import UserRepository
from app.models.role import RoleRepository


def require_permission(permission_code: str):
    """权限校验装饰器

    用法：
        @login_required
        @require_permission("user:view")
        def my_view():
            ...
    """
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            username = g.get("username")
            if not username:
                return jsonify({"code": 401, "message": "未认证"}), 401

            # 超级管理员跳过权限检查（role_id = 1）
            user_info = UserRepository.get_user_by_username(username)
            if user_info and user_info["role_id"] == 1:
                return f(*args, **kwargs)

            # 查询角色权限
            role_id = user_info["role_id"] if user_info else 2
            perms = RoleRepository.get_permissions_for_role(role_id)
            if "*" in perms or permission_code in perms:
                return f(*args, **kwargs)

            return jsonify({"code": 403, "message": "无权限访问"}), 403
        return wrapper
    return decorator
