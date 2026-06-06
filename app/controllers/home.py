# admin 控制层
import tornado.web
from app.controllers.base import BaseHandler

class AdminHandler(BaseHandler):
	"""后台主页 - 占位页面"""
	@tornado.web.authenticated
	def get(self):
		username = self.current_user if self.current_user else ""
		self.render("admin_dashboard.html", title="后台首页")
