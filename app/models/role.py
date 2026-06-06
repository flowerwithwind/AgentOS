# 功能模块 / 角色 / 权限 模型层
import sqlite3
from typing import Optional
from app.models.db import get_connection


class FunctionRepository:
    @staticmethod
    def list_all():
        """获取所有功能（按 parent_id, sort_order 排序）"""
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM functions ORDER BY parent_id, sort_order, id"
            ).fetchall()
            return list(rows)

    @staticmethod
    def list_menus():
        """获取菜单级功能（用于侧边栏）"""
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM functions WHERE is_menu = 1 ORDER BY parent_id, sort_order, id"
            ).fetchall()
            return list(rows)

    @staticmethod
    def get_by_id(function_id: int) -> Optional[sqlite3.Row]:
        with get_connection() as conn:
            return conn.execute(
                "SELECT * FROM functions WHERE id = ?", (function_id,)
            ).fetchone()

    @staticmethod
    def create(name: str, icon: str, url: str, parent_id: int,
               sort_order: int, is_menu: int) -> bool:
        try:
            with get_connection() as conn:
                conn.execute(
                    "INSERT INTO functions (name, icon, url, parent_id, sort_order, is_menu) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (name, icon, url, parent_id, sort_order, is_menu)
                )
            return True
        except sqlite3.IntegrityError:
            return False

    @staticmethod
    def update(function_id: int, name: str, icon: str, url: str,
               parent_id: int, sort_order: int, is_menu: int) -> bool:
        with get_connection() as conn:
            cur = conn.execute(
                "UPDATE functions SET name=?, icon=?, url=?, parent_id=?, "
                "sort_order=?, is_menu=? WHERE id=?",
                (name, icon, url, parent_id, sort_order, is_menu, function_id)
            )
            return cur.rowcount > 0

    @staticmethod
    def delete(function_id: int) -> bool:
        with get_connection() as conn:
            # 先删除子功能
            conn.execute("DELETE FROM functions WHERE parent_id = ?", (function_id,))
            conn.execute("DELETE FROM role_permissions WHERE function_id = ?", (function_id,))
            cur = conn.execute("DELETE FROM functions WHERE id = ?", (function_id,))
            return cur.rowcount > 0


class RoleRepository:
    @staticmethod
    def list_all():
        with get_connection() as conn:
            rows = conn.execute("SELECT * FROM roles ORDER BY id").fetchall()
            return list(rows)

    @staticmethod
    def get_by_id(role_id: int) -> Optional[sqlite3.Row]:
        with get_connection() as conn:
            return conn.execute(
                "SELECT * FROM roles WHERE id = ?", (role_id,)
            ).fetchone()

    @staticmethod
    def create(name: str) -> bool:
        try:
            with get_connection() as conn:
                conn.execute("INSERT INTO roles (name) VALUES (?)", (name,))
            return True
        except sqlite3.IntegrityError:
            return False

    @staticmethod
    def delete(role_id: int) -> bool:
        """删除角色（系统角色不可删除）"""
        with get_connection() as conn:
            role = conn.execute(
                "SELECT is_system FROM roles WHERE id = ?", (role_id,)
            ).fetchone()
            if not role or role["is_system"]:
                return False
            conn.execute("DELETE FROM role_permissions WHERE role_id = ?", (role_id,))
            conn.execute("UPDATE users SET role_id = 2 WHERE role_id = ?", (role_id,))
            cur = conn.execute("DELETE FROM roles WHERE id = ?", (role_id,))
            return cur.rowcount > 0

    @staticmethod
    def get_permissions(role_id: int):
        """获取角色已授权的功能 ID 列表"""
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT function_id FROM role_permissions WHERE role_id = ?",
                (role_id,)
            ).fetchall()
            return [r["function_id"] for r in rows]

    @staticmethod
    def set_permissions(role_id: int, function_ids: list):
        """设置角色权限（全量覆盖）"""
        with get_connection() as conn:
            conn.execute("DELETE FROM role_permissions WHERE role_id = ?", (role_id,))
            for fid in function_ids:
                conn.execute(
                    "INSERT OR IGNORE INTO role_permissions (role_id, function_id) VALUES (?, ?)",
                    (role_id, fid)
                )

    @staticmethod
    def get_menus_for_role(role_id: int):
        """获取角色可见的菜单功能（用于动态菜单渲染）"""
        with get_connection() as conn:
            rows = conn.execute('''
                SELECT f.* FROM functions f
                INNER JOIN role_permissions rp ON rp.function_id = f.id
                WHERE rp.role_id = ? AND f.is_menu = 1
                ORDER BY f.parent_id, f.sort_order, f.id
            ''', (role_id,)).fetchall()
            return list(rows)

    @staticmethod
    def get_user_count(role_id: int) -> int:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM users WHERE role_id = ?", (role_id,)
            ).fetchone()
            return row["cnt"]
