# 用于登录/注册/退出 有关的控制层方法
import tornado.web
from app.controllers.base import BaseHandler
from app.models.user import UserRepository

class LoginHandler(BaseHandler):
	def get(self):
		self.render("login.html",title="登录",error=None)

	def post(self):
		username = self.get_body_argument("username","").strip()
		password = self.get_body_argument("password","")

		if not username or not password:
			self.set_status(400)
			return self.render("login.html",title="登录",error="请输入用户名或密码")

		if not UserRepository.verify_user(username,password):
			self.set_status(401)
			return self.render("login.html",title="登录",error="输入的用户名或密码错误")

		self.set_secure_cookie("username",username)
		self.redirect("/admin")

class RegisterHandler(BaseHandler):
    def get(self):
        self.render("register.html", title="注册", error=None, success=None)

    def post(self):
        username = self.get_body_argument("username", "").strip()
        password = self.get_body_argument("password", "")
        confirm_password = self.get_body_argument("confirm_password", "")

        # 校验
        if not username or not password:
            return self.render("register.html", title="注册",
                               error="请输入用户名和密码", success=None)

        if len(username) < 2:
            return self.render("register.html", title="注册",
                               error="用户名至少2个字符", success=None)

        if len(password) < 6:
            return self.render("register.html", title="注册",
                               error="密码至少6个字符", success=None)

        if password != confirm_password:
            return self.render("register.html", title="注册",
                               error="两次密码输入不一致", success=None)

        # 检查用户是否已存在
        if UserRepository.get_user_by_username(username):
            return self.render("register.html", title="注册",
                               error="用户名已存在", success=None)

        # 创建用户（默认角色 role_id=2 普通用户）
        if UserRepository.create_user(username, password, role_id=2):
            return self.render("register.html", title="注册",
                               error=None, success="注册成功，请前往登录")
        else:
            return self.render("register.html", title="注册",
                               error="注册失败，请稍后重试", success=None)

# 修复：大写开头 + 支持GET退出
class LogoutHandler(BaseHandler):
	def get(self):
		self.clear_cookie("username")
		self.redirect("/")

	def post(self):
		self.clear_cookie("username")
		self.redirect("/")