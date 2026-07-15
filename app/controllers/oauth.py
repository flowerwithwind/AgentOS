"""
OAuth 第三方登录控制器

提供 GitHub / QQ 的 OAuth 登录流程：
1. GET /api/auth/oauth/{provider}/login  → 重定向到第三方授权页（真实模式）/ 直接模拟登录（模拟模式）
2. GET /api/auth/oauth/{provider}/callback → 处理回调，登录/注册用户
"""
import tornado.web
import secrets
import logging

from app.controllers.base import BaseHandler
from app.services.oauth_service import (
    ensure_oauth_tables,
    github_get_authorize_url,
    github_login,
    qq_get_authorize_url,
    qq_login,
    get_oauth_config,
    is_simulated_mode,
)

logger = logging.getLogger(__name__)

_oauth_states = {}


class OAuthLoginHandler(BaseHandler):
    """OAuth 登录入口"""

    def get(self, provider: str):
        ensure_oauth_tables()

        if provider not in ("github", "qq"):
            self.redirect(f"/?error=不支持的登录方式: {provider}")
            return

        # --- 模拟模式：无需真实 OAuth 配置，直接登录成功 ---
        if is_simulated_mode(provider):
            logger.info(f"OAuth 模拟模式: {provider}")
            if provider == "github":
                result = github_login("simulated_code")
            else:
                result = qq_login("simulated_code")

            if result.get("success"):
                username = result["username"]
                self.set_secure_cookie("username", username)
                msg = f"模拟 {provider} 登录成功（开发模式），用户名: {username}"
                logger.info(msg)
                self.redirect(f"/?oauth_success={provider}&simulated=1&username={username}")
            else:
                self.redirect(f"/?error={result.get('message')}")
            return

        # --- 真实模式 ---
        config = get_oauth_config(provider)
        if not config.get("client_id"):
            self.redirect(f"/?error=请先配置 {provider} OAuth 的 Client ID")
            return

        state = secrets.token_hex(16)
        _oauth_states[state] = provider

        if provider == "github":
            url = github_get_authorize_url(state)
        else:
            url = qq_get_authorize_url(state)

        logger.info(f"OAuth redirect: {provider}")
        self.redirect(url)


class OAuthCallbackHandler(BaseHandler):
    """OAuth 回调处理"""

    def get(self, provider: str):
        ensure_oauth_tables()

        if provider not in ("github", "qq"):
            self.set_status(400)
            self.write({"code": 400, "message": f"不支持的登录方式: {provider}"})
            return

        code = self.get_argument("code", "")
        state = self.get_argument("state", "")
        error = self.get_argument("error", "")

        if error:
            logger.warning(f"OAuth {provider} 用户拒绝授权")
            self.redirect(f"/?error=您已取消 {provider} 登录")
            return

        # 校验 state（模拟模式跳过）
        expected_provider = _oauth_states.pop(state, None)
        if not is_simulated_mode(provider) and (not expected_provider or expected_provider != provider):
            self.redirect(f"/?error=安全校验失败，请重新登录")
            return

        try:
            if provider == "github":
                result = github_login(code)
            else:
                result = qq_login(code)

            if result.get("success"):
                username = result["username"]
                self.set_secure_cookie("username", username)
                logger.info(f"OAuth {provider} 登录成功: {username}")
                self.redirect(f"/?oauth_success={provider}&username={username}")
            else:
                logger.warning(f"OAuth {provider} 登录失败: {result.get('message')}")
                self.redirect(f"/?error={result.get('message')}")

        except Exception as e:
            logger.error(f"OAuth {provider} 回调处理异常: {e}")
            self.redirect(f"/?error={provider} 登录异常，请稍后重试")
