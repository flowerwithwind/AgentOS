import hashlib
import secrets 
import sqlite3
from typing import Optional

from app.models.db import get_connection

def _hash_password(password:str, salt:bytes) -> str:
	dk = hashlib.pbkdf2_hmac("sha256", password.encode('utf-8'), salt, 100_000)
	return dk.hex()


class UserRepository:
	@staticmethod
	def create_user(username:str, password:str, role_id:int=2) -> bool:
		salt = secrets.token_bytes(16)
		password_hash = _hash_password(password, salt)
		try:
			with get_connection() as conn:
				conn.execute(
					"INSERT INTO users (username, password_hash, salt, role_id) VALUES (?, ?, ?, ?)",
					(username, password_hash, salt.hex(), role_id)
				)
			return True
		except sqlite3.IntegrityError:  
			return False 

	@staticmethod
	def get_user_by_username(username:str):
		with get_connection() as conn:
			row = conn.execute(
				"SELECT u.id, u.username, u.password_hash, u.salt, u.role_id FROM users u WHERE u.username = ?",
				(username,)
			).fetchone()
			return row

	@staticmethod
	def verify_user(username:str, password:str) -> bool:
		row = UserRepository.get_user_by_username(username)
		if not row:
			return False

		salt = bytes.fromhex(row['salt'])
		return _hash_password(password, salt) == row["password_hash"]

	@staticmethod
	def list_users(page:int=1, page_size:int=28):
		offset = (page - 1) * page_size
		with get_connection() as conn:
			rows = conn.execute(
				"SELECT u.id, u.username, u.role_id, u.create_at, r.name AS role_name "
				"FROM users u LEFT JOIN roles r ON r.id = u.role_id "
				"ORDER BY u.id DESC LIMIT ? OFFSET ?",
				(page_size, offset)
			).fetchall()
			total = conn.execute("SELECT COUNT(*) AS cnt FROM users").fetchone()["cnt"]
			return list(rows), total

	@staticmethod
	def get_user_by_id(user_id:int) -> Optional[sqlite3.Row]:
		with get_connection() as conn:
			return conn.execute(
				"SELECT u.id, u.username, u.role_id, u.create_at, r.name AS role_name "
				"FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = ?",
				(user_id,)
			).fetchone()

	@staticmethod
	def update_user(user_id:int, username:str, password:Optional[str]=None) -> bool:
		with get_connection() as conn:
			if password:
				salt = secrets.token_bytes(16)
				password_hash = _hash_password(password, salt)
				cur = conn.execute(
					"UPDATE users SET username = ?, password_hash = ?, salt = ? WHERE id = ?",
					(username, password_hash, salt.hex(), user_id)
				)
			else:
				cur = conn.execute(
					"UPDATE users SET username = ? WHERE id = ?",
					(username, user_id)
				)
			return cur.rowcount > 0

	@staticmethod
	def delete_user(user_id:int) -> bool:
		with get_connection() as conn:
			cur = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
			return cur.rowcount > 0

	@staticmethod
	def update_user_role(user_id:int, role_id:int) -> bool:
		with get_connection() as conn:
			cur = conn.execute(
				"UPDATE users SET role_id = ? WHERE id = ?", (role_id, user_id)
			)
			return cur.rowcount > 0