"""
应用启动种子数据

生产环境 wsgi 只走 create_app，需在此确保默认角色与管理员存在。
"""
from __future__ import annotations

import logging

from app.models.db import get_connection, init_db
from app.models.user import UserRepository
from app.services.oauth_service import ensure_oauth_tables

logger = logging.getLogger(__name__)

DEFAULT_ADMIN_USER = "admin"
DEFAULT_ADMIN_PASS = "admin123"


def seed_defaults() -> None:
    """幂等：建表 + 默认角色 + 默认管理员 admin/admin123。"""
    init_db()
    ensure_oauth_tables()

    with get_connection() as conn:
        roles = [(1, "超级管理员", 1), (2, "普通用户", 1)]
        for rid, rname, rsystem in roles:
            conn.execute(
                "INSERT OR IGNORE INTO roles (id, name, is_system) VALUES (?, ?, ?)",
                (rid, rname, rsystem),
            )

    user = UserRepository.get_user_by_username(DEFAULT_ADMIN_USER)
    if not user:
        ok = UserRepository.create_user(
            DEFAULT_ADMIN_USER, DEFAULT_ADMIN_PASS, role_id=1
        )
        if ok:
            logger.info(
                "Created default admin: %s / %s",
                DEFAULT_ADMIN_USER,
                DEFAULT_ADMIN_PASS,
            )
        else:
            logger.warning("Failed to create default admin user")
    else:
        # Ensure existing admin keeps super-admin role
        try:
            with get_connection() as conn:
                conn.execute(
                    "UPDATE users SET role_id = 1 WHERE username = ?",
                    (DEFAULT_ADMIN_USER,),
                )
        except Exception as e:
            logger.warning("Failed to ensure admin role: %s", e)
