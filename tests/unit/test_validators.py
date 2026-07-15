"""
后端单元测试：密码校验、用户服务
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.utils.validators import validate_password, validate_username


class TestValidators:
    """密码强度与用户名校验测试"""

    def test_password_too_short(self):
        ok, msg = validate_password("Ab1")
        assert not ok
        assert "8位" in msg

    def test_password_no_upper(self):
        ok, msg = validate_password("abcdefg1")
        assert not ok
        assert "大写字母" in msg

    def test_password_no_lower(self):
        ok, msg = validate_password("ABCDEFG1")
        assert not ok
        assert "小写字母" in msg

    def test_password_no_digit(self):
        ok, msg = validate_password("Abcdefgh")
        assert not ok
        assert "数字" in msg

    def test_password_valid(self):
        ok, msg = validate_password("Abcdefg1")
        assert ok
        assert msg == ""

    def test_username_too_short(self):
        ok, msg = validate_username("ab")
        assert not ok
        assert "3-32" in msg

    def test_username_invalid_chars(self):
        ok, msg = validate_username("user@name")
        assert not ok
        assert "字母开头" in msg

    def test_username_valid(self):
        ok, msg = validate_username("test_user")
        assert ok
        assert msg == ""
