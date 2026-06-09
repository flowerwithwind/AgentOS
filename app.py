import os
import sqlite3
import logging
import tornado.ioloop
import tornado.web
from tornado.httpserver import HTTPServer

from app.controllers.auth import LoginHandler, LogoutHandler, RegisterHandler
from app.controllers.user_chat import ChatHandler, ChatApiHandler, ChatExportHandler
from app.controllers.admin import (
    DashboardHandler, AdminHomeHandler, DashboardStatsApiHandler,
    MenuApiHandler,
    UserListHandler, UserListApiHandler, UserCreateHandler,
    UserEditHandler, UserDeleteHandler,
    FunctionListHandler, FunctionListApiHandler,
    FunctionCreateHandler, FunctionEditHandler, FunctionDeleteHandler,
    RoleListHandler, RoleListApiHandler, RoleCreateHandler, RoleDeleteHandler,
    PermissionHandler, PermissionRolesApiHandler, PermissionFunctionsApiHandler,
    PermissionSaveHandler,
    ModelEngineHandler, ModelListApiHandler, ModelCreateHandler,
    ModelEditHandler, ModelDeleteHandler, ModelSetDefaultHandler,
    ModelBatchHandler, ModelChatHandler, ModelTrendApiHandler,
    LookoutSourceHandler, LookoutSourceListApiHandler,
    LookoutSourceAddHandler, LookoutSourceEditHandler, LookoutSourceDeleteHandler,
    LookoutCollectHandler, LookoutCollectApiHandler,
    LookoutSaveRecordsHandler,
    LookoutWarehouseHandler, LookoutWarehouseApiHandler,
    # 深度采集
    DeepCollectApiHandler, DeepCollectProgressHandler, DeepCollectContentHandler,
    # 对话管理
    ConversationPageHandler, ConversationListApiHandler,
    ConversationExportHandler,
    # 接口管理
    ApiTokenListHandler, ApiTokenListApiHandler,
    ApiTokenCreateHandler, ApiTokenDeleteHandler,
    # 数智大屏
    BigScreenHandler, BigScreenApiHandler,
    # 技能管理
    SkillListHandler, SkillListApiHandler, SkillAllApiHandler,
    SkillCreateHandler, SkillEditHandler, SkillDeleteHandler,
    # 数字员工管理
    DigitalEmployeeListHandler, DigitalEmployeeListApiHandler,
    DigitalEmployeeCreateHandler, DigitalEmployeeEditHandler,
    DigitalEmployeeDeleteHandler, DigitalEmployeeToggleStatusHandler,
    DigitalEmployeeGetByIdApiHandler, DigitalEmployeeByNameApiHandler,
    # 会话管理
    SessionListHandler, SessionListApiHandler,
    SessionMessagesApiHandler, SessionDeleteHandler,
    # 系统设置
    SystemSettingHandler, SystemSettingApiHandler,
    SystemSettingLogoUploadHandler, SystemSettingLogApiHandler,
    SystemSettingLogClearHandler,
    # 智能问数
    AdminQAHandler,
)
from app.models.db import init_db, get_connection
from app.models.user import UserRepository
# look 模块不再需要 TaskScheduler（已移除深度采集定时任务）
from app.models.lookout import DeepCollectTask


