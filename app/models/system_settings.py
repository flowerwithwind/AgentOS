# 系统设置 数据访问层
from app.models.db import get_connection


class SystemSettingsRepository:
    @staticmethod
    def get_all():
        """获取所有系统设置"""
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT key, value FROM system_settings"
            ).fetchall()
            return {row["key"]: row["value"] for row in rows}

    @staticmethod
    def get(key, default=""):
        with get_connection() as conn:
            row = conn.execute(
                "SELECT value FROM system_settings WHERE key = ?", (key,)
            ).fetchone()
            return row["value"] if row else default

    @staticmethod
    def set(key, value):
        """设置或更新一项设置"""
        with get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO system_settings (key, value, updated_at) "
                "VALUES (?, ?, datetime('now'))",
                (key, value)
            )

    @staticmethod
    def set_multi(settings: dict):
        """批量设置多项设置"""
        with get_connection() as conn:
            for key, value in settings.items():
                conn.execute(
                    "INSERT OR REPLACE INTO system_settings (key, value, updated_at) "
                    "VALUES (?, ?, datetime('now'))",
                    (key, value)
                )
