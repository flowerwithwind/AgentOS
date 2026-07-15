"""
后端集成测试：认证 API

运行方式：
    conda run -n software python -m pytest tests/integration/test_auth_api.py -v
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import json
from tornado.testing import AsyncHTTPTestCase


class TestAuthAPI(AsyncHTTPTestCase):
    """认证 API 集成测试"""

    def get_app(self):
        from app.models.db import init_db
        init_db()
        import importlib.util
        spec = importlib.util.spec_from_file_location("app_module", os.path.join(os.path.dirname(__file__), "..", "..", "app.py"))
        app_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(app_module)
        return app_module.make_app()

    def test_login_page_get(self):
        """测试登录页面 GET 请求返回 200"""
        response = self.fetch("/auth/login", method="GET")
        self.assertEqual(response.code, 200)

    def test_login_empty_credentials(self):
        """测试空用户名的登录"""
        response = self.fetch(
            "/api/auth/login",
            method="POST",
            body=json.dumps({"username": "", "password": ""}),
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(response.code, 200)
        data = json.loads(response.body)
        self.assertEqual(data["code"], 400)

    def test_login_wrong_password(self):
        """测试错误密码"""
        response = self.fetch(
            "/api/auth/login",
            method="POST",
            body=json.dumps({"username": "admin", "password": "wrongpass"}),
            headers={"Content-Type": "application/json"},
        )
        data = json.loads(response.body)
        self.assertEqual(data["code"], 401)

    def test_unauthenticated_api_access(self):
        """测试未认证 API 返回 401"""
        response = self.fetch("/api/users", method="GET")
        data = json.loads(response.body)
        self.assertEqual(data["code"], 401)
