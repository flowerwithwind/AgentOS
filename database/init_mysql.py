"""
XHAgentOS MySQL 数据库初始化脚本
自动创建 xhaos 数据库、建表、导入种子数据
用法: python database/init_mysql.py
"""
import sys
import os

# 将项目根目录加入 sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), os.pardir))

import json
import re
try:
    import pymysql
except ImportError:
    print("请先安装 pymysql: pip install pymysql")
    sys.exit(1)


def read_db_config():
    config_file = os.path.join(os.path.dirname(__file__), "db_config.json")
    if os.path.exists(config_file):
        with open(config_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def input_with_default(prompt, default):
    val = input(f"{prompt} [{default}]: ").strip()
    return val if val else default


def translate_sql(sql: str) -> str:
    """将 SQLite DDL 转为 MySQL 兼容语法"""
    sql = sql.replace("INSERT OR IGNORE", "INSERT IGNORE")
    sql = sql.replace("INSERT OR REPLACE", "REPLACE")
    sql = sql.replace("datetime('now')", "NOW()")
    sql = sql.replace("AUTOINCREMENT", "AUTO_INCREMENT")
    # 去除 TEXT 列的 DEFAULT ''
    sql = re.sub(
        r"\b(TEXT|LONGTEXT|BLOB)\s+(?:NOT\s+NULL\s+)?DEFAULT\s+''",
        lambda m: m.group(0).replace(" DEFAULT ''", ""),
        sql,
        flags=re.IGNORECASE,
    )
    # key 保留字转义
    sql = re.sub(
        r"(?:PRIMARY|FOREIGN|UNIQUE|INDEX)\s+key\b|(\bkey\b)",
        lambda m: m.group(0) if m.group(1) is None else "`key`",
        sql,
        flags=re.IGNORECASE,
    )
    return sql


# ============================================================================
# 1. 连接信息
# ============================================================================
cfg = read_db_config()
if cfg.get("type") == "mysql":
    host = cfg.get("host", "localhost")
    port = int(cfg.get("port", 3306))
    user = cfg.get("user", "root")
    password = cfg.get("password", "")
    database = cfg.get("database", "xhaos")
    print(">>> 读取到已保存的 MySQL 配置")
else:
    host = input_with_default("MySQL 主机地址", "localhost")
    port = int(input_with_default("端口", "3306"))
    user = input_with_default("用户名", "root")
    password = input("密码: ").strip()
    database = input_with_default("数据库名", "xhaos")

# ============================================================================
# 2. 创建数据库（不指定数据库连接）
# ============================================================================
print(f"\n>>> 正在连接 MySQL ({host}:{port})...")
conn = pymysql.connect(host=host, port=port, user=user, password=password,
                       charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor)
cursor = conn.cursor()
cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database}` "
               f"DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
cursor.execute(f"USE `{database}`")
print(f">>> 数据库 '{database}' 已就绪")

# ============================================================================
# 3. 建表
# ============================================================================
print(">>> 正在建表...")

# 读取 db.py 中的 init_db 函数提取建表 SQL
from app.models.db import init_db as sqlite_init_db
import inspect

# 从 db.py 提取所有 CREATE TABLE 和 CREATE UNIQUE INDEX 语句
db_py_path = os.path.join(os.path.dirname(__file__), os.pardir, "app", "models", "db.py")
with open(db_py_path, "r", encoding="utf-8") as f:
    db_py_source = f.read()

# 提取 init_db 函数中所有 conn.execute('''...''') 中的 SQL
ddl_statements = []
# 匹配三个引号内的 SQL
pattern = r"conn\.execute\('''(.*?)'''\)"
matches = re.findall(pattern, db_py_source, re.DOTALL)

# 加上 init_db 末尾的 ALTER TABLE 语句
alter_pattern = r"conn\.execute\(\"(.*?)\"\)"
alter_matches = re.findall(alter_pattern, db_py_source, re.DOTALL)
matches.extend(alter_matches)

# 额外需要的 DDL (digital_employees 在 user_sessions 引用了，需要在前面创建)
# 排序依赖：先建没有外键依赖的表
ordered_ddl = []
create_table_pattern = re.compile(r"CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)")
for sql in matches:
    sql_clean = sql.strip()
    if not sql_clean:
        continue
    m = create_table_pattern.search(sql_clean)
    if m:
        ordered_ddl.append((m.group(1), sql_clean))
    elif sql_clean.startswith("CREATE UNIQUE INDEX"):
        ordered_ddl.append(("__index__", sql_clean))
    elif sql_clean.startswith("ALTER TABLE"):
        ordered_ddl.append(("__alter__", sql_clean))

# 手动排序确保外键依赖顺序
table_order = [
    "roles", "functions", "users",
    "role_permissions",
    "models", "model_daily_usage",
    "lookout_sources", "lookout_records",
    "scheduled_tasks", "conversations",
    "skills", "digital_employees",
    "employee_skills",
    "user_sessions", "session_messages",
    "api_tokens", "system_settings",
]

# 先按顺序建表
seen = set()
for tname in table_order:
    for name, sql in ordered_ddl:
        if name == tname:
            translated = translate_sql(sql)
            try:
                cursor.execute(translated)
                seen.add(name)
            except Exception as e:
                print(f"  [WARN] 建表 {name} 失败: {e}")
                print(f"  SQL: {translated[:100]}...")

# 建未被排序覆盖的表
for name, sql in ordered_ddl:
    if name not in seen:
        translated = translate_sql(sql)
        try:
            cursor.execute(translated)
        except Exception as e:
            print(f"  [WARN] {name} 执行失败: {e}")

# 处理 ALTER TABLE
for name, sql in ordered_ddl:
    if name == "__alter__":
        try:
            cursor.execute(sql)
        except Exception:
            pass  # 列可能已存在

conn.commit()
print(">>> 建表完成")

# ============================================================================
# 4. 种子数据
# ============================================================================
print(">>> 正在导入种子数据...")

# 角色
cursor.execute("INSERT IGNORE INTO roles (id, name, is_system) VALUES (1, '超级管理员', 1), (2, '普通用户', 1)")

# 功能菜单
funcs = [
    (20, '智能问数',  'layui-icon-dialogue', '/user/chat',           0, 0, 1),
    (1,  '后台首页',  'layui-icon-home',     '/admin/dashboard',     0, 1, 1),
    (2,  '系统管理',  'layui-icon-set',      '',                     0, 2, 1),
    (3,  '用户管理',  'layui-icon-user',     '/admin/users',         2, 1, 1),
    (5,  '角色管理',  'layui-icon-auz',      '/admin/roles',         2, 2, 1),
    (4,  '功能管理',  'layui-icon-set',      '/admin/functions',     2, 3, 1),
    (6,  '权限管理',  'layui-icon-auz',      '/admin/permissions',   2, 4, 1),
    (12, '接口管理',  'layui-icon-component','/admin/api-tokens',    2, 5, 1),
    (21, '系统设置',  'layui-icon-set',      '/admin/settings',      2, 6, 1),
    (22, '数据库切换','layui-icon-engine',   '/admin/db-switch',     2, 7, 1),
    (7,  'AI 模型',   'layui-icon-engine',   '/admin/models',        0, 3, 1),
    (8,  '瞭望管理',  'layui-icon-app',      '',                     0, 4, 1),
    (9,  '瞭望源管理','layui-icon-set',      '/admin/lookout/sources', 8, 1, 1),
    (10, '瞭望采集',  'layui-icon-search',   '/admin/lookout/collect', 8, 2, 1),
    (11, '数据仓库',  'layui-icon-list',     '/admin/lookout/warehouse', 8, 3, 1),
    (16, '数字员工',  'layui-icon-username', '',                     0, 5, 1),
    (18, '员工管理',  'layui-icon-user',     '/admin/digital_employee', 16, 1, 1),
    (17, '技能管理',  'layui-icon-diamond',  '/admin/skill',         16, 2, 1),
    (14, '数据服务',  'layui-icon-chart',    '',                     0, 6, 1),
    (13, '数智大屏',  'layui-icon-screen',   '/admin/big-screen',    14, 1, 1),
    (15, '对话记录',  'layui-icon-dialogue', '/admin/conversations', 14, 2, 1),
    (19, '会话管理',  'layui-icon-log',      '/admin/session',       14, 3, 1),
]
for f in funcs:
    cursor.execute(
        "INSERT IGNORE INTO functions (id, name, icon, url, parent_id, sort_order, is_menu) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s)", f
    )

# 超级管理员权限
cursor.execute("INSERT IGNORE INTO role_permissions (role_id, function_id) SELECT 1, id FROM functions")
# 普通用户权限
cursor.execute("INSERT IGNORE INTO role_permissions (role_id, function_id) VALUES (2, 1), (2, 20)")

# admin 用户 (密码 admin123)
import hashlib, secrets
salt = secrets.token_bytes(16)
pwd_hash = hashlib.pbkdf2_hmac("sha256", b"admin123", salt, 100000)
cursor.execute(
    "INSERT IGNORE INTO users (id, username, password_hash, salt, role_id) VALUES (%s, %s, %s, %s, %s)",
    (1, "admin", pwd_hash.hex(), salt.hex(), 1)
)

# 示例模型
cursor.execute(
    "INSERT IGNORE INTO models (id, name, provider, api_key, base_url, model_name, is_default, status) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
    (1, "DeepSeek V4", "openai", "sk-25369530ebd443cfa5cddfde5b819b2b",
     "https://api.deepseek.com/v1", "deepseek-v4-flash", 1, 1)
)

# 默认瞭望源
cursor.execute(
    "INSERT IGNORE INTO lookout_sources (id, name, url_template, pn_param, page_size, keyword_placeholder) "
    "VALUES (%s, %s, %s, %s, %s, %s)",
    (1, "百度新闻", "https://www.baidu.com/s?tn=news&rtt=1&bsst=1&wd={}", "pn", 10, "{}")
)
cursor.execute(
    "INSERT IGNORE INTO lookout_sources (id, name, url_template, pn_param, page_size, keyword_placeholder) "
    "VALUES (%s, %s, %s, %s, %s, %s)",
    (2, "搜狗新闻", "https://news.sogou.com/news?query={}", "page", 10, "{}")
)

# 系统设置
cursor.execute(
    "INSERT IGNORE INTO system_settings (`key`, `value`) VALUES (%s, %s)",
    ("site_name", "XHAgentOS")
)
cursor.execute(
    "INSERT IGNORE INTO system_settings (`key`, `value`) VALUES (%s, %s)",
    ("db_type", "mysql")
)

conn.commit()
print(">>> 种子数据导入完成")

# ============================================================================
# 5. 保存配置
# ============================================================================
config = {
    "type": "mysql",
    "host": host,
    "port": port,
    "user": user,
    "password": password,
    "database": database,
}
config_file = os.path.join(os.path.dirname(__file__), "db_config.json")
with open(config_file, "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2)
print(f">>> 配置已保存到 {config_file}")

cursor.close()
conn.close()

print("\n" + "=" * 50)
print("  MySQL 初始化完成！")
print("  数据库: " + database)
print("  管理员: admin / admin123")
print("=" * 50)
print("  现在请重启服务: python app.py")
