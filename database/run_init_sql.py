"""
通过 pymysql 执行 init_mysql.sql 初始化 MySQL 数据库
用法: python database/run_init_sql.py
"""
import sys, os, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), os.pardir))

import json
import pymysql

# 读取配置
config_file = os.path.join(os.path.dirname(__file__), "db_config.json")
with open(config_file, "r", encoding="utf-8") as f:
    cfg = json.load(f)

host = cfg.get("host", "localhost")
port = int(cfg.get("port", 3306))
user = cfg.get("user", "root")
password = cfg.get("password", "")
database = cfg.get("database", "xhaos")

print(f">>> 连接 MySQL ({host}:{port})...")

# 1. 先创建数据库（不指定库）
conn = pymysql.connect(host=host, port=port, user=user, password=password,
                       charset="utf8mb4")
cursor = conn.cursor()
cursor.execute(f"DROP DATABASE IF EXISTS `{database}`")
cursor.execute(f"CREATE DATABASE `{database}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
cursor.execute(f"USE `{database}`")
print(f">>> 数据库 '{database}' 已重建")

# 2. 读取并执行 SQL 文件
sql_file = os.path.join(os.path.dirname(__file__), "init_mysql.sql")
with open(sql_file, "r", encoding="utf-8") as f:
    sql_content = f.read()

# 按分号分隔为多条语句，去掉注释和空行
statements = []
for stmt in re.split(r';', sql_content):
    stmt = stmt.strip()
    # 去掉单行注释
    stmt = re.sub(r'--.*', '', stmt)
    # 去掉多行注释
    stmt = re.sub(r'/\*.*?\*/', '', stmt, flags=re.DOTALL)
    stmt = stmt.strip()
    if stmt and stmt.upper() not in ('', 'SELECT'):
        statements.append(stmt)

success = 0
failed = 0
for stmt in statements:
    try:
        cursor.execute(stmt)
        success += 1
    except Exception as e:
        print(f"  [FAIL] {e}")
        print(f"  SQL: {stmt[:80]}...")
        failed += 1

conn.commit()
cursor.close()
conn.close()

print(f">>> 执行完成: {success} 条成功, {failed} 条失败")
if failed == 0:
    print(">>> MySQL 数据库初始化成功！")
    print(">>> 现在请重启服务: python app.py")
