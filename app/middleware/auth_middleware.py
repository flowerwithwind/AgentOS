"""
API Token 鉴权中间件

支持两种认证方式：
1. Session 认证（浏览器端，由 auth_helper.py 处理）
2. Bearer Token 认证（API 调用）

Flask 版本：接收 Flask request 对象而非 Tornado handler。
"""
from app.models.api_token import ApiTokenRepository


def validate_api_token(request) -> dict | None:
    """从 Authorization header 验证 API Token

    返回 token_info dict 或 None
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        token_info = ApiTokenRepository.get_by_token(token)
        if token_info and token_info.get("status") == 1:
            ApiTokenRepository.increment_call_count(token_info["id"])
            return token_info
    return None
