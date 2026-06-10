# 数据库连接与建表
import os
import json
import sqlite3

# ---------------------------------------------------------------------------
# 数据库配置文件（主数据源，避免鸡生蛋问题）
# ---------------------------------------------------------------------------
def _project_root():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))

DB_CONFIG_DIR = os.path.join(_project_root(), "database")
DB_CONFIG_FILE = os.path.join(DB_CONFIG_DIR, "db_config.json")
DB_PATH = os.path.join(DB_CONFIG_DIR, "app.db")

# ---------------------------------------------------------------------------
# 数据库配置文件读写
# ---------------------------------------------------------------------------
def _read_db_config():
    if os.path.exists(DB_CONFIG_FILE):
        try:
            with open(DB_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {"type": "sqlite"}


def _write_db_config(config: dict):
    os.makedirs(DB_CONFIG_DIR, exist_ok=True)
    with open(DB_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# 获取当前数据库类型
# ---------------------------------------------------------------------------
def get_db_type() -> str:
    """从配置文件获取数据库类型：sqlite / mysql"""
    cfg = _read_db_config()
    return cfg.get("type", "sqlite")


def get_db_config() -> dict:
    """获取完整的数据库配置"""
    return _read_db_config()


# ---------------------------------------------------------------------------
# MySQL 连接包装器（抹平与 sqlite3.Connection 的接口差异）
# ---------------------------------------------------------------------------
class _MySQLConnection:
    """包装 pymysql 连接，暴露与 sqlite3.Connection 兼容的接口"""

    def __init__(self, host="localhost", port=3306, user="root",
                 password="", database="xhaos", charset="utf8mb4"):
        import pymysql
        self._conn = pymysql.connect(
            host=host, port=port, user=user, password=password,
            database=database, charset=charset,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True,
        )

    def execute(self, sql, parameters=None):
        """将 SQLite 语法转为 MySQL 后执行，返回兼容的 cursor 包装"""
        # 转换 SQLite 专有语法
        sql = self._translate_sql(sql)
        if parameters:
            sql = self._convert_placeholders(sql)
        cursor = self._conn.cursor()
        cursor.execute(sql, parameters)
        return _MySQLCursorWrapper(cursor)

    def cursor(self):
        return self._conn.cursor()

    def close(self):
        self._conn.close()

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        self.close()
        return False

    @staticmethod
    def _translate_sql(sql: str) -> str:
        """将 SQLite 专有语法转为 MySQL 语法"""
        import re
        # INSERT OR IGNORE -> INSERT IGNORE
        sql = sql.replace("INSERT OR IGNORE", "INSERT IGNORE")
        # INSERT OR REPLACE INTO -> REPLACE INTO
        sql = sql.replace("INSERT OR REPLACE", "REPLACE")
        # 以下 MySQL 日期函数兼容性翻译：
        #   datetime('now', '-N days') -> DATE_SUB(NOW(), INTERVAL N DAY)
        #   必须在 datetime('now') 简单替换之前执行，否则模式被破坏
        sql = re.sub(
            r"datetime\('now',\s*'-(\d+)\s+days'\)",
            r"DATE_SUB(NOW(), INTERVAL \1 DAY)",
            sql,
            flags=re.IGNORECASE,
        )
        #   date('now', '-' || n || ' days') -> DATE_SUB(CURDATE(), INTERVAL n DAY)
        sql = re.sub(
            r"date\('now',\s*'-'\s*\|\|\s*n\s*\|\|\s*' days'\)",
            "DATE_SUB(CURDATE(), INTERVAL n DAY)",
            sql,
            flags=re.IGNORECASE,
        )
        # datetime('now') -> NOW()
        sql = sql.replace("datetime('now')", "NOW()")
        # AUTOINCREMENT -> AUTO_INCREMENT（MySQL 语法差异）
        sql = sql.replace("AUTOINCREMENT", "AUTO_INCREMENT")
        # MySQL 严格模式不允许 TEXT/BLOB 列有 DEFAULT 值，去除所有 TEXT 列的 DEFAULT '...'
        sql = re.sub(
            r"\b(TEXT|LONGTEXT|BLOB)\s+(?:NOT\s+NULL\s+)?DEFAULT\s+'[^']*'",
            lambda m: m.group(0).replace(m.group(0)[m.group(0).index(" DEFAULT"):], ""),
            sql,
            flags=re.IGNORECASE,
        )
        # 处理 MySQL 保留字 key 作列名（不加反引号会语法错误）
        # 用 lambda 回调避免误伤 PRIMARY/FOREIGN/UNIQUE/INDEX KEY
        sql = re.sub(
            r'(?:PRIMARY|FOREIGN|UNIQUE|INDEX)\s+key\b|(\bkey\b)',
            lambda m: m.group(0) if m.group(1) is None else '`key`',
            sql,
            flags=re.IGNORECASE,
        )
        return sql

    @staticmethod
    def _convert_placeholders(sql: str) -> str:
        """将 SQL 中的 ? 占位符逐个替换为 %s"""
        parts = sql.split("?")
        return "%s".join(parts)


class _MySQLCursorWrapper:
    """包装 pymysql 游标，暴露 fetchone / fetchall 接口"""

    def __init__(self, cursor):
        self._cursor = cursor

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    @property
    def rowcount(self):
        return self._cursor.rowcount

    def close(self):
        self._cursor.close()


# ---------------------------------------------------------------------------
# 获取数据库连接（自动切换 SQLite / MySQL）
# ---------------------------------------------------------------------------
def get_connection():
    """根据当前配置动态返回数据库连接"""
    cfg = _read_db_config()
    db_type = cfg.get("type", "sqlite")

    if db_type == "mysql":
        return _MySQLConnection(
            host=cfg.get("host", "localhost"),
            port=int(cfg.get("port", 3306)),
            user=cfg.get("user", "root"),
            password=cfg.get("password", ""),
            database=cfg.get("database", "xhaos"),
        )
    else:
        os.makedirs(DB_CONFIG_DIR, exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn


# ---------------------------------------------------------------------------
# 切换数据库（更新配置文件 + 同步到 system_settings 表）
# ---------------------------------------------------------------------------
def switch_database(db_type: str, **kwargs) -> str:
    """
    切换数据库类型并保存配置。
    db_type: "sqlite" 或 "mysql"
    返回提示消息。
    """
    from app.models.system_settings import SystemSettingsRepository

    config = {"type": db_type}

    if db_type == "mysql":
        config["host"] = kwargs.get("host", "localhost")
        config["port"] = int(kwargs.get("port", 3306))
        config["user"] = kwargs.get("user", "root")
        config["password"] = kwargs.get("password", "")
        config["database"] = kwargs.get("database", "xhaos")

    # 写入配置文件
    _write_db_config(config)

    # 同步写入 system_settings 表（供前端展示等使用）
    try:
        SystemSettingsRepository.set("db_type", db_type)
        if db_type == "mysql":
            SystemSettingsRepository.set("db_host", config["host"])
            SystemSettingsRepository.set("db_port", str(config["port"]))
            SystemSettingsRepository.set("db_user", config["user"])
            SystemSettingsRepository.set("db_password", config["password"])
            SystemSettingsRepository.set("db_name", config["database"])
    except Exception:
        pass  # 切换后可能旧库已不可用，配置数据已通过文件保存

    return f"已切换至 {'MySQL' if db_type == 'mysql' else 'SQLite'} 数据库"


# ============================================================================
# 建表
# ============================================================================
def init_db():
    with get_connection() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                role_id INTEGER DEFAULT 1,
                create_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS functions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT DEFAULT '',
                url TEXT DEFAULT '',
                parent_id INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                is_menu INTEGER DEFAULT 1
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                is_system INTEGER DEFAULT 0
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS role_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_id INTEGER NOT NULL,
                function_id INTEGER NOT NULL,
                FOREIGN KEY (role_id) REFERENCES roles(id),
                FOREIGN KEY (function_id) REFERENCES functions(id),
                UNIQUE(role_id, function_id)
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                provider TEXT DEFAULT 'openai',
                api_key TEXT NOT NULL DEFAULT '',
                base_url TEXT NOT NULL DEFAULT 'https://api.deepseek.com/v1',
                model_name TEXT NOT NULL DEFAULT '',
                is_default INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                total_tokens INTEGER DEFAULT 0,
                total_calls INTEGER DEFAULT 0,
                create_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS model_daily_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                tokens INTEGER DEFAULT 0,
                calls INTEGER DEFAULT 0,
                FOREIGN KEY (model_id) REFERENCES models(id),
                UNIQUE(model_id, date)
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS lookout_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                url_template TEXT NOT NULL,
                pn_param TEXT DEFAULT 'pn',
                page_size INTEGER DEFAULT 10,
                headers TEXT DEFAULT '',
                cookies TEXT DEFAULT '',
                keyword_placeholder TEXT DEFAULT '{}',
                status INTEGER DEFAULT 1,
                create_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS lookout_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                url TEXT DEFAULT '',
                summary TEXT DEFAULT '',
                publish_time TEXT DEFAULT '',
                source_name TEXT DEFAULT '',
                keyword TEXT DEFAULT '',
                collected_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (source_id) REFERENCES lookout_sources(id)
            )
        ''')
        # 为去重添加唯一索引
        try:
            conn.execute('''
                CREATE UNIQUE INDEX IF NOT EXISTS idx_lookout_dedup
                ON lookout_records(source_id, title, url)
            ''')
        except Exception:
            pass

        # 深度采集：给 lookout_records 添加 full_content 列
        try:
            conn.execute("ALTER TABLE lookout_records ADD COLUMN full_content TEXT DEFAULT ''")
        except Exception:
            pass

        # 深度采集任务表
        conn.execute('''
            CREATE TABLE IF NOT EXISTS scheduled_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                source_ids TEXT NOT NULL DEFAULT '',
                keywords TEXT NOT NULL DEFAULT '',
                pages INTEGER DEFAULT 1,
                cron_expr TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                last_run_at TEXT DEFAULT '',
                create_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')

        # 对话记录表（赵海蓺负责的对话管理）
        conn.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL DEFAULT '',
                model_name TEXT DEFAULT '',
                question TEXT NOT NULL,
                answer TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')

        # 接口管理表
        conn.execute('''
            CREATE TABLE IF NOT EXISTS api_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                api_key TEXT NOT NULL UNIQUE,
                status INTEGER DEFAULT 1,
                call_count INTEGER DEFAULT 0,
                create_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')

        # 用户会话表（陈陆雷负责的会话管理）
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT DEFAULT '新会话',
                mode TEXT DEFAULT 'chat',
                employee_id INTEGER DEFAULT NULL,
                message_count INTEGER DEFAULT 0,
                start_time TEXT NOT NULL DEFAULT (datetime('now')),
                end_time TEXT DEFAULT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES digital_employees(id) ON DELETE SET NULL
            )
        ''')
        # 会话消息表
        conn.execute('''
            CREATE TABLE IF NOT EXISTS session_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
            )
        ''')
        # 技能表
        conn.execute('''
            CREATE TABLE IF NOT EXISTS skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                create_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')
        # 数字员工表
        conn.execute('''
            CREATE TABLE IF NOT EXISTS digital_employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                avatar_url TEXT DEFAULT '',
                welcome_message TEXT DEFAULT '',
                system_prompt TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                create_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')
        # 数字员工-技能关联表
        conn.execute('''
            CREATE TABLE IF NOT EXISTS employee_skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                skill_id INTEGER NOT NULL,
                FOREIGN KEY (employee_id) REFERENCES digital_employees(id) ON DELETE CASCADE,
                FOREIGN KEY (skill_id) REFERENCES skills(id),
                UNIQUE(employee_id, skill_id)
            )
        ''')
        # 系统设置表
        conn.execute('''
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL DEFAULT ''
            )
        ''')
        # 添加 updated_at 列（兼容）
        try:
            conn.execute("ALTER TABLE system_settings ADD COLUMN updated_at TEXT DEFAULT ''")
        except Exception:
            pass


def _get_db_type_for_init():
    """init_db/seed_data 时使用的特殊版本：优先读文件，文件不存在则默认 sqlite"""
    if os.path.exists(DB_CONFIG_FILE):
        return get_db_type()
    return "sqlite"
