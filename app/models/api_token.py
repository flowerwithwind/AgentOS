# API 令牌管理
import secrets
from app.models.db import get_connection


class ApiTokenRepository:
    @staticmethod
    def list_page(page=1, page_size=15):
        offset = (page - 1) * page_size
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT id, name, api_key, status, call_count, create_at "
                "FROM api_tokens ORDER BY id DESC LIMIT ? OFFSET ?",
                (page_size, offset)
            ).fetchall()
            total = conn.execute("SELECT COUNT(*) AS cnt FROM api_tokens").fetchone()["cnt"]
            return list(rows), total

    @staticmethod
    def create(name):
        api_key = "xha_" + secrets.token_hex(16)
        with get_connection() as conn:
            try:
                conn.execute(
                    "INSERT INTO api_tokens (name, api_key) VALUES (?, ?)",
                    (name, api_key)
                )
                return True, api_key
            except Exception:
                return False, None

    @staticmethod
    def delete(token_id):
        with get_connection() as conn:
            cur = conn.execute("DELETE FROM api_tokens WHERE id = ?", (token_id,))
            return cur.rowcount > 0

    @staticmethod
    def toggle_status(token_id):
        with get_connection() as conn:
            row = conn.execute("SELECT status FROM api_tokens WHERE id = ?", (token_id,)).fetchone()
            if not row:
                return False
            new_status = 0 if row["status"] else 1
            conn.execute("UPDATE api_tokens SET status = ? WHERE id = ?", (new_status, token_id))
            return True
