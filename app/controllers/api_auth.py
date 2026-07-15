import tornado.web
import json
from app.controllers.base import BaseHandler
from app.services.auth_service import AuthService
from app.utils.response import success, error


class LoginApiHandler(BaseHandler):
    def post(self):
        body = self.get_json()
        username = body.get("username", "")
        password = body.get("password", "")
        if not username or not password:
            self.write(error(400, "用户名和密码不能为空"))
            return
        result = AuthService.authenticate(username, password)
        if not result:
            self.write(error(401, "用户名或密码错误"))
            return
        self.set_secure_cookie("username", username)
        user_info = AuthService.get_user_info(username)
        self.write(success(user_info))


class RegisterApiHandler(BaseHandler):
    def post(self):
        body = self.get_json()
        username = body.get("username", "")
        password = body.get("password", "")
        confirm = body.get("confirmPassword", "")
        if not username or not password:
            self.write(error(400, "用户名和密码不能为空"))
            return
        if password != confirm:
            self.write(error(400, "两次输入的密码不一致"))
            return
        ok, msg = AuthService.register(username, password)
        if ok:
            self.write(success({"username": username}, msg))
        else:
            self.write(error(422, msg))


class MeApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        username = self.current_user
        if isinstance(username, bytes):
            username = username.decode("utf-8")
        user_info = AuthService.get_user_info(username)
        if user_info:
            self.write(success(user_info))
        else:
            self.write(error(404, "用户不存在"))


class LogoutApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        self.clear_cookie("username")
        self.write(success(None, "已退出登录"))
