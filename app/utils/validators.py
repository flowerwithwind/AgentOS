"""
参数校验工具

包含密码强度校验、用户名校验等通用校验函数。
"""
import re


def validate_password(password: str) -> tuple[bool, str]:
    """校验密码强度

    规则：最少8位，必须含大写字母、小写字母和数字
    返回：(是否通过, 错误信息)
    """
    if len(password) < 8:
        return False, "密码长度不能少于8位"
    if not re.search(r'[A-Z]', password):
        return False, "密码必须包含大写字母"
    if not re.search(r'[a-z]', password):
        return False, "密码必须包含小写字母"
    if not re.search(r'\d', password):
        return False, "密码必须包含数字"
    return True, ""


def validate_username(username: str) -> tuple[bool, str]:
    """校验用户名

    规则：3-32 位，字母开头，仅含字母、数字、下划线、连字符
    """
    if len(username) < 3 or len(username) > 32:
        return False, "用户名长度应在 3-32 位之间"
    if not re.match(r'^[a-zA-Z][a-zA-Z0-9_-]*$', username):
        return False, "用户名必须以字母开头，仅含字母、数字、下划线、连字符"
    return True, ""


def validate_email(email: str) -> bool:
    """简单邮箱格式校验"""
    return bool(re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email))
