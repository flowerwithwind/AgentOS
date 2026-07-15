"""
OAuth 认证服务：GitHub / QQ 第三方登录
支持模拟模式（开发环境无配置时自动启用）
"""
import os
import json
import secrets
import urllib.request
import urllib.parse
import logging

from app.models.db import get_connection
from app.models.user import UserRepository
from app.models.system_settings import SystemSettingsRepository

logger = logging.getLogger(__name__)

BASE_URL = os.environ.get("OAUTH_BASE_URL", "http://127.0.0.1:35001")
GITHUB_REDIRECT_URI = f"{BASE_URL}/api/auth/oauth/github/callback"
QQ_REDIRECT_URI = f"{BASE_URL}/api/auth/oauth/qq/callback"


# ============================================================================
# 数据库操作
# ============================================================================

def ensure_oauth_tables():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS oauth_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL,
                provider_user_id TEXT NOT NULL,
                username TEXT NOT NULL DEFAULT '',
                avatar_url TEXT DEFAULT '',
                local_user_id INTEGER DEFAULT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (local_user_id) REFERENCES users(id) ON DELETE SET NULL,
                UNIQUE(provider, provider_user_id)
            )
        """)


def get_oauth_account(provider: str, provider_user_id: str):
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?",
            (provider, provider_user_id)
        ).fetchone()


def create_oauth_account(provider: str, provider_user_id: str,
                         username: str, avatar_url: str = "",
                         local_user_id: int = None) -> bool:
    try:
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO oauth_accounts (provider, provider_user_id, username, avatar_url, local_user_id) "
                "VALUES (?, ?, ?, ?, ?)",
                (provider, provider_user_id, username, avatar_url, local_user_id)
            )
            return True
    except Exception as e:
        logger.error(f"创建 OAuth 账号失败: {e}")
        return False


def update_oauth_account(oauth_id: int, local_user_id: int) -> bool:
    try:
        with get_connection() as conn:
            conn.execute(
                "UPDATE oauth_accounts SET local_user_id = ? WHERE id = ?",
                (local_user_id, oauth_id)
            )
            return True
    except Exception as e:
        logger.error(f"更新 OAuth 账号绑定失败: {e}")
        return False


def find_or_create_local_user(provider: str, provider_user_id: str,
                               username: str) -> tuple:
    """查找或创建本地用户并与 OAuth 账号关联。返回 (local_user_id, is_new)"""
    oauth = get_oauth_account(provider, provider_user_id)
    if oauth and oauth["local_user_id"]:
        return oauth["local_user_id"], False

    existing = UserRepository.get_user_by_username(username)
    if existing:
        local_user_id = existing["id"]
        if oauth:
            update_oauth_account(oauth["id"], local_user_id)
        else:
            create_oauth_account(provider, provider_user_id, username,
                                 local_user_id=local_user_id)
        return local_user_id, False

    random_pass = secrets.token_hex(16)
    ok = UserRepository.create_user(username, random_pass, role_id=2)
    if not ok:
        suffix = secrets.token_hex(4)
        username2 = f"{username}_{suffix}"[:32]
        UserRepository.create_user(username2, random_pass, role_id=2)
        new_user = UserRepository.get_user_by_username(username2)
    else:
        new_user = UserRepository.get_user_by_username(username)

    if not new_user:
        return None, False

    local_user_id = new_user["id"]
    if oauth:
        update_oauth_account(oauth["id"], local_user_id)
    else:
        create_oauth_account(provider, provider_user_id, username,
                             local_user_id=local_user_id)
    return local_user_id, True


# ============================================================================
# OAuth 配置读取
# ============================================================================

def get_oauth_config(provider: str) -> dict:
    prefix = f"oauth_{provider}"
    cfg = {
        "client_id": SystemSettingsRepository.get(f"{prefix}_client_id", ""),
        "client_secret": SystemSettingsRepository.get(f"{prefix}_client_secret", ""),
        "enabled": SystemSettingsRepository.get(f"{prefix}_enabled", "true"),
    }
    return cfg


def is_simulated_mode(provider: str) -> bool:
    """判断是否使用模拟模式（未配置 Client ID 时自动启用）"""
    config = get_oauth_config(provider)
    return not config.get("client_id")


# ============================================================================
# 模拟 OAuth 模式（开发/测试用，无需真实凭证）
# ============================================================================

def simulated_login(provider: str) -> dict:
    """模拟 OAuth 登录（用于开发环境无配置时测试）"""
    sim_user_id = f"sim_{provider}_{secrets.token_hex(4)}"
    sim_username = f"{provider}_user_{secrets.token_hex(3)}"
    sim_avatar = ""

    local_user_id, is_new = find_or_create_local_user(provider, sim_user_id, sim_username)
    if not local_user_id:
        return {"success": False, "message": "创建模拟用户失败"}

    return {
        "success": True,
        "user_id": local_user_id,
        "username": sim_username,
        "is_new": is_new,
        "message": "模拟登录成功",
        "simulated": True,
    }


# ============================================================================
# GitHub OAuth
# ============================================================================

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


def github_get_authorize_url(state: str) -> str:
    config = get_oauth_config("github")
    client_id = config["client_id"]
    if not client_id:
        return f"/?error=请先配置 GitHub OAuth 的 Client ID 和 Client Secret"
    params = {
        "client_id": client_id,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "read:user",
        "state": state,
    }
    return f"{GITHUB_AUTH_URL}?{urllib.parse.urlencode(params)}"


def github_exchange_code(code: str) -> dict:
    config = get_oauth_config("github")
    data = {
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "code": code,
        "redirect_uri": GITHUB_REDIRECT_URI,
    }
    req = urllib.request.Request(
        GITHUB_TOKEN_URL,
        data=urllib.parse.urlencode(data).encode(),
        headers={"Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        logger.error(f"GitHub token exchange 失败: {e}")
        return {"error": str(e)}


def github_get_user_info(access_token: str) -> dict:
    req = urllib.request.Request(
        GITHUB_USER_URL,
        headers={"Authorization": f"Bearer {access_token}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        logger.error(f"GitHub 获取用户信息失败: {e}")
        return {}


def github_login(code: str) -> dict:
    # 模拟模式
    if is_simulated_mode("github"):
        return simulated_login("github")

    # 真实 OAuth 流程
    token_result = github_exchange_code(code)
    access_token = token_result.get("access_token")
    if not access_token:
        return {"success": False, "message": f"GitHub 授权失败"}

    user_info = github_get_user_info(access_token)
    if not user_info or not user_info.get("id"):
        return {"success": False, "message": "获取 GitHub 用户信息失败"}

    provider_user_id = str(user_info["id"])
    username = user_info.get("login", f"github_{provider_user_id}")
    avatar_url = user_info.get("avatar_url", "")

    local_user_id, is_new = find_or_create_local_user("github", provider_user_id, username)
    if not local_user_id:
        return {"success": False, "message": "创建本地用户失败"}

    return {
        "success": True,
        "user_id": local_user_id,
        "username": username,
        "is_new": is_new,
        "message": "登录成功" if not is_new else "注册并登录成功",
    }


# ============================================================================
# QQ OAuth
# ============================================================================

QQ_AUTH_URL = "https://graph.qq.com/oauth2.0/authorize"
QQ_TOKEN_URL = "https://graph.qq.com/oauth2.0/token"
QQ_OPENID_URL = "https://graph.qq.com/oauth2.0/me"
QQ_USER_INFO_URL = "https://graph.qq.com/user/get_user_info"


def qq_get_authorize_url(state: str) -> str:
    config = get_oauth_config("qq")
    app_id = config["client_id"]
    if not app_id:
        return f"/?error=请先配置 QQ OAuth 的 App ID 和 App Key"
    params = {
        "response_type": "code",
        "client_id": app_id,
        "redirect_uri": QQ_REDIRECT_URI,
        "scope": "get_user_info",
        "state": state,
    }
    return f"{QQ_AUTH_URL}?{urllib.parse.urlencode(params)}"


def qq_exchange_code(code: str) -> dict:
    config = get_oauth_config("qq")
    data = {
        "grant_type": "authorization_code",
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "code": code,
        "redirect_uri": QQ_REDIRECT_URI,
    }
    req = urllib.request.Request(
        f"{QQ_TOKEN_URL}?{urllib.parse.urlencode(data)}",
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode()
            result = dict(urllib.parse.parse_qsl(body))
            return result
    except Exception as e:
        logger.error(f"QQ token exchange 失败: {e}")
        return {"error": str(e)}


def qq_get_openid(access_token: str) -> str:
    req = urllib.request.Request(
        f"{QQ_OPENID_URL}?access_token={access_token}",
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode()
            if "callback(" in body:
                json_str = body[body.index("(")+1:body.rindex(")")]
                data = json.loads(json_str)
                return data.get("openid", "")
            return ""
    except Exception as e:
        logger.error(f"QQ 获取 OpenID 失败: {e}")
        return ""


def qq_get_user_info(access_token: str, openid: str, app_id: str) -> dict:
    params = {
        "access_token": access_token,
        "oauth_consumer_key": app_id,
        "openid": openid,
    }
    req = urllib.request.Request(
        f"{QQ_USER_INFO_URL}?{urllib.parse.urlencode(params)}",
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        logger.error(f"QQ 获取用户信息失败: {e}")
        return {}


def qq_login(code: str) -> dict:
    # 模拟模式
    if is_simulated_mode("qq"):
        return simulated_login("qq")

    # 真实 OAuth 流程
    token_result = qq_exchange_code(code)
    access_token = token_result.get("access_token")
    if not access_token:
        return {"success": False, "message": "QQ 授权失败"}

    openid = qq_get_openid(access_token)
    if not openid:
        return {"success": False, "message": "获取 QQ OpenID 失败"}

    config = get_oauth_config("qq")
    user_info = qq_get_user_info(access_token, openid, config["client_id"])
    nickname = user_info.get("nickname", f"qq_{openid[:8]}")
    avatar_url = user_info.get("figureurl_qq_2", user_info.get("figureurl_qq_1", ""))

    local_user_id, is_new = find_or_create_local_user("qq", openid, nickname)
    if not local_user_id:
        return {"success": False, "message": "创建本地用户失败"}

    return {
        "success": True,
        "user_id": local_user_id,
        "username": nickname,
        "is_new": is_new,
        "message": "登录成功" if not is_new else "注册并登录成功",
    }
