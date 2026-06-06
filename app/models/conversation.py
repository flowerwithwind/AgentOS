# 会话模型层 - 包含会话管理和对话管理两个功能
import sqlite3
import csv
import io
from typing import Optional
from app.models.db import get_connection


class ConversationRepository:
    """
    对话管理数据访问层（赵海蓺负责）
    访问 conversations 表
    """
    
    @staticmethod
    def list_page(page: int = 1, page_size: int = 20,
                  username: str = "",
                  keyword: str = "",
                  date_from: str = "", date_to: str = ""):
        """
        分页查询对话列表（对话管理）
        """
        offset = (page - 1) * page_size
        conditions = []
        params = []

        if username:
            conditions.append("username LIKE ?")
            params.append(f"%{username}%")
        if keyword:
            conditions.append("(question LIKE ? OR answer LIKE ?)")
            params.extend([f"%{keyword}%", f"%{keyword}%"])
        if date_from:
            conditions.append("created_at >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("created_at <= ?")
            params.append(date_to + " 23:59:59")

        where = ""
        if conditions:
            where = "WHERE " + " AND ".join(conditions)

        with get_connection() as conn:
            rows = conn.execute(
                f"SELECT * FROM conversations {where} "
                f"ORDER BY created_at DESC LIMIT ? OFFSET ?",
                params + [page_size, offset]
            ).fetchall()
            total = conn.execute(
                f"SELECT COUNT(*) AS cnt FROM conversations {where}",
                params
            ).fetchone()["cnt"]
            return list(rows), total

    @staticmethod
    def get_by_id(conv_id: int) -> Optional[sqlite3.Row]:
        """根据ID获取对话记录"""
        with get_connection() as conn:
            return conn.execute(
                "SELECT * FROM conversations WHERE id = ?", (conv_id,)
            ).fetchone()

    @staticmethod
    def insert(user_id: int, username: str, question: str,
               answer: str = "", model_name: str = "") -> bool:
        """插入对话记录"""
        try:
            with get_connection() as conn:
                conn.execute(
                    "INSERT INTO conversations (user_id, username, model_name, question, answer) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (user_id, username, model_name, question, answer)
                )
            return True
        except sqlite3.IntegrityError:
            return False

    @staticmethod
    def export_csv(username: str = "", keyword: str = "",
                   date_from: str = "", date_to: str = "") -> str:
        """导出对话记录为CSV字符串"""
        conditions = []
        params = []

        if username:
            conditions.append("username LIKE ?")
            params.append(f"%{username}%")
        if keyword:
            conditions.append("(question LIKE ? OR answer LIKE ?)")
            params.extend([f"%{keyword}%", f"%{keyword}%"])
        if date_from:
            conditions.append("created_at >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("created_at <= ?")
            params.append(date_to + " 23:59:59")

        where = ""
        if conditions:
            where = "WHERE " + " AND ".join(conditions)

        with get_connection() as conn:
            rows = conn.execute(
                f"SELECT * FROM conversations {where} ORDER BY created_at DESC",
                params
            ).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "用户ID", "用户名", "模型", "提问", "回答", "时间"])
        for r in rows:
            writer.writerow([
                r["id"], r["user_id"], r["username"], r["model_name"] or "",    
                r["question"], r["answer"], r["created_at"]
            ])
        return output.getvalue()


