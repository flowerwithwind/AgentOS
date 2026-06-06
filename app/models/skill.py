# 技能模型层
from app.models.db import get_connection


class SkillRepository:
    @staticmethod
    def create(name: str, description: str = '') -> bool:
        with get_connection() as conn:
            try:
                conn.execute(
                    "INSERT INTO skills (name, description) VALUES (?, ?)",
                    (name, description)
                )
                return True
            except Exception:
                return False

    @staticmethod
    def get_by_id(skill_id: int):
        with get_connection() as conn:
            return conn.execute(
                "SELECT * FROM skills WHERE id = ?",
                (skill_id,)
            ).fetchone()

    @staticmethod
    def get_all():
        """获取所有技能（供下拉选择使用）"""
        with get_connection() as conn:
            return conn.execute(
                "SELECT id, name FROM skills ORDER BY id DESC"
            ).fetchall()

    @staticmethod
    def list(page: int = 1, page_size: int = 10, keyword: str = ''):
        offset = (page - 1) * page_size
        with get_connection() as conn:
            if keyword:
                rows = conn.execute(
                    "SELECT * FROM skills WHERE name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?",
                    (f'%{keyword}%', page_size, offset)
                ).fetchall()
                total = conn.execute(
                    "SELECT COUNT(*) AS cnt FROM skills WHERE name LIKE ?",
                    (f'%{keyword}%',)
                ).fetchone()["cnt"]
            else:
                rows = conn.execute(
                    "SELECT * FROM skills ORDER BY id DESC LIMIT ? OFFSET ?",
                    (page_size, offset)
                ).fetchall()
                total = conn.execute(
                    "SELECT COUNT(*) AS cnt FROM skills"
                ).fetchone()["cnt"]
            return list(rows), total

    @staticmethod
    def update(skill_id: int, name: str, description: str = '') -> bool:
        with get_connection() as conn:
            cur = conn.execute(
                "UPDATE skills SET name = ?, description = ? WHERE id = ?",
                (name, description, skill_id)
            )
            return cur.rowcount > 0

    @staticmethod
    def delete(skill_id: int) -> tuple:
        """删除技能，返回 (success, message)"""
        with get_connection() as conn:
            # 检查是否被数字员工引用
            ref = conn.execute(
                "SELECT COUNT(*) AS cnt FROM employee_skills WHERE skill_id = ?",
                (skill_id,)
            ).fetchone()
            if ref["cnt"] > 0:
                return False, "该技能已被数字员工使用，请先解除关联"
            
            cur = conn.execute("DELETE FROM skills WHERE id = ?", (skill_id,))
            if cur.rowcount > 0:
                return True, "删除成功"
            return False, "技能不存在"

    @staticmethod
    def is_referenced(skill_id: int) -> bool:
        """检查技能是否被引用"""
        with get_connection() as conn:
            row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM employee_skills WHERE skill_id = ?",
                (skill_id,)
            ).fetchone()
            return row["cnt"] > 0
