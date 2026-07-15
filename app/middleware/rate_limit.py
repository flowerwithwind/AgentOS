"""
Rate Limiting 限流中间件

基于内存的滑动窗口限流，开发阶段用内存存储，生产环境可替换为 Redis。
"""
import time
from collections import defaultdict


class RateLimiter:
    """滑动窗口限流器"""

    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        """检查请求是否允许通过"""
        now = time.time()
        window_start = now - self.window_seconds
        # 清理过期记录
        self.requests[key] = [t for t in self.requests[key] if t > window_start]
        if len(self.requests[key]) >= self.max_requests:
            return False
        self.requests[key].append(now)
        return True

    def get_remaining(self, key: str) -> int:
        """获取剩余可用请求数"""
        now = time.time()
        window_start = now - self.window_seconds
        self.requests[key] = [t for t in self.requests[key] if t > window_start]
        return max(0, self.max_requests - len(self.requests[key]))

    def reset(self, key: str):
        """重置某个 key 的计数"""
        self.requests[key] = []


# 全局实例
rate_limiter = RateLimiter()

# 不同接口的限流配置
LIMIT_CONFIG = {
    "default": (60, 60),        # 普通 API: 60次/分钟
    "chat": (10, 60),           # AI 对话: 10次/分钟
    "login": (5, 60),           # 登录: 5次/分钟
    "register": (3, 60),        # 注册: 3次/分钟
}


def check_rate_limit(key: str, limit_type: str = "default") -> bool:
    """检查限流

    用法：
        if not check_rate_limit(f"user:{user_id}", "chat"):
            self.set_status(429)
            return self.write({"code": 429, "message": "请求过于频繁"})
    """
    max_req, window = LIMIT_CONFIG.get(limit_type, LIMIT_CONFIG["default"])
    limiter = RateLimiter(max_requests=max_req, window_seconds=window)
    return limiter.is_allowed(key)
