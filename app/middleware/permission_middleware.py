"""
RBAC 权限校验中间件

提供 require_permission 装饰器，基于用户角色-功能权限校验。
"""
import functools
import tornado.web
from app.models.user import UserRepository


# URL 到权限码的映射表
URL_PERMISSION_MAP = {
    "/api/users": {"GET": "user:view", "POST": "user:create", "PUT": "user:edit", "DELETE": "user:delete"},
    "/api/digital-employees": {"GET": "digital-employee:view", "POST": "digital-employee:create",
                                "PUT": "digital-employee:edit", "DELETE": "digital-employee:delete"},
    "/api/models": {"GET": "model:view", "POST": "model:create", "PUT": "model:edit", "DELETE": "model:delete"},
    "/api/skills": {"GET": "skill:view", "POST": "skill:create", "PUT": "skill:edit", "DELETE": "skill:delete"},
    "/api/lookout": {"GET": "lookout:view", "POST": "lookout:collect", "DELETE": "lookout:delete"},
    "/api/sentiment": {"GET": "sentiment:view", "POST": "sentiment:edit"},
    "/api/monitor": {"GET": "monitor:view"},
    "/api/workflows": {"GET": "workflow:view", "POST": "workflow:create",
                        "PUT": "workflow:edit", "DELETE": "workflow:delete"},
    "/api/knowledge": {"GET": "knowledge:view", "POST": "knowledge:create", "DELETE": "knowledge:delete"},
    "/api/settings": {"GET": "system:view", "PUT": "system:edit", "POST": "system:edit"},
    "/api/conversations": {"GET": "conversation:view"},
    "/api/sessions": {"GET": "session:view", "DELETE": "session:delete"},
}


def get_required_permission(path: str, method: str) -> str | None:
    """根据 URL 路径和 HTTP 方法获取需要的权限码"""
    # 精确匹配
    if path in URL_PERMISSION_MAP:
        return URL_PERMISSION_MAP[path].get(method)
    # 前缀匹配（如 /api/lookout/sources 匹配 /api/lookout）
    for prefix, perm_map in URL_PERMISSION_MAP.items():
        if path.startswith(prefix):
            return perm_map.get(method)
    return None


def require_permission(permission_code: str):
    """权限校验装饰器

    用法：
        class UserListHandler(BaseHandler):
            @tornado.web.authenticated
            @require_permission("user:view")
            def get(self):
                ...
    """
    def decorator(method):
        @functools.wraps(method)
        def wrapper(self, *args, **kwargs):
            user = self.get_current_user()
            if not user:
                self.set_status(401)
                self.write({"code": 401, "message": "未认证"})
                return

            # 超级管理员跳过权限检查（role_id = 1）
            user_info = UserRepository.get_user_by_username(user)
            if user_info and user_info["role_id"] == 1:
                return method(self, *args, **kwargs)

            # 查询角色权限
            from app.models.role import RoleRepository
            role_id = user_info["role_id"] if user_info else 2
            perms = RoleRepository.get_permissions_for_role(role_id)
            if "*" in perms or permission_code in perms:
                return method(self, *args, **kwargs)

            self.set_status(403)
            self.write({"code": 403, "message": "无权限访问"})
        return wrapper
    return decorator