class SessionRepository:
    """
    会话管理数据访问层（陈陆雷负责）
    访问 user_sessions 表
    """
    
    @staticmethod
    def list(page: int = 1, page_size: int = 10, keyword: str = '',
             date_from: str = '', date_to: str = ''):
        """
        分页查询会话列表（会话管理）
        - 关联用户名
        - 支持按用户名模糊搜索
        - 支持按时间范围筛选
        """
        offset = (page - 1) * page_size
        with get_connection() as conn:
            # 构建 WHERE 子句
            conditions = []
            params = []
            if keyword:
                conditions.append("u.username LIKE ?")
                params.append(f'%{keyword}%')
            if date_from:
                conditions.append("s.start_time >= ?")
                params.append(date_from)
            if date_to:
                conditions.append("s.start_time <= ?")
                params.append(date_to + ' 23:59:59')

            where_clause = " AND ".join(conditions) if conditions else "1=1"

            # 查询数据
            sql = f'''
                SELECT s.*, u.username
                FROM user_sessions s
                INNER JOIN users u ON s.user_id = u.id
                WHERE {where_clause}
                ORDER BY s.start_time DESC
                LIMIT ? OFFSET ?
            '''
            rows = conn.execute(sql, params + [page_size, offset]).fetchall()

            # 查询总数
            count_sql = f'''
                SELECT COUNT(*) AS cnt FROM user_sessions s
                INNER JOIN users u ON s.user_id = u.id
                WHERE {where_clause}
            '''
            total = conn.execute(count_sql, params).fetchone()["cnt"]

            return list(rows), total

    @staticmethod
    def get_messages(session_id: int):
        """获取会话的所有消息（按时间升序）"""
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM session_messages WHERE session_id = ? ORDER BY created_at ASC",
                (session_id,)
            ).fetchall()
            return list(rows)

    @staticmethod
    def get_by_id(session_id: int):
        """根据 ID 获取会话详情"""
        with get_connection() as conn:
            row = conn.execute(
                '''SELECT s.*, u.username
                   FROM user_sessions s
                   INNER JOIN users u ON s.user_id = u.id
                   WHERE s.id = ?''',
                (session_id,)
            ).fetchone()
            return dict(row) if row else None

    @staticmethod
    def delete(session_id: int) -> tuple:
        """删除会话（级联删除消息），返回 (success, message)"""
        with get_connection() as conn:
            # 检查会话是否存在
            sess = conn.execute(
                "SELECT id FROM user_sessions WHERE id = ?",
                (session_id,)
            ).fetchone()
            if not sess:
                return False, "会话不存在"

            # 删除会话（消息会级联删除）
            conn.execute("DELETE FROM user_sessions WHERE id = ?", (session_id,))
            return True, "删除成功"

    @staticmethod
    def update_title(session_id: int, title: str) -> bool:
        """更新会话标题"""
        with get_connection() as conn:
            cur = conn.execute(
                "UPDATE user_sessions SET title = ? WHERE id = ?",
                (title, session_id)
            )
            return cur.rowcount > 0

    @staticmethod
    def create_for_user(user_id: int, title: str = "新会话",
                        mode: str = "chat", employee_id=None) -> int:
        with get_connection() as conn:
            cur = conn.execute(
                "INSERT INTO user_sessions (user_id, title, mode, employee_id) "
                "VALUES (?, ?, ?, ?)",
                (user_id, title, mode, employee_id),
            )
            return cur.lastrowid

    @staticmethod
    def list_by_user(user_id: int):
        with get_connection() as conn:
            rows = conn.execute(
                """SELECT s.*,
                   (SELECT COUNT(*) FROM session_messages m WHERE m.session_id = s.id) AS msg_count,
                   de.name AS employee_name
                   FROM user_sessions s
                   LEFT JOIN digital_employees de ON s.employee_id = de.id
                   WHERE s.user_id = ?
                   ORDER BY s.start_time DESC""",
                (user_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_for_user(session_id: int, user_id: int):
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM user_sessions WHERE id = ? AND user_id = ?",
                (session_id, user_id),
            ).fetchone()
            return dict(row) if row else None

    @staticmethod
    def add_message(session_id: int, role: str, content: str) -> int:
        with get_connection() as conn:
            cur = conn.execute(
                "INSERT INTO session_messages (session_id, role, content) VALUES (?, ?, ?)",
                (session_id, role, content),
            )
            conn.execute(
                "UPDATE user_sessions SET message_count = message_count + 1, "
                "end_time = datetime('now') WHERE id = ?",
                (session_id,),
            )
            return cur.lastrowid

    @staticmethod
    def delete_for_user(session_id: int, user_id: int) -> bool:
        with get_connection() as conn:
            sess = conn.execute(
                "SELECT id FROM user_sessions WHERE id = ? AND user_id = ?",
                (session_id, user_id),
            ).fetchone()
            if not sess:
                return False
            conn.execute("DELETE FROM user_sessions WHERE id = ?", (session_id,))
            return True

    @staticmethod
    def set_employee(session_id: int, employee_id):
        with get_connection() as conn:
            conn.execute(
                "UPDATE user_sessions SET employee_id = ? WHERE id = ?",
                (employee_id, session_id),
            )
