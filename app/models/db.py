# 数据库连接与建表
import os
import sqlite3

def _project_root():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))

DB_PATH = os.path.join(_project_root(), "database", "app.db")

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

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
        except sqlite3.OperationalError:
            pass

        # 深度采集：给 lookout_records 添加 full_content 列
        try:
            conn.execute("ALTER TABLE lookout_records ADD COLUMN full_content TEXT DEFAULT ''")
        except sqlite3.OperationalError:
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