def make_app():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    settings = dict(
        template_path=os.path.join(base_dir, "app", "templates"),
        static_path=os.path.join(base_dir, "app", "static"),
        cookie_secret="demo-cookie-secrete-change-me",
        login_url="/auth/login",
        xsrf_cookies=True,
        debug=True,
        auto_reload=True
    )

    return tornado.web.Application([
        (r"/", LoginHandler),
        # 认证相关
        (r"/auth/login", LoginHandler),
        (r"/auth/register", RegisterHandler),
        (r"/auth/logout", LogoutHandler),
        # 用户侧智能问数
        (r"/user/chat", ChatHandler),
        (r"/user/chat/api", ChatApiHandler),
        (r"/user/chat/export", ChatExportHandler),
        # 后台管理
        (r"/admin", DashboardHandler),
        (r"/admin/dashboard", AdminHomeHandler),
        (r"/admin/menus", MenuApiHandler),
        # 用户管理
        (r"/admin/users", UserListHandler),
        (r"/admin/users/api", UserListApiHandler),
        (r"/admin/users/add", UserCreateHandler),
        (r"/admin/users/edit", UserEditHandler),
        (r"/admin/users/delete", UserDeleteHandler),
        # 功能管理
        (r"/admin/functions", FunctionListHandler),
        (r"/admin/functions/api", FunctionListApiHandler),
        (r"/admin/functions/add", FunctionCreateHandler),
        (r"/admin/functions/edit", FunctionEditHandler),
        (r"/admin/functions/delete", FunctionDeleteHandler),
        # 角色管理
        (r"/admin/roles", RoleListHandler),
        (r"/admin/roles/api", RoleListApiHandler),
        (r"/admin/roles/add", RoleCreateHandler),
        (r"/admin/roles/delete", RoleDeleteHandler),
        # 权限管理
        (r"/admin/permissions", PermissionHandler),
        (r"/admin/permissions/roles", PermissionRolesApiHandler),
        (r"/admin/permissions/functions", PermissionFunctionsApiHandler),
        (r"/admin/permissions/save", PermissionSaveHandler),
        # 模型引擎
        (r"/admin/models", ModelEngineHandler),
        (r"/admin/models/api", ModelListApiHandler),
        (r"/admin/models/add", ModelCreateHandler),
        (r"/admin/models/edit", ModelEditHandler),
        (r"/admin/models/delete", ModelDeleteHandler),
        (r"/admin/models/default", ModelSetDefaultHandler),
        (r"/admin/models/batch", ModelBatchHandler),
        (r"/admin/models/chat", ModelChatHandler),
        (r"/admin/models/trend", ModelTrendApiHandler),
        # 瞭望管理
        (r"/admin/lookout/sources", LookoutSourceHandler),
        (r"/admin/lookout/sources/api", LookoutSourceListApiHandler),
        (r"/admin/lookout/sources/add", LookoutSourceAddHandler),
        (r"/admin/lookout/sources/edit", LookoutSourceEditHandler),
        (r"/admin/lookout/sources/delete", LookoutSourceDeleteHandler),
        (r"/admin/lookout/collect", LookoutCollectHandler),
        (r"/admin/lookout/collect/api", LookoutCollectApiHandler),
        (r"/admin/lookout/collect/save", LookoutSaveRecordsHandler),
        (r"/admin/lookout/warehouse", LookoutWarehouseHandler),
        (r"/admin/lookout/warehouse/api", LookoutWarehouseApiHandler),
        # 深度采集（从数据仓库对已有记录采集完整内容）
        (r"/admin/lookout/warehouse/deep-collect", DeepCollectApiHandler),
        (r"/admin/lookout/warehouse/deep-collect/progress", DeepCollectProgressHandler),
        (r"/admin/lookout/warehouse/deep-collect/content", DeepCollectContentHandler),
        # 对话管理
        (r"/admin/conversations", ConversationPageHandler),
        (r"/admin/conversations/api", ConversationListApiHandler),
        (r"/admin/conversations/export", ConversationExportHandler),
        # 后台首页数据 API
        (r"/admin/dashboard/api", DashboardStatsApiHandler),
        # 接口管理
        (r"/admin/api-tokens", ApiTokenListHandler),
        (r"/admin/api-tokens/api", ApiTokenListApiHandler),
        (r"/admin/api-tokens/add", ApiTokenCreateHandler),
        (r"/admin/api-tokens/delete", ApiTokenDeleteHandler),
        # 数智大屏
        (r"/admin/big-screen", BigScreenHandler),
        (r"/admin/big-screen/api", BigScreenApiHandler),
        # 技能管理
        (r"/admin/skill", SkillListHandler),
        (r"/admin/skill/api", SkillListApiHandler),
        (r"/admin/api/skill/all", SkillAllApiHandler),
        (r"/admin/skill/add", SkillCreateHandler),
        (r"/admin/skill/edit", SkillEditHandler),
        (r"/admin/skill/delete", SkillDeleteHandler),
        # 数字员工管理
        (r"/admin/digital_employee", DigitalEmployeeListHandler),
        (r"/admin/digital_employee/api", DigitalEmployeeListApiHandler),
        (r"/admin/digital_employee/add", DigitalEmployeeCreateHandler),
        (r"/admin/digital_employee/edit", DigitalEmployeeEditHandler),
        (r"/admin/digital_employee/delete", DigitalEmployeeDeleteHandler),
        (r"/admin/digital_employee/toggle", DigitalEmployeeToggleStatusHandler),
        (r"/admin/digital_employee/get", DigitalEmployeeGetByIdApiHandler),
        # 会话管理
        (r"/admin/session", SessionListHandler),
        (r"/admin/session/api", SessionListApiHandler),
        (r"/admin/session/messages", SessionMessagesApiHandler),
        (r"/admin/session/delete", SessionDeleteHandler),
        # 智能问数（iframe内嵌）
        (r"/admin/qa", AdminQAHandler),
        # 系统设置
        (r"/admin/settings", SystemSettingHandler),
        (r"/admin/settings/api", SystemSettingApiHandler),
        (r"/admin/settings/logo", SystemSettingLogoUploadHandler),
        (r"/admin/settings/logs/api", SystemSettingLogApiHandler),
        (r"/admin/settings/logs/clear", SystemSettingLogClearHandler),
        # 用户侧接口
        (r"/api/digital_employee/by_name", DigitalEmployeeByNameApiHandler),
    ], **settings)


