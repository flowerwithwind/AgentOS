import unittest
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.db import init_db, get_connection
from app.models.user import UserRepository
from app.models.role import RoleRepository, FunctionRepository
from app.models.model import ModelRepository
from app.models.lookout import LookoutSourceRepository, LookoutRecordRepository

class TestCompletedModules(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Change DB path to test_app.db dynamically for testing
        import app.models.db as db_module
        cls.original_db_path = db_module.DB_PATH
        db_module.DB_PATH = os.path.join(db_module._project_root(), "database", "test_app.db")
        
        # Remove test db if exists
        if os.path.exists(db_module.DB_PATH):
            os.remove(db_module.DB_PATH)
            
        init_db()

    @classmethod
    def tearDownClass(cls):
        import app.models.db as db_module
        if os.path.exists(db_module.DB_PATH):
            try:
                os.remove(db_module.DB_PATH)
            except Exception:
                pass
        db_module.DB_PATH = cls.original_db_path

    def test_01_user_and_auth(self):
        # 1. 登录/认证 (Login/Authentication) 和 用户管理 (User Management)
        # Create user
        res = UserRepository.create_user("testuser", "password123")
        self.assertTrue(res, "User creation failed")
        
        # Verify user right password
        self.assertTrue(UserRepository.verify_user("testuser", "password123"))
        
        # Verify user wrong password
        self.assertFalse(UserRepository.verify_user("testuser", "wrongpassword"))
        
        # Get user
        user = UserRepository.get_user_by_username("testuser")
        self.assertIsNotNone(user)
        self.assertEqual(user["username"], "testuser")

    def test_02_role_and_permission(self):
        # 2. 角色管理 (Role Management) 和 功能管理 (Function Management) 和 权限管理 (Permission Management)
        # Create Role
        res = RoleRepository.create("TestRole")
        self.assertTrue(res)
        
        roles = RoleRepository.list_all()
        role = next((r for r in roles if r["name"] == "TestRole"), None)
        self.assertIsNotNone(role)
        role_id = role["id"]
        
        # Create Function
        FunctionRepository.create("TestFunc", "icon", "/test", 0, 1, 1)
        funcs = FunctionRepository.list_all()
        func = next((f for f in funcs if f["name"] == "TestFunc"), None)
        self.assertIsNotNone(func)
        func_id = func["id"]
        
        # Set Permissions
        RoleRepository.set_permissions(role_id, [func_id])
        perms = RoleRepository.get_permissions(role_id)
        self.assertIn(func_id, perms)
        
        # Get Menus
        menus = RoleRepository.get_menus_for_role(role_id)
        self.assertTrue(any(m["id"] == func_id for m in menus))

    def test_03_model_engine(self):
        # 3. 模型引擎 (Model Engine)
        # Create Model
        res = ModelRepository.create("TestModel", "sk-123", "http://test", "test-model-name")
        self.assertTrue(res)
        
        models = ModelRepository.list_all()
        model = next((m for m in models if m["name"] == "TestModel"), None)
        self.assertIsNotNone(model)
        
        # Set Default
        ModelRepository.set_default(model["id"])
        default_model = ModelRepository.get_default()
        self.assertIsNotNone(default_model)
        self.assertEqual(default_model["id"], model["id"])
        
        # Record Usage
        ModelRepository.record_usage(model["id"], 100)
        updated_model = ModelRepository.get_by_id(model["id"])
        self.assertEqual(updated_model["total_tokens"], 100)
        self.assertEqual(updated_model["total_calls"], 1)

    def test_04_lookout_source_and_warehouse(self):
        # 4. 瞭望源管理 (Lookout Source Management), 瞭望采集 (Lookout Collect) 和 数据仓库 (Data Warehouse)
        # Create Source
        res = LookoutSourceRepository.create("TestSource", "http://test/{}", "pn", 10, "", "", "{}")
        self.assertTrue(res)
        
        sources, total = LookoutSourceRepository.list_page(1, 10)
        self.assertGreater(total, 0)
        source = sources[0]
        
        # Create Record (simulate collect)
        records = [{
            "source_id": source["id"],
            "title": "Test Title",
            "url": "http://test/1",
            "summary": "Test Summary",
            "publish_time": "2023-01-01",
            "source_name": "TestSource",
            "keyword": "Test"
        }]
        LookoutRecordRepository.batch_insert(records)
        
        # Data Warehouse Filter
        recs, total_recs = LookoutRecordRepository.list_page(1, 10, keyword="Test")
        self.assertGreaterEqual(total_recs, 1)
        self.assertEqual(recs[0]["title"], "Test Title")

if __name__ == '__main__':
    unittest.main()
