import unittest
import os
import sys
import sqlite3

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.db import init_db, get_connection
from app.models.api_token import ApiTokenRepository
from app.models.digital_employee import DigitalEmployeeRepository
from app.models.skill import SkillRepository
from app.models.conversation import ConversationRepository, SessionRepository
from app.models.lookout import ScheduledTaskRepository
from app.models.user import UserRepository

class TestTeamTasks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Change DB path to test_app.db dynamically for testing
        import app.models.db as db_module
        cls.original_db_path = db_module.DB_PATH
        db_module.DB_PATH = os.path.join(db_module._project_root(), "database", "test_team.db")
        
        # Remove test db if exists
        if os.path.exists(db_module.DB_PATH):
            os.remove(db_module.DB_PATH)
            
        init_db()
        
        # 为了测试会话管理，先创建一个测试用户
        UserRepository.create_user("testuser_team", "123456")
        cls.test_user = UserRepository.get_user_by_username("testuser_team")

    @classmethod
    def tearDownClass(cls):
        import app.models.db as db_module
        if os.path.exists(db_module.DB_PATH):
            try:
                os.remove(db_module.DB_PATH)
            except Exception:
                pass
        db_module.DB_PATH = cls.original_db_path

    def test_01_api_token(self):
        # 测试组长负责的接口管理
        success, api_key = ApiTokenRepository.create("TestToken")
        self.assertTrue(success)
        self.assertIsNotNone(api_key)
        
        tokens, total = ApiTokenRepository.list_page(1, 10)
        self.assertGreater(total, 0)
        
        token = tokens[0]
        self.assertEqual(token["name"], "TestToken")
        
        # Toggle status
        res = ApiTokenRepository.toggle_status(token["id"])
        self.assertTrue(res)

    def test_02_skill_and_digital_employee(self):
        # 测试组员2负责的技能管理与数字员工管理
        # 1. 技能
        res = SkillRepository.create("TestSkill", "Skill Desc")
        self.assertTrue(res)
        
        skills, _ = SkillRepository.list(1, 10)
        self.assertGreater(len(skills), 0)
        skill_id = skills[0]["id"]
        
        # 2. 数字员工
        res = DigitalEmployeeRepository.create(
            name="TestEmployee", 
            avatar_url="http://test", 
            welcome_message="Hello", 
            system_prompt="Prompt", 
            skill_ids=[skill_id]
        )
        self.assertTrue(res)
        
        emp = DigitalEmployeeRepository.get_by_name("TestEmployee")
        self.assertIsNotNone(emp)
        self.assertEqual(emp["name"], "TestEmployee")
        self.assertEqual(len(emp["skills"]), 1)
        
        # 测试不能删除被引用的技能
        success, msg = SkillRepository.delete(skill_id)
        self.assertFalse(success)
        self.assertEqual(msg, "该技能已被数字员工使用，请先解除关联")

    def test_03_conversation_management(self):
        # 测试组员3负责的对话管理 (ConversationRepository)
        res = ConversationRepository.insert(self.test_user["id"], self.test_user["username"], "Q1", "A1", "Model1")
        self.assertTrue(res)
        
        rows, total = ConversationRepository.list_page(1, 10, keyword="Q1")
        self.assertEqual(total, 1)
        self.assertEqual(rows[0]["question"], "Q1")
        
        # 测试导出CSV
        csv_data = ConversationRepository.export_csv(keyword="Q1")
        self.assertIn("Q1", csv_data)
        self.assertIn("A1", csv_data)

    def test_04_session_management(self):
        # 测试组员1和组员2负责的会话管理 (SessionRepository)
        # 此时有可能会因为数据库字段不匹配报错
        try:
            session_id = SessionRepository.create_for_user(self.test_user["id"], "TestSession", "chat", None)
            self.assertIsNotNone(session_id)
            
            SessionRepository.add_message(session_id, "user", "Hello")
            SessionRepository.add_message(session_id, "ai", "World")
            
            sessions, total = SessionRepository.list(1, 10)
            self.assertGreaterEqual(total, 1)
            
            messages = SessionRepository.get_messages(session_id)
            self.assertEqual(len(messages), 2)
        except sqlite3.OperationalError as e:
            self.fail(f"Session management DB operation failed: {e}")

    def test_05_scheduled_tasks(self):
        """测试 ScheduledTaskRepository"""
        res = ScheduledTaskRepository.create("TestTask", "1", "Test", 1, "0 0 * * *")
        self.assertTrue(res)

        tasks, total = ScheduledTaskRepository.list_page(1, 10)
        self.assertGreaterEqual(total, 1)

        task = tasks[0]
        self.assertEqual(task["name"], "TestTask")

        ScheduledTaskRepository.toggle_status(task["id"])
        updated_task = ScheduledTaskRepository.get_by_id(task["id"])
        self.assertNotEqual(task["status"], updated_task["status"])

if __name__ == '__main__':
    unittest.main()
