"""
基类：
- tornado.web.RequestHandler
- 处理cookie / session / token
- @authenticated
"""
import json

import tornado.web


class BaseHandler(tornado.web.RequestHandler):
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
