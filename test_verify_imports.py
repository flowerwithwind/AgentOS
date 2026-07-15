"""验证后端新增模块导入"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 测试 utils
from app.utils.response import success, error, paginated
from app.utils.validators import validate_password
print("[OK] utils 模块导入成功")

# 测试 middleware
from app.middleware.permission_middleware import require_permission, get_required_permission
from app.middleware.auth_middleware import validate_api_token
from app.middleware.rate_limit import RateLimiter, check_rate_limit
print("[OK] middleware 模块导入成功")

# 测试 services
from app.services.auth_service import AuthService
from app.services.lookout_service import LookoutService
from app.services.model_service import ModelService
print("[OK] services 模块导入成功")

# 测试新的 API 控制器
from app.controllers.api_auth import LoginApiHandler, RegisterApiHandler, MeApiHandler, LogoutApiHandler
from app.controllers.api_dashboard import DashboardStatsApiHandler, MenuApiHandler
print("[OK] API controllers 导入成功")

print("\n=== 所有后端新模块验证通过 ===")
