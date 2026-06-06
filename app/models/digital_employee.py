# 数字员工模型层
import json
from app.models.db import get_connection


class DigitalEmployeeRepository:
    @staticmethod
    def create(name: str, avatar_url: str = '', welcome_message: str = '',
               system_prompt: str = '', skill_ids: list = None) -> bool:
        with get_connection() as conn:
            try:
                cur = conn.execute(
                    "INSERT INTO digital_employees (name, avatar_url, welcome_message, system_prompt) VALUES (?, ?, ?, ?)",
                    (name, avatar_url, welcome_message, system_prompt)
                )
                employee_id = cur.lastrowid
                
                # 关联技能
                if skill_ids:
                    for skill_id in skill_ids:
                        conn.execute(
                            "INSERT INTO employee_skills (employee_id, skill_id) VALUES (?, ?)",
                            (employee_id, skill_id)
                        )
                return True
            except Exception:
                return False

    @staticmethod
    def get_by_id(employee_id: int):
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM digital_employees WHERE id = ?",
                (employee_id,)
            ).fetchone()
            if row:
                # 获取关联的技能ID列表
                skill_rows = conn.execute(
                    "SELECT skill_id FROM employee_skills WHERE employee_id = ?",
                    (employee_id,)
                ).fetchall()
                skills = [r["skill_id"] for r in skill_rows]
                # 将Row对象转换为字典并添加skills字段
                result = dict(row)
                result["skill_ids"] = skills
                return result
            return None

    @staticmethod
    def get_by_name(name: str):
        """根据名称获取数字员工（供用户侧调用）"""
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM digital_employees WHERE name = ? AND status = 1",
                (name,)
            ).fetchone()
            if row:
                # 获取关联的技能描述
                skill_rows = conn.execute(
                    "SELECT s.id, s.name, s.description FROM skills s "
                    "INNER JOIN employee_skills es ON s.id = es.skill_id "
                    "WHERE es.employee_id = ?",
                    (row["id"],)
                ).fetchall()
                result = dict(row)
                result["skills"] = [dict(r) for r in skill_rows]
                # 拼装技能描述
                skill_descriptions = "\n".join([
                    f"【{r['name']}】\n{r['description']}" for r in skill_rows if r['description']
                ])
                result["skill_descriptions"] = skill_descriptions
                return result
            return None

    @staticmethod
    def list(page: int = 1, page_size: int = 10, keyword: str = ''):
        offset = (page - 1) * page_size
        with get_connection() as conn:
            if keyword:
                rows = conn.execute(
                    "SELECT * FROM digital_employees WHERE name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?",
                    (f'%{keyword}%', page_size, offset)
                ).fetchall()
                total = conn.execute(
                    "SELECT COUNT(*) AS cnt FROM digital_employees WHERE name LIKE ?",
                    (f'%{keyword}%',)
                ).fetchone()["cnt"]
            else:
                rows = conn.execute(
                    "SELECT * FROM digital_employees ORDER BY id DESC LIMIT ? OFFSET ?",
                    (page_size, offset)
                ).fetchall()
                total = conn.execute(
                    "SELECT COUNT(*) AS cnt FROM digital_employees"
                ).fetchone()["cnt"]
            
            # 为每个员工获取关联的技能名称
            result = []
            for row in rows:
                item = dict(row)
                skill_rows = conn.execute(
                    "SELECT s.name FROM skills s "
                    "INNER JOIN employee_skills es ON s.id = es.skill_id "
                    "WHERE es.employee_id = ?",
                    (row["id"],)
                ).fetchall()
                item["skill_names"] = ", ".join([r["name"] for r in skill_rows])
                result.append(item)
            
            return result, total

    @staticmethod
    def update(employee_id: int, name: str, avatar_url: str = '',
               welcome_message: str = '', system_prompt: str = '',
               skill_ids: list = None) -> bool:
        with get_connection() as conn:
            cur = conn.execute(
                "UPDATE digital_employees SET name = ?, avatar_url = ?, welcome_message = ?, system_prompt = ? WHERE id = ?",
                (name, avatar_url, welcome_message, system_prompt, employee_id)
            )
            if cur.rowcount > 0:
                # 更新技能关联：先删除旧的，再添加新的
                conn.execute("DELETE FROM employee_skills WHERE employee_id = ?", (employee_id,))
                if skill_ids:
                    for skill_id in skill_ids:
                        conn.execute(
                            "INSERT INTO employee_skills (employee_id, skill_id) VALUES (?, ?)",
                            (employee_id, skill_id)
                        )
                return True
            return False

    @staticmethod
    def delete(employee_id: int) -> bool:
        with get_connection() as conn:
            # 先删除关联的技能
            conn.execute("DELETE FROM employee_skills WHERE employee_id = ?", (employee_id,))
            cur = conn.execute("DELETE FROM digital_employees WHERE id = ?", (employee_id,))
            return cur.rowcount > 0

    @staticmethod
    def toggle_status(employee_id: int) -> bool:
        """切换启用/禁用状态"""
        with get_connection() as conn:
            cur = conn.execute(
                "UPDATE digital_employees SET status = CASE WHEN status = 1 THEN 0 ELSE 1 END WHERE id = ?",
                (employee_id,)
            )
            return cur.rowcount > 0

    @staticmethod
    def get_status(employee_id: int) -> int:
        """获取当前状态"""
        with get_connection() as conn:
            row = conn.execute(
                "SELECT status FROM digital_employees WHERE id = ?",
                (employee_id,)
            ).fetchone()
            return row["status"] if row else None

    @staticmethod
    def get_enabled():
        """获取启用的数字员工列表（供用户侧 @ 调用）"""
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT id, name, avatar_url, welcome_message, system_prompt, status "
                "FROM digital_employees WHERE status = 1 ORDER BY id"
            ).fetchall()
            result = []
            for row in rows:
                item = dict(row)
                item["avatar"] = item.get("avatar_url") or "🤖"
                item["welcome_msg"] = item.get("welcome_message") or ""
                result.append(item)
            return result
