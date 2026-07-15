"""
基类：
- tornado.web.RequestHandler
- 处理cookie / session / token
- @authenticated
"""
import json
import time
import functools

import tornado.web

from app.utils.response import success, error


def api_authenticated(method):
    """API 路由专用认证装饰器，返回 JSON 而非重定向"""
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        if not self.get_current_user():
            self.set_status(401)
            self.write(error(401, "未认证，请先登录"))
            return
        return method(self, *args, **kwargs)
    return wrapper


class BaseHandler(tornado.web.RequestHandler):

    def prepare(self):
        """API 路由：未认证直接返回 JSON"""
        if self.request.path.startswith("/api/"):
            if not self.get_current_user():
                # 跳过不需要认证的 API 路由
                skip_auth = ["/api/auth/login", "/api/auth/register", "/api/auth/oauth/", "/api/settings"]
                if not any(self.request.path.startswith(p) for p in skip_auth):
                    self.set_status(401)
                    self.write(error(401, "未认证，请先登录"))
                    self.finish()
                    return
        super().prepare()

    def set_default_headers(self):
        """CORS 头设置"""
        origin = self.request.headers.get("Origin", "")
        if origin:
            self.set_header("Access-Control-Allow-Origin", origin)
        else:
            self.set_header("Access-Control-Allow-Origin", "http://localhost:5173")
        self.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        self.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.set_header("Access-Control-Allow-Credentials", "true")
        self.set_header("Access-Control-Max-Age", "3600")

    def check_xsrf_cookie(self):
        """API 路由跳过 XSRF 校验"""
        if self.request.path.startswith("/api/"):
            return
        super().check_xsrf_cookie()

    def get_login_url(self):
        """API 路由：未认证返回 JSON 而非重定向"""
        if self.request.path.startswith("/api/"):
            return ""
        return super().get_login_url()

    def _handle_request_exception(self, exc):
        """API 路由：异常返回 JSON"""
        if self.request.path.startswith("/api/"):
            if hasattr(exc, "status_code"):
                code = exc.status_code
            else:
                code = 500
            self.set_status(code)
            self.write({"code": code, "message": str(exc), "data": None, "timestamp": int(time.time())})
            self.finish()
            return
        super()._handle_request_exception(exc)

    def options(self):
        """CORS 预检请求"""
        self.set_status(204)
        self.finish()

    def get_current_user(self):
        username = self.get_secure_cookie("username")
        if not username:
            return None
        if isinstance(username, bytes):
            return username.decode("utf-8")
        return username

    def write(self, chunk):
        """重写 write，自动将 datetime 等非 JSON 可序列化对象转为字符串"""
        if isinstance(chunk, (dict, list)):
            chunk = json.dumps(chunk, ensure_ascii=False, default=str)
            self.set_header("Content-Type", "application/json; charset=utf-8")
        super().write(chunk)

    def write_json(self, code=0, msg="", data=None, count=None, **extra):
        payload = {"code": code, "msg": msg}
        if data is not None:
            payload["data"] = data
        if count is not None:
            payload["count"] = count
        payload.update(extra)
        self.set_header("Content-Type", "application/json; charset=utf-8")
        self.write(payload)

    def json_ok(self, msg="", data=None, count=None, **extra):
        self.write_json(0, msg, data, count, **extra)

    def json_fail(self, msg, code=1):
        self.write_json(code, msg)

    def get_json(self):
        try:
            return json.loads(self.request.body or b"{}")
        except json.JSONDecodeError:
            return {}

    def get_int_argument(self, name, default=None):
        if default is None:
            return int(self.get_argument(name))
        return int(self.get_argument(name, str(default)))

    def get_user_id(self):
        from app.models.user import UserRepository
        user = UserRepository.get_user_by_username(self.current_user)
        return user["id"] if user else None
