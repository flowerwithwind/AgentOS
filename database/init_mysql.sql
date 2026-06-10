-- ============================================================================
-- XHAgentOS MySQL 数据库初始化脚本
-- 使用方式：
--   mysql -u root -p < init_mysql.sql
-- 或在 MySQL 命令行执行： source /path/to/init_mysql.sql
-- ============================================================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS xhaos
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE xhaos;

-- ============================================================================
-- 1. 基础表
-- ============================================================================

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    is_system   TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 功能菜单表
CREATE TABLE IF NOT EXISTS functions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(100) DEFAULT '',
    url         VARCHAR(500) DEFAULT '',
    parent_id   INT DEFAULT 0,
    sort_order  INT DEFAULT 0,
    is_menu     TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    role_id     INT NOT NULL,
    function_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (function_id) REFERENCES functions(id),
    UNIQUE KEY uk_role_func (role_id, function_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    salt            VARCHAR(64) NOT NULL,
    role_id         INT DEFAULT 1,
    create_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 2. 模型引擎
-- ============================================================================

-- AI 模型表
CREATE TABLE IF NOT EXISTS models (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    provider    VARCHAR(50) DEFAULT 'openai',
    api_key     VARCHAR(500) NOT NULL DEFAULT '',
    base_url    VARCHAR(500) NOT NULL DEFAULT 'https://api.deepseek.com/v1',
    model_name  VARCHAR(200) NOT NULL DEFAULT '',
    is_default  TINYINT DEFAULT 0,
    status      TINYINT DEFAULT 1,
    total_tokens BIGINT DEFAULT 0,
    total_calls  INT DEFAULT 0,
    create_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 模型日用量表
CREATE TABLE IF NOT EXISTS model_daily_usage (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    model_id    INT NOT NULL,
    date        DATE NOT NULL,
    tokens      BIGINT DEFAULT 0,
    calls       INT DEFAULT 0,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
    UNIQUE KEY uk_model_date (model_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 3. 瞭望管理
-- ============================================================================

-- 瞭望源表
CREATE TABLE IF NOT EXISTS lookout_sources (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    url_template        TEXT NOT NULL,
    pn_param            VARCHAR(50) DEFAULT 'pn',
    page_size           INT DEFAULT 10,
    headers             TEXT,
    cookies             TEXT,
    keyword_placeholder VARCHAR(50) DEFAULT '{}',
    status              TINYINT DEFAULT 1,
    create_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 瞭望采集记录表
CREATE TABLE IF NOT EXISTS lookout_records (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    source_id       INT NOT NULL,
    title           VARCHAR(500) NOT NULL,
    url             TEXT,
    summary         TEXT,
    publish_time    VARCHAR(100) DEFAULT '',
    source_name     VARCHAR(200) DEFAULT '',
    keyword         VARCHAR(200) DEFAULT '',
    full_content    LONGTEXT,
    collected_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES lookout_sources(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 瞭望去重唯一索引（MySQL 不支持 IF NOT EXISTS）
CREATE UNIQUE INDEX idx_lookout_dedup
    ON lookout_records(source_id, title(255), url(255));

-- 深度采集任务表
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    source_ids  TEXT NOT NULL,
    keywords    TEXT NOT NULL,
    pages       INT DEFAULT 1,
    cron_expr   VARCHAR(100) DEFAULT '',
    status      TINYINT DEFAULT 1,
    last_run_at DATETIME DEFAULT NULL,
    create_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 4. 对话与聊天
-- ============================================================================

-- 对话记录表
CREATE TABLE IF NOT EXISTS conversations (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    username    VARCHAR(100) NOT NULL DEFAULT '',
    model_name  VARCHAR(200) DEFAULT '',
    question    TEXT NOT NULL,
    answer      LONGTEXT NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    title           VARCHAR(200) DEFAULT '新会话',
    mode            VARCHAR(50) DEFAULT 'chat',
    employee_id     INT DEFAULT NULL,
    message_count   INT DEFAULT 0,
    start_time      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time        DATETIME DEFAULT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 会话消息表
CREATE TABLE IF NOT EXISTS session_messages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    session_id  INT NOT NULL,
    role        VARCHAR(50) NOT NULL,
    content     LONGTEXT NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 5. 技能与数字员工
-- ============================================================================

-- 技能表
CREATE TABLE IF NOT EXISTS skills (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    create_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 数字员工表
CREATE TABLE IF NOT EXISTS digital_employees (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(200) NOT NULL UNIQUE,
    avatar_url      VARCHAR(500) DEFAULT '',
    welcome_message TEXT,
    system_prompt   LONGTEXT,
    status          TINYINT DEFAULT 1,
    create_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 数字员工-技能关联表
CREATE TABLE IF NOT EXISTS employee_skills (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    skill_id    INT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES digital_employees(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    UNIQUE KEY uk_emp_skill (employee_id, skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 6. 系统设置与接口管理
-- ============================================================================

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
    `key`       VARCHAR(200) PRIMARY KEY,
    `value`     LONGTEXT NOT NULL,
    updated_at  DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- API 令牌表
CREATE TABLE IF NOT EXISTS api_tokens (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    api_key     VARCHAR(500) NOT NULL UNIQUE,
    status      TINYINT DEFAULT 1,
    call_count  INT DEFAULT 0,
    create_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 7. 种子数据
-- ============================================================================

-- 角色
INSERT IGNORE INTO roles (id, name, is_system) VALUES
    (1, '超级管理员', 1),
    (2, '普通用户',   1);

-- 功能菜单
INSERT IGNORE INTO functions (id, name, icon, url, parent_id, sort_order, is_menu) VALUES
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
    (19, '会话管理',  'layui-icon-log',      '/admin/session',       14, 3, 1);

-- 超级管理员拥有所有功能权限
INSERT IGNORE INTO role_permissions (role_id, function_id)
    SELECT 1, id FROM functions;

-- 普通用户：后台首页 + 智能问数
INSERT IGNORE INTO role_permissions (role_id, function_id) VALUES
    (2, 1),
    (2, 20);

-- 默认管理员 admin / admin123
-- 密码使用 pbkdf2_hmac(sha256) 加密，salt 随机生成
INSERT IGNORE INTO users (id, username, password_hash, salt, role_id) VALUES
    (1, 'admin',
     '6af0bd20c30d437d0319571bfc9f83f1489f075c218d268b2a7a3837851d94e9',
     '3e56b624f0b169ba5267ecc7c0cb745e',
     1);

-- 示例 AI 模型
INSERT IGNORE INTO models (id, name, provider, api_key, base_url, model_name, is_default, status) VALUES
    (1, 'DeepSeek V4', 'openai',
     'sk-25369530ebd443cfa5cddfde5b819b2b',
     'https://api.deepseek.com/v1',
     'deepseek-v4-flash', 1, 1);

-- 默认瞭望源
INSERT IGNORE INTO lookout_sources (id, name, url_template, pn_param, page_size, keyword_placeholder) VALUES
    (1, '百度新闻', 'https://www.baidu.com/s?tn=news&rtt=1&bsst=1&wd={}', 'pn', 10, '{}'),
    (2, '搜狗新闻', 'https://news.sogou.com/news?query={}',              'page', 10, '{}');

-- ============================================================================
-- 8. 写入当前数据库配置（可选）
-- ============================================================================
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES
    ('site_name', 'XHAgentOS'),
    ('site_description', '基于AI的智能瞭望与智能问数系统'),
    ('db_type', 'mysql'),
    ('theme_color', '#1a1a2e'),
    ('footer_text', 'XHAgentOS v1.0');

-- ============================================================================
-- 完成
-- ============================================================================
SELECT '>>> MySQL 数据库初始化完成！' AS message;
