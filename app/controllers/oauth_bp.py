"""
OAuth 第三方登录 Blueprint

- GET /<provider>/login     重定向到第三方授权页（或模拟登录）
- GET /<provider>/callback  处理回调
"""
import secrets
import logging
from urllib.parse import quote

from flask import Blueprint, request, jsonify, session, redirect
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

oauth_bp = Blueprint("oauth", __name__)

# In-process fallback; primary state is stored in Flask session (works across requests)
_oauth_states = {}


def _err_redirect(msg: str):
    return redirect(f"/?error={quote(str(msg or '登录失败'))}")


def _ok_redirect(provider: str, username: str, simulated: bool = False):
    q = f"oauth_success={quote(provider)}&username={quote(username)}"
    if simulated:
        q += "&simulated=1"
    return redirect(f"/?{q}")


@oauth_bp.route("/<provider>/login", methods=["GET"])
def oauth_login(provider: str):
    try:
        ensure_oauth_tables()

        if provider not in ("github", "qq"):
            return _err_redirect(f"不支持的登录方式: {provider}")

        # --- 模拟模式（未配置 Client ID）---
        if is_simulated_mode(provider):
            logger.info(f"OAuth 模拟模式: {provider}")
            if provider == "github":
                result = github_login("simulated_code")
            else:
                result = qq_login("simulated_code")

            if result.get("success"):
                username = result["username"]
                session["username"] = username
                session.permanent = True
                logger.info(f"模拟 {provider} 登录成功: {username}")
                return _ok_redirect(provider, username, simulated=True)
            return _err_redirect(result.get("message") or "模拟登录失败")

        # --- 真实模式 ---
        config = get_oauth_config(provider)
        if not config.get("client_id"):
            return _err_redirect(f"请先配置 {provider} OAuth 的 Client ID")

        state = secrets.token_hex(16)
        # Prefer session so multi-process / restart still validates callback
        session[f"oauth_state_{provider}"] = state
        session["oauth_state"] = state
        session["oauth_provider"] = provider
        _oauth_states[state] = provider

        if provider == "github":
            url = github_get_authorize_url(state)
        else:
            url = qq_get_authorize_url(state)

        logger.info(f"OAuth redirect: {provider} base_ok={bool(config.get('client_id'))}")
        return redirect(url)
    except Exception as e:
        logger.exception(f"OAuth login failed: {provider}: {e}")
        return _err_redirect(f"{provider} 登录启动失败，请稍后重试")


@oauth_bp.route("/<provider>/callback", methods=["GET"])
def oauth_callback(provider: str):
    try:
        ensure_oauth_tables()

        if provider not in ("github", "qq"):
            return jsonify({"code": 400, "message": f"不支持的登录方式: {provider}"}), 400

        code = request.args.get("code", "")
        state = request.args.get("state", "")
        error_param = request.args.get("error", "")

        if error_param:
            logger.warning(f"OAuth {provider} 用户拒绝授权: {error_param}")
            return _err_redirect(f"您已取消 {provider} 登录")

        # Validate state: session first, then in-memory fallback
        session_state = session.pop(f"oauth_state_{provider}", None) or session.pop("oauth_state", None)
        memory_provider = _oauth_states.pop(state, None) if state else None
        state_ok = False
        if state and session_state and state == session_state:
            state_ok = True
        elif state and memory_provider == provider:
            state_ok = True

        if not is_simulated_mode(provider) and not state_ok:
            logger.warning(
                f"OAuth state mismatch provider={provider} has_session={bool(session_state)} "
                f"memory={memory_provider}"
            )
            return _err_redirect("安全校验失败，请重新登录")

        if provider == "github":
            result = github_login(code)
        else:
            result = qq_login(code)

        if result.get("success"):
            username = result["username"]
            session["username"] = username
            session.permanent = True
            session.pop("oauth_provider", None)
            logger.info(f"OAuth {provider} 登录成功: {username}")
            return _ok_redirect(provider, username, simulated=bool(result.get("simulated")))

        logger.warning(f"OAuth {provider} 登录失败: {result.get('message')}")
        return _err_redirect(result.get("message") or f"{provider} 登录失败")

    except Exception as e:
        logger.exception(f"OAuth {provider} 回调处理异常: {e}")
        return _err_redirect(f"{provider} 登录异常，请稍后重试")
