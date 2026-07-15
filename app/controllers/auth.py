"""
登录/注册/退出 控制器
已全部重定向到 React 前端 (http://localhost:5173)
"""
import os
from app.controllers.base import BaseHandler
from app.models.user import UserRepository

# React 前端地址（开发环境用 Vite 端口，生产环境替换为构建后的地址）
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


class LoginHandler(BaseHandler):
    """登录 - 重定向到 React 前端"""

    def get(self):
        self.redirect(FRONTEND_URL)

    def post(self):
        username = self.get_body_argument("username", "").strip()
        password = self.get_body_argument("password", "")

        if not username or not password:
            self.redirect(f"{FRONTEND_URL}/?mode=login&error=请输入用户名或密码")
            return

        if not UserRepository.verify_user(username, password):
            self.redirect(f"{FRONTEND_URL}/?mode=login&error=用户名或密码错误")
            return

        self.set_secure_cookie("username", username)
        self.redirect(f"{FRONTEND_URL}/?auto_login=1")


class RegisterHandler(BaseHandler):
    """注册 - 重定向到 React 前端"""

    def get(self):
        self.redirect(f"{FRONTEND_URL}/?mode=register")

    def post(self):
        username = self.get_body_argument("username", "").strip()
        password = self.get_body_argument("password", "")
        confirm_password = self.get_body_argument("confirm_password", "")

        if not username or not password:
            self.redirect(f"{FRONTEND_URL}/?mode=register&error=请输入用户名和密码")
            return

        if len(username) < 2:
            self.redirect(f"{FRONTEND_URL}/?mode=register&error=用户名至少2个字符")
            return

        if len(password) < 6:
            self.redirect(f"{FRONTEND_URL}/?mode=register&error=密码至少6个字符")
            return

        if password != confirm_password:
            self.redirect(f"{FRONTEND_URL}/?mode=register&error=两次密码输入不一致")
            return

        if UserRepository.get_user_by_username(username):
            self.redirect(f"{FRONTEND_URL}/?mode=register&error=用户名已存在")
            return

        if UserRepository.create_user(username, password, role_id=2):
            self.redirect(f"{FRONTEND_URL}/?mode=login&success=注册成功，请登录")
        else:
            self.redirect(f"{FRONTEND_URL}/?mode=register&error=注册失败，请稍后重试")


class LogoutHandler(BaseHandler):
    """退出登录"""

    def get(self):
        self.clear_cookie("username")
        self.redirect(FRONTEND_URL)

    def post(self):
        self.clear_cookie("username")
        self.redirect(FRONTEND_URL)
