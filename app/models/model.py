# 模型引擎 数据访问层
import sqlite3
from typing import Optional
from app.models.db import get_connection


class ModelRepository:
    @staticmethod
    def list_all():
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM models ORDER BY is_default DESC, id DESC"
            ).fetchall()
            return list(rows)

    @staticmethod
    def list_page(page: int = 1, page_size: int = 6):
        offset = (page - 1) * page_size
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM models ORDER BY is_default DESC, id DESC LIMIT ? OFFSET ?",
                (page_size, offset)
            ).fetchall()
            total = conn.execute("SELECT COUNT(*) AS cnt FROM models").fetchone()["cnt"]
            return list(rows), total

    @staticmethod
    def get_by_id(model_id: int) -> Optional[sqlite3.Row]:
        with get_connection() as conn:
            return conn.execute(
                "SELECT * FROM models WHERE id = ?", (model_id,)
            ).fetchone()

    @staticmethod
    def create(name: str, api_key: str, base_url: str, model_name: str,
               provider: str = "openai") -> bool:
        try:
            with get_connection() as conn:
                conn.execute(
                    "INSERT INTO models (name, provider, api_key, base_url, model_name) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (name, provider, api_key, base_url, model_name)
                )
            return True
        except sqlite3.IntegrityError:
            return False

    @staticmethod
    def update(model_id: int, name: str, api_key: str, base_url: str,
               model_name: str, provider: str = "openai") -> bool:
        with get_connection() as conn:
            cur = conn.execute(
                "UPDATE models SET name=?, provider=?, api_key=?, base_url=?, model_name=? "
                "WHERE id=?",
                (name, provider, api_key, base_url, model_name, model_id)
            )
            return cur.rowcount > 0

    @staticmethod
    def delete(model_id: int) -> bool:
        with get_connection() as conn:
            cur = conn.execute("DELETE FROM models WHERE id = ?", (model_id,))
            return cur.rowcount > 0

    @staticmethod
    def set_default(model_id: int) -> bool:
        """设为默认模型，同时清除其他模型的默认状态"""
        with get_connection() as conn:
            conn.execute("UPDATE models SET is_default = 0")
            cur = conn.execute("UPDATE models SET is_default = 1 WHERE id = ?", (model_id,))
            return cur.rowcount > 0

    @staticmethod
    def get_default() -> Optional[sqlite3.Row]:
        with get_connection() as conn:
            return conn.execute(
                "SELECT * FROM models WHERE is_default = 1 LIMIT 1"
            ).fetchone()

    @staticmethod
    def batch_delete(ids: list) -> int:
        with get_connection() as conn:
            placeholders = ",".join("?" for _ in ids)
            cur = conn.execute(
                f"DELETE FROM models WHERE id IN ({placeholders})", ids
            )
            return cur.rowcount

    @staticmethod
    def batch_set_status(ids: list, status: int) -> int:
        with get_connection() as conn:
            placeholders = ",".join("?" for _ in ids)
            cur = conn.execute(
                f"UPDATE models SET status = ? WHERE id IN ({placeholders})",
                [status] + ids
            )
            return cur.rowcount

    @staticmethod
    def record_usage(model_id: int, tokens: int):
        """记录 token 消耗（总累计 + 每日累计）"""
        today = __import__("datetime").datetime.now().strftime("%Y-%m-%d")
        with get_connection() as conn:
            conn.execute(
                "UPDATE models SET total_tokens = total_tokens + ?, total_calls = total_calls + 1 "
                "WHERE id = ?",
                (tokens, model_id)
            )
            conn.execute(
                "INSERT INTO model_daily_usage (model_id, date, tokens, calls) "
                "VALUES (?, ?, ?, 1) "
                "ON CONFLICT(model_id, date) DO UPDATE SET "
                "tokens = tokens + ?, calls = calls + 1",
                (model_id, today, tokens, tokens)
            )

    @staticmethod
    def get_monthly_trend(model_id: int) -> list:
        """获取近 30 天 token 消耗趋势"""
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT date, tokens, calls FROM model_daily_usage "
                "WHERE model_id = ? AND date >= date('now', '-30 days') "
                "ORDER BY date ASC",
                (model_id,)
            ).fetchall()
            return [dict(r) for r in rows]