def migrate_db():
    """迁移：为旧版 users 表添加 role_id 列"""
    with get_connection() as conn:
        try:
            conn.execute("ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT 1")
        except sqlite3.OperationalError:
            pass  # 列已存在
        for sql in (
            "ALTER TABLE user_sessions ADD COLUMN mode TEXT DEFAULT 'chat'",
            "ALTER TABLE user_sessions ADD COLUMN employee_id INTEGER",
        ):
            try:
                conn.execute(sql)
            except sqlite3.OperationalError:
                pass


def seed_data():
    """种子数据：默认角色 + 默认功能 + 默认管理员"""
    migrate_db()

    with get_connection() as conn:
        # 创建默认角色
        roles = [
            (1, "超级管理员", 1),
            (2, "普通用户", 1),
        ]
        for rid, rname, rsystem in roles:
            conn.execute(
                "INSERT OR IGNORE INTO roles (id, name, is_system) VALUES (?, ?, ?)",
                (rid, rname, rsystem)
            )

        # 创建默认功能
        funcs = [
            (20, "智能问数", "layui-icon-dialogue", "/user/chat",        0, 0, 1),
            (1, "后台首页",  "layui-icon-home",    "/admin/dashboard",  0, 1, 1),
            (2, "系统管理",  "layui-icon-set",      "",                  0, 2, 1),
            (3, "用户管理",  "layui-icon-user",     "/admin/users",      2, 1, 1),
            (5, "角色管理",  "layui-icon-auz",      "/admin/roles",      2, 2, 1),
            (4, "功能管理",  "layui-icon-set",      "/admin/functions",  2, 3, 1),
            (6, "权限管理",  "layui-icon-auz",      "/admin/permissions",2, 4, 1),
            (12, "接口管理", "layui-icon-component", "/admin/api-tokens",       2, 5, 1),
            (7, "AI 模型",   "layui-icon-engine",   "/admin/models",     0, 3, 1),
            (8, "瞭望管理",  "layui-icon-app",      "",                   0, 4, 1),
            (9, "瞭望源管理","layui-icon-set",      "/admin/lookout/sources",8, 1, 1),
            (10, "瞭望采集", "layui-icon-search",   "/admin/lookout/collect",8, 2, 1),
            (11, "数据仓库", "layui-icon-list",     "/admin/lookout/warehouse",8, 3, 1),
            (16, "数字员工", "layui-icon-username", "",                   0, 5, 1),
            (18, "员工管理", "layui-icon-user",     "/admin/digital_employee",16, 1, 1),
            (17, "技能管理", "layui-icon-diamond",  "/admin/skill",      16, 2, 1),
            (14, "数据服务", "layui-icon-chart",    "",                   0, 6, 1),
            (13, "数智大屏", "layui-icon-screen",   "/admin/big-screen",  14, 1, 1),
            (15, "对话记录", "layui-icon-dialogue", "/admin/conversations",14, 2, 1),
            (19, "会话管理", "layui-icon-log",      "/admin/session",     14, 3, 1),
            (21, "系统设置", "layui-icon-set",      "/admin/settings",    2, 6, 1),
        ]
        for fid, fname, ficon, furl, fparent, fsort, fmenu in funcs:
            conn.execute(
                "INSERT OR IGNORE INTO functions (id, name, icon, url, parent_id, sort_order, is_menu) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (fid, fname, ficon, furl, fparent, fsort, fmenu)
            )

        # 超级管理员角色（role_id=1）分配所有功能权限
        for fid, _, _, _, _, _, _ in funcs:
            conn.execute(
                "INSERT OR IGNORE INTO role_permissions (role_id, function_id) VALUES (1, ?)",
                (fid,)
            )

        # 普通用户：后台首页 + 智能问数
        for fid in (1, 20):
            conn.execute(
                "INSERT OR IGNORE INTO role_permissions (role_id, function_id) VALUES (2, ?)",
                (fid,),
            )

    # 兼容旧库：补充智能问数菜单
    with get_connection() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO functions (id, name, icon, url, parent_id, sort_order, is_menu) "
            "VALUES (20, '智能问数', 'layui-icon-dialogue', '/user/chat', 0, 0, 1)"
        )
        for role_id in (1, 2):
            conn.execute(
                "INSERT OR IGNORE INTO role_permissions (role_id, function_id) VALUES (?, 20)",
                (role_id,),
            )

    # 创建 admin 管理员
    user = UserRepository.get_user_by_username("admin")
    if not user:
        UserRepository.create_user("admin", "admin123", role_id=1)
        print(">>> 已创建默认管理员: admin / admin123 (超级管理员)")
    else:
        # 确保 admin 是超级管理员角色
        with get_connection() as conn:
            conn.execute("UPDATE users SET role_id = 1 WHERE username = 'admin'")

    # 创建示例模型（如果没有任何模型）
    with get_connection() as conn:
        cnt = conn.execute("SELECT COUNT(*) AS cnt FROM models").fetchone()["cnt"]
        if cnt == 0:
            conn.execute(
                "INSERT INTO models (name, provider, api_key, base_url, model_name, is_default, status) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("DeepSeek V4", "openai", "sk-25369530ebd443cfa5cddfde5b819b2b", "https://api.deepseek.com/v1",
                 "deepseek-v4-flash", 1, 1)
            )
            print(">>> 已创建示例模型: DeepSeek V4")

    # 创建默认瞭望源（百度新闻、搜狗新闻）
    with get_connection() as conn:
        cnt = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_sources").fetchone()["cnt"]
        if cnt == 0:
            default_sources = [
                ("百度新闻", "https://www.baidu.com/s?tn=news&rtt=1&bsst=1&wd={}", "pn", 10, "{}"),
                ("搜狗新闻", "https://news.sogou.com/news?query={}", "page", 10, "{}"),
            ]
            for name, url, pn, ps, ph in default_sources:
                conn.execute(
                    "INSERT INTO lookout_sources (name, url_template, pn_param, page_size, keyword_placeholder) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (name, url, pn, ps, ph)
                )
            print(">>> 已创建默认瞭望源: 百度新闻、搜狗新闻")


if __name__ == "__main__":
    init_db()
    seed_data()
    # 配置日志
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "app.log")
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger(__name__)
    app = make_app()
    server = HTTPServer(app)
    server.listen(10086)
    DeepCollectTask.init_db()
    print("Server Start At http://127.0.0.1:10086")
    tornado.ioloop.IOLoop.current().start()
