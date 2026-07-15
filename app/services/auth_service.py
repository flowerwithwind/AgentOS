"""
认证服务：登录/注册业务逻辑
"""
import hashlib
import os
from app.models.user import UserRepository
from app.utils.validators import validate_password, validate_username


class AuthService:

    @staticmethod
    def authenticate(username: str, password: str) -> dict | None:
        """验证用户登录（委派给 UserRepository.verify_user）"""
        from app.models.user import UserRepository
        if UserRepository.verify_user(username, password):
            user = UserRepository.get_user_by_username(username)
            return {
                "id": user["id"],
                "username": user["username"],
                "roleId": user["role_id"],
            }
        return None

    @staticmethod
    def register(username: str, password: str) -> tuple[bool, str]:
        """注册新用户"""
        valid, msg = validate_username(username)
        if not valid:
            return False, msg

        valid, msg = validate_password(password)
        if not valid:
            return False, msg

        existing = UserRepository.get_user_by_username(username)
        if existing:
            return False, "用户名已存在"

        ok = UserRepository.create_user(username, password, role_id=2)
        if ok:
            return True, "注册成功"
        return False, "注册失败"

    @staticmethod
    def get_user_info(username: str) -> dict | None:
        """获取用户信息（含角色和权限）"""
        user = UserRepository.get_user_by_username(username)
        if not user:
            return None

        from app.models.role import RoleRepository
        role = RoleRepository.get_by_id(user["role_id"])
        perms = RoleRepository.get_permissions_for_role(user["role_id"])

        return {
            "id": user["id"],
            "username": user["username"],
            "roleId": user["role_id"],
            "roleName": role["name"] if role else "普通用户",
            "permissions": ["*"] if user["role_id"] == 1 else list(perms),
        }
