"""
OAuth 第三方登录 Blueprint

替代 Tornado oauth.py：
- GET /<provider>/login     重定向到第三方授权页（或模拟登录）
- GET /<provider>/callback  处理回调
"""
import secrets
import logging
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

_oauth_states = {}


@oauth_bp.route("/<provider>/login", methods=["GET"])
def oauth_login(provider: str):
    ensure_oauth_tables()

    if provider not in ("github", "qq"):
        return redirect(f"/?error=不支持的登录方式: {provider}")

    # --- 模拟模式 ---
    if is_simulated_mode(provider):
        logger.info(f"OAuth 模拟模式: {provider}")
        if provider == "github":
            result = github_login("simulated_code")
        else:
            result = qq_login("simulated_code")

        if result.get("success"):
            username = result["username"]
            session["username"] = username
            msg = f"模拟 {provider} 登录成功（开发模式），用户名: {username}"
            logger.info(msg)
            return redirect(f"/?oauth_success={provider}&simulated=1&username={username}")
        return redirect(f"/?error={result.get('message')}")

    # --- 真实模式 ---
    config = get_oauth_config(provider)
    if not config.get("client_id"):
        return redirect(f"/?error=请先配置 {provider} OAuth 的 Client ID")

    state = secrets.token_hex(16)
    _oauth_states[state] = provider

    if provider == "github":
        url = github_get_authorize_url(state)
    else:
        url = qq_get_authorize_url(state)

    logger.info(f"OAuth redirect: {provider}")
    return redirect(url)


@oauth_bp.route("/<provider>/callback", methods=["GET"])
def oauth_callback(provider: str):
    ensure_oauth_tables()

    if provider not in ("github", "qq"):
        return jsonify({"code": 400, "message": f"不支持的登录方式: {provider}"}), 400

    code = request.args.get("code", "")
    state = request.args.get("state", "")
    error_param = request.args.get("error", "")

    if error_param:
        logger.warning(f"OAuth {provider} 用户拒绝授权")
        return redirect(f"/?error=您已取消 {provider} 登录")

    # 校验 state
    expected_provider = _oauth_states.pop(state, None)
    if not is_simulated_mode(provider) and (not expected_provider or expected_provider != provider):
        return redirect(f"/?error=安全校验失败，请重新登录")

    try:
        if provider == "github":
            result = github_login(code)
        else:
            result = qq_login(code)

        if result.get("success"):
            username = result["username"]
            session["username"] = username
            logger.info(f"OAuth {provider} 登录成功: {username}")
            return redirect(f"/?oauth_success={provider}&username={username}")
        logger.warning(f"OAuth {provider} 登录失败: {result.get('message')}")
        return redirect(f"/?error={result.get('message')}")

    except Exception as e:
        logger.error(f"OAuth {provider} 回调处理异常: {e}")
        return redirect(f"/?error={provider} 登录异常，请稍后重试")
