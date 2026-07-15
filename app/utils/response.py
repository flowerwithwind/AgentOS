"""
统一响应格式工具

符合文档 3.3 节规范：
{
    "code": 200,
    "message": "success",
    "data": {},
    "timestamp": 1720972800
}
"""
import time
from typing import Any, Optional


def success(data: Any = None, message: str = "success") -> dict:
    """成功响应"""
    return {
        "code": 200,
        "message": message,
        "data": data,
        "timestamp": int(time.time()),
    }


def error(code: int, message: str, data: Any = None) -> dict:
    """错误响应"""
    return {
        "code": code,
        "message": message,
        "data": data,
        "timestamp": int(time.time()),
    }


def paginated(items: list, total: int, page: int, page_size: int) -> dict:
    """分页响应"""
    return success(data={
        "items": items,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size if page_size > 0 else 0,
    })


# 兼容旧版 Layui 前端的响应格式
def layui_success(data: Any = None, count: int = 0, msg: str = "") -> dict:
    """Layui table 兼容响应"""
    return {"code": 0, "msg": msg, "data": data, "count": count}


def layui_error(msg: str = "请求失败", code: int = 1) -> dict:
    """Layui 错误响应"""
    return {"code": code, "msg": msg, "data": None, "count": 0}
