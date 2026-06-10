# 后台管理控制层
import json
import tornado.web
from app.controllers.base import BaseHandler
from app.models.user import UserRepository
from app.models.role import FunctionRepository, RoleRepository
from app.models.model import ModelRepository
from app.models.lookout import LookoutSourceRepository, LookoutRecordRepository, BaiduNewsCollector
from app.models.lookout import DeepCollectTask
from app.models.conversation import ConversationRepository, SessionRepository
from app.models.api_token import ApiTokenRepository
from app.models.skill import SkillRepository
from app.models.digital_employee import DigitalEmployeeRepository
from app.models.system_settings import SystemSettingsRepository


def _get_username(handler):
    u = handler.current_user
    return u if isinstance(u, str) else u.decode("utf-8") if u else ""


# ====== 后台布局 / 主页 ======

class DashboardHandler(BaseHandler):
    """后台管理布局（左侧菜单 + 右侧 iframe）"""
    @tornado.web.authenticated
    def get(self):
        username = _get_username(self)
        settings = SystemSettingsRepository.get_all()
        theme_color = settings.get("theme_color", "#1a1a2e")
        site_logo = settings.get("site_logo", "")
        site_name = settings.get("site_name", "XHAgentOS")
        self.render("admin.html", title="管理后台", username=username,
                     theme_color=theme_color, site_logo=site_logo, site_name=site_name)


class AdminHomeHandler(BaseHandler):
    """后台主页占位"""
    @tornado.web.authenticated
    def get(self):
        username = _get_username(self)
        self.render("admin_dashboard.html", title="后台首页")


# ====== 菜单 API（动态加载侧边栏）======

class MenuApiHandler(BaseHandler):
    """返回当前用户可见的菜单（JSON）"""
    @tornado.web.authenticated
    def get(self):
        user = UserRepository.get_user_by_username(_get_username(self))
        role_id = user["role_id"] if user else 2
        menus = RoleRepository.get_menus_for_role(role_id)
        # 构建树形结构
        menu_map = {}
        tree = []
        for m in menus:
            item = dict(id=m["id"], name=m["name"], icon=m["icon"],
                        url=m["url"], parent_id=m["parent_id"], children=[])
            menu_map[m["id"]] = item
            if m["parent_id"] == 0:
                tree.append(item)
            elif m["parent_id"] in menu_map:
                menu_map[m["parent_id"]]["children"].append(item)
        self.write({"code": 0, "data": tree})


# ====== 用户管理 ======

class UserListHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        self.render("admin_user_list.html", title="用户管理", username=_get_username(self))


class UserListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        limit = int(self.get_argument("limit", "28"))
        users, total = UserRepository.list_users(page, limit)
        data = []
        for u in users:
            data.append({
                "id": u["id"],
                "username": u["username"],
                "role_id": u["role_id"],
                "role_name": u["role_name"] or "普通用户",
                "create_at": u["create_at"]
            })
        self.write({"code": 0, "msg": "", "count": total, "data": data})


# ====== 对话管理 ======

class ConversationPageHandler(BaseHandler):
    """对话管理页面"""
    @tornado.web.authenticated
    def get(self):
        self.render("admin_conversation.html", title="对话管理",
                     username=_get_username(self))


class ConversationListApiHandler(BaseHandler):
    """对话列表 API"""
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        limit = int(self.get_argument("limit", "20"))
        username = self.get_argument("username", "")
        keyword = self.get_argument("keyword", "")
        date_from = self.get_argument("date_from", "")
        date_to = self.get_argument("date_to", "")
        records, total = ConversationRepository.list_page(
            page, limit, username=username, keyword=keyword,
            date_from=date_from, date_to=date_to
        )
        data = []
        for r in records:
            data.append({
                "id": r["id"],
                "user_id": r["user_id"],
                "username": r["username"],
                "model_name": r["model_name"],
                "question": r["question"],
                "answer": r["answer"],
                "created_at": r["created_at"],
            })
        self.write({"code": 0, "msg": "", "count": total, "data": data})


class ConversationExportHandler(BaseHandler):
    """导出对话记录为 CSV"""
    @tornado.web.authenticated
    def get(self):
        username = self.get_argument("username", "")
        keyword = self.get_argument("keyword", "")
        date_from = self.get_argument("date_from", "")
        date_to = self.get_argument("date_to", "")
        csv_content = ConversationRepository.export_csv(
            username=username, keyword=keyword,
            date_from=date_from, date_to=date_to
        )
        self.set_header("Content-Type", "text/csv; charset=utf-8-sig")
        self.set_header("Content-Disposition",
                        "attachment; filename=conversations.csv")
        self.write(csv_content)


# ====== 深度采集（从数据仓库对已有记录采集完整内容）======

class DeepCollectApiHandler(BaseHandler):
    """深度采集 API：对数据仓库中选中的记录采集完整内容"""
    @tornado.web.authenticated
    def post(self):
        record_ids_str = self.get_body_argument("record_ids", "")
        if not record_ids_str.strip():
            self.write({"code": 1, "msg": "请选择要采集的数据记录"})
            return

        record_ids = [int(x) for x in record_ids_str.split(",") if x.strip()]
        if not record_ids:
            self.write({"code": 1, "msg": "请选择要采集的数据记录"})
            return

        try:
            task_id = DeepCollectTask.start(record_ids)
            self.write({"code": 0, "msg": "采集任务已启动", "task_id": task_id})
        except Exception as e:
            self.write({"code": 1, "msg": f"启动采集失败: {str(e)}"})


class DeepCollectProgressHandler(BaseHandler):
    """深度采集进度查询 API"""
    @tornado.web.authenticated
    def get(self):
        task_id = self.get_argument("task_id", "")
        if not task_id:
            self.write({"code": 1, "msg": "缺少 task_id"})
            return
        progress = DeepCollectTask.get_progress(task_id)
        self.write({"code": 0, "data": progress})


class DeepCollectContentHandler(BaseHandler):
    """获取某条记录的完整内容"""
    @tornado.web.authenticated
    def get(self):
        record_id = int(self.get_argument("id", "0"))
        if record_id <= 0:
            self.write({"code": 1, "msg": "参数错误"})
            return
        content = DeepCollectTask.get_full_content(record_id)
        if content:
            self.write({"code": 0, "data": content})
        else:
            self.write({"code": 1, "msg": "暂无内容"})


class UserCreateHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        roles = RoleRepository.list_all()
        self.render("admin_user_form.html", title="新增用户",
                     username=_get_username(self), user=None, roles=roles)

    @tornado.web.authenticated
    def post(self):
        username = self.get_body_argument("username", "").strip()
        password = self.get_body_argument("password", "")
        role_id = int(self.get_body_argument("role_id", "2"))
        if not username or not password:
            self.write({"code": 1, "msg": "用户名和密码不能为空"})
            return
        ok = UserRepository.create_user(username, password, role_id)
        if ok:
            self.write({"code": 0, "msg": "创建成功"})
        else:
            self.write({"code": 1, "msg": "用户名已存在"})


class UserEditHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        user_id = int(self.get_argument("id", "0"))
        user = UserRepository.get_user_by_id(user_id)
        if not user:
            raise tornado.web.HTTPError(404)
        roles = RoleRepository.list_all()
        self.render("admin_user_form.html", title="编辑用户",
                     username=_get_username(self), user=user, roles=roles)

    @tornado.web.authenticated
    def post(self):
        user_id = int(self.get_body_argument("id", "0"))
        username = self.get_body_argument("username", "").strip()
        password = self.get_body_argument("password", "").strip()
        role_id = int(self.get_body_argument("role_id", "2"))
        if not username:
            self.write({"code": 1, "msg": "用户名不能为空"})
            return
        ok = UserRepository.update_user(user_id, username, password or None)
        if ok:
            UserRepository.update_user_role(user_id, role_id)
            self.write({"code": 0, "msg": "更新成功"})
        else:
            self.write({"code": 1, "msg": "更新失败"})


class UserDeleteHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        user_id = int(self.get_body_argument("id", "0"))
        ok = UserRepository.delete_user(user_id)
        self.write({"code": 0 if ok else 1, "msg": "删除成功" if ok else "删除失败"})


# ====== 功能管理 ======

class FunctionListHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        self.render("admin_function_list.html", title="功能管理",
                     username=_get_username(self))


class FunctionListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        funcs = FunctionRepository.list_all()
        data = []
        for f in funcs:
            data.append({
                "id": f["id"], "name": f["name"], "icon": f["icon"],
                "url": f["url"], "parent_id": f["parent_id"],
                "sort_order": f["sort_order"], "is_menu": f["is_menu"]
            })
        self.write({"code": 0, "msg": "", "count": len(data), "data": data})


class FunctionCreateHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        parents = FunctionRepository.list_all()
        self.render("admin_function_form.html", title="新增功能",
                     username=_get_username(self), func=None, parents=parents)

    @tornado.web.authenticated
    def post(self):
        name = self.get_body_argument("name", "").strip()
        icon = self.get_body_argument("icon", "")
        url = self.get_body_argument("url", "")
        parent_id = int(self.get_body_argument("parent_id", "0"))
        sort_order = int(self.get_body_argument("sort_order", "0"))
        is_menu = int(self.get_body_argument("is_menu", "1"))
        if not name:
            self.write({"code": 1, "msg": "功能名称不能为空"})
            return
        ok = FunctionRepository.create(name, icon, url, parent_id, sort_order, is_menu)
        self.write({"code": 0 if ok else 1, "msg": "创建成功" if ok else "创建失败"})


class FunctionEditHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        func_id = int(self.get_argument("id", "0"))
        func = FunctionRepository.get_by_id(func_id)
        if not func:
            raise tornado.web.HTTPError(404)
        parents = FunctionRepository.list_all()
        self.render("admin_function_form.html", title="编辑功能",
                     username=_get_username(self), func=func, parents=parents)

    @tornado.web.authenticated
    def post(self):
        func_id = int(self.get_body_argument("id", "0"))
        name = self.get_body_argument("name", "").strip()
        icon = self.get_body_argument("icon", "")
        url = self.get_body_argument("url", "")
        parent_id = int(self.get_body_argument("parent_id", "0"))
        sort_order = int(self.get_body_argument("sort_order", "0"))
        is_menu = int(self.get_body_argument("is_menu", "1"))
        if not name:
            self.write({"code": 1, "msg": "功能名称不能为空"})
            return
        ok = FunctionRepository.update(func_id, name, icon, url, parent_id, sort_order, is_menu)
        self.write({"code": 0 if ok else 1, "msg": "更新成功" if ok else "更新失败"})


class FunctionDeleteHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        func_id = int(self.get_body_argument("id", "0"))
        ok = FunctionRepository.delete(func_id)
        self.write({"code": 0 if ok else 1, "msg": "删除成功" if ok else "删除失败"})


# ====== 角色管理 ======

class RoleListHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        self.render("admin_role_list.html", title="角色管理",
                     username=_get_username(self))


class RoleListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        roles = RoleRepository.list_all()
        data = []
        for r in roles:
            user_count = RoleRepository.get_user_count(r["id"])
            data.append({
                "id": r["id"], "name": r["name"],
                "is_system": r["is_system"],
                "user_count": user_count
            })
        self.write({"code": 0, "msg": "", "count": len(data), "data": data})


class RoleCreateHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        name = self.get_body_argument("name", "").strip()
        if not name:
            self.write({"code": 1, "msg": "角色名称不能为空"})
            return
        ok = RoleRepository.create(name)
        self.write({"code": 0 if ok else 1, "msg": "创建成功" if ok else "角色名已存在"})


class RoleDeleteHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        role_id = int(self.get_body_argument("id", "0"))
        ok = RoleRepository.delete(role_id)
        if ok:
            self.write({"code": 0, "msg": "删除成功"})
        else:
            self.write({"code": 1, "msg": "系统角色不可删除或不存在"})


# ====== 权限管理 ======

class PermissionHandler(BaseHandler):
    """权限管理页面（角色-功能二级联动）"""
    @tornado.web.authenticated
    def get(self):
        self.render("admin_permission.html", title="权限管理",
                     username=_get_username(self))


class PermissionRolesApiHandler(BaseHandler):
    """获取所有角色（用于权限页下拉）"""
    @tornado.web.authenticated
    def get(self):
        roles = RoleRepository.list_all()
        data = [{"id": r["id"], "name": r["name"]} for r in roles]
        self.write({"code": 0, "data": data})


class PermissionFunctionsApiHandler(BaseHandler):
    """获取功能树+指定角色的已授权ID"""
    @tornado.web.authenticated
    def get(self):
        role_id = int(self.get_argument("role_id", "0"))
        funcs = FunctionRepository.list_all()
        granted = RoleRepository.get_permissions(role_id) if role_id else []

        # 构建树
        func_map = {}
        tree = []
        for f in funcs:
            item = dict(id=f["id"], name=f["name"], parent_id=f["parent_id"],
                        checked=f["id"] in granted)
            func_map[f["id"]] = item
            if f["parent_id"] == 0:
                tree.append(item)
            elif f["parent_id"] in func_map:
                if "children" not in func_map[f["parent_id"]]:
                    func_map[f["parent_id"]]["children"] = []
                func_map[f["parent_id"]]["children"].append(item)

        self.write({"code": 0, "data": tree})


class PermissionSaveHandler(BaseHandler):
    """保存角色权限"""
    @tornado.web.authenticated
    def post(self):
        role_id = int(self.get_body_argument("role_id", "0"))
        function_ids_str = self.get_body_argument("function_ids", "")
        function_ids = [int(x) for x in function_ids_str.split(",") if x.strip()]
        RoleRepository.set_permissions(role_id, function_ids)
        self.write({"code": 0, "msg": "保存成功"})


# ====== 模型引擎 ======

class ModelEngineHandler(BaseHandler):
    """模型引擎主页（橱窗卡片风格）"""
    @tornado.web.authenticated
    def get(self):
        self.render("admin_model_engine.html", title="模型引擎",
                     username=_get_username(self))


class ModelListApiHandler(BaseHandler):
    """模型列表 API（分页）"""
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        limit = int(self.get_argument("limit", "6"))
        models, total = ModelRepository.list_page(page, limit)
        data = []
        for m in models:
            data.append({
                "id": m["id"],
                "name": m["name"],
                "provider": m["provider"],
                "api_key": m["api_key"][:8] + "..." if len(m["api_key"]) > 12 else m["api_key"],
                "base_url": m["base_url"],
                "model_name": m["model_name"],
                "is_default": m["is_default"],
                "status": m["status"],
                "total_tokens": m["total_tokens"],
                "total_calls": m["total_calls"],
                "create_at": m["create_at"]
            })
        self.write({"code": 0, "msg": "", "count": total, "data": data})


class ModelCreateHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        name = self.get_body_argument("name", "").strip()
        provider = self.get_body_argument("provider", "openai")
        api_key = self.get_body_argument("api_key", "").strip()
        base_url = self.get_body_argument("base_url", "https://api.deepseek.com/v1").strip()
        model_name = self.get_body_argument("model_name", "").strip()
        if not name or not api_key or not model_name:
            self.write({"code": 1, "msg": "名称、API密钥和模型名不能为空"})
            return
        ok = ModelRepository.create(name, api_key, base_url, model_name, provider)
        self.write({"code": 0 if ok else 1, "msg": "创建成功" if ok else "创建失败"})


class ModelEditHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        model_id = int(self.get_body_argument("id", "0"))
        name = self.get_body_argument("name", "").strip()
        provider = self.get_body_argument("provider", "openai")
        api_key = self.get_body_argument("api_key", "").strip()
        base_url = self.get_body_argument("base_url", "https://api.deepseek.com/v1").strip()
        model_name = self.get_body_argument("model_name", "").strip()
        if not name or not model_name:
            self.write({"code": 1, "msg": "名称和模型名不能为空"})
            return
        ok = ModelRepository.update(model_id, name, api_key, base_url, model_name, provider)
        self.write({"code": 0 if ok else 1, "msg": "更新成功" if ok else "更新失败"})


class ModelDeleteHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        model_id = int(self.get_body_argument("id", "0"))
        ok = ModelRepository.delete(model_id)
        self.write({"code": 0 if ok else 1, "msg": "删除成功" if ok else "删除失败"})


class ModelSetDefaultHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        model_id = int(self.get_body_argument("id", "0"))
        ok = ModelRepository.set_default(model_id)
        self.write({"code": 0 if ok else 1, "msg": "设置成功" if ok else "设置失败"})


class ModelBatchHandler(BaseHandler):
    """批量操作：delete / enable / disable"""
    @tornado.web.authenticated
    def post(self):
        action = self.get_body_argument("action", "")
        ids_str = self.get_body_argument("ids", "")
        ids = [int(x) for x in ids_str.split(",") if x.strip()]
        if not ids:
            self.write({"code": 1, "msg": "请选择模型"})
            return
        if action == "delete":
            cnt = ModelRepository.batch_delete(ids)
            self.write({"code": 0, "msg": f"成功删除 {cnt} 个模型"})
        elif action == "enable":
            cnt = ModelRepository.batch_set_status(ids, 1)
            self.write({"code": 0, "msg": f"成功启用 {cnt} 个模型"})
        elif action == "disable":
            cnt = ModelRepository.batch_set_status(ids, 0)
            self.write({"code": 0, "msg": f"成功禁用 {cnt} 个模型"})
        else:
            self.write({"code": 1, "msg": "未知操作"})


class ModelChatHandler(BaseHandler):
    """对话测试 - 调用 OpenAI API"""
    @tornado.web.authenticated
    def post(self):
        import json
        model_id = int(self.get_body_argument("model_id", "0"))
        message = self.get_body_argument("message", "").strip()
        if not message:
            self.write({"code": 1, "msg": "请输入消息"})
            return
        model = ModelRepository.get_by_id(model_id)
        if not model:
            self.write({"code": 1, "msg": "模型不存在"})
            return
        try:
            from openai import OpenAI
            API_KEY = model["api_key"]
            client = OpenAI(
                api_key=API_KEY,
                base_url=model["base_url"]
            )
            response = client.chat.completions.create(
                model=model["model_name"],
                messages=[{"role": "user", "content": message}]
            )
            reply = response.choices[0].message.content
            # 记录 token 用量
            if hasattr(response, "usage") and response.usage:
                tokens = (response.usage.prompt_tokens or 0) + \
                         (response.usage.completion_tokens or 0)
                ModelRepository.record_usage(model_id, tokens)
            self.write({"code": 0, "reply": reply})
        except Exception as e:
            self.write({"code": 1, "msg": f"调用失败: {str(e)}"})


class ModelTrendApiHandler(BaseHandler):
    """模型 Token 趋势图 API（近30天）"""
    @tornado.web.authenticated
    def get(self):
        model_id = int(self.get_argument("id", "0"))
        if model_id <= 0:
            self.write({"code": 1, "msg": "参数错误"})
            return
        trend = ModelRepository.get_monthly_trend(model_id)
        self.write({"code": 0, "data": trend})


# ====== 瞭望管理 ======

class LookoutSourceHandler(BaseHandler):
    """瞭望源管理主页"""
    @tornado.web.authenticated
    def get(self):
        self.render("admin_lookout_source.html", title="瞭望源管理",
                     username=_get_username(self))


class LookoutSourceListApiHandler(BaseHandler):
    """瞭望源列表 API（分页）"""
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        limit = int(self.get_argument("limit", "10"))
        sources, total = LookoutSourceRepository.list_page(page, limit)
        data = []
        for s in sources:
            data.append({
                "id": s["id"],
                "name": s["name"],
                "url_template": s["url_template"],
                "pn_param": s["pn_param"],
                "page_size": s["page_size"],
                "keyword_placeholder": s["keyword_placeholder"],
                "status": s["status"],
                "create_at": s["create_at"],
            })
        self.write({"code": 0, "msg": "", "count": total, "data": data})


class LookoutSourceAddHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        name = self.get_body_argument("name", "").strip()
        url_template = self.get_body_argument("url_template", "").strip()
        pn_param = self.get_body_argument("pn_param", "pn").strip()
        page_size = int(self.get_body_argument("page_size", "10"))
        keyword_placeholder = self.get_body_argument("keyword_placeholder", "{}").strip()
        if not name or not url_template:
            self.write({"code": 1, "msg": "名称和URL模板不能为空"})
            return
        ok = LookoutSourceRepository.create(
            name, url_template, pn_param, page_size,
            keyword_placeholder=keyword_placeholder
        )
        self.write({"code": 0 if ok else 1, "msg": "创建成功" if ok else "创建失败"})


class LookoutSourceEditHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        sid = int(self.get_body_argument("id", "0"))
        name = self.get_body_argument("name", "").strip()
        url_template = self.get_body_argument("url_template", "").strip()
        pn_param = self.get_body_argument("pn_param", "pn").strip()
        page_size = int(self.get_body_argument("page_size", "10"))
        keyword_placeholder = self.get_body_argument("keyword_placeholder", "{}").strip()
        if not name or not url_template:
            self.write({"code": 1, "msg": "名称和URL模板不能为空"})
            return
        ok = LookoutSourceRepository.update(
            sid, name, url_template, pn_param, page_size,
            keyword_placeholder=keyword_placeholder
        )
        self.write({"code": 0 if ok else 1, "msg": "更新成功" if ok else "更新失败"})


class LookoutSourceDeleteHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        sid = int(self.get_body_argument("id", "0"))
        ok = LookoutSourceRepository.delete(sid)
        self.write({"code": 0 if ok else 1, "msg": "删除成功" if ok else "删除失败"})


class LookoutCollectHandler(BaseHandler):
    """瞭望采集主页"""
    @tornado.web.authenticated
    def get(self):
        sources = LookoutSourceRepository.list_all()
        self.render("admin_lookout_collect.html", title="瞭望采集",
                     username=_get_username(self), sources=sources)


class LookoutCollectApiHandler(BaseHandler):
    """执行采集 API"""
    @tornado.web.authenticated
    def post(self):
        source_id = int(self.get_body_argument("source_id", "0"))
        keyword = self.get_body_argument("keyword", "").strip()
        page = int(self.get_body_argument("page", "0"))
        page_size = int(self.get_body_argument("page_size", "0"))
        if source_id <= 0 or not keyword:
            self.write({"code": 1, "msg": "请选择采集源并输入关键词"})
            return
        source = LookoutSourceRepository.get_by_id(source_id)
        if not source:
            self.write({"code": 1, "msg": "采集源不存在"})
            return
        # 如果前端传了 page_size，临时覆盖源的 page_size
        if page_size > 0:
            source = dict(source)
            source["page_size"] = page_size
        try:
            results = BaiduNewsCollector.collect(source, keyword, page)
            self.write({
                "code": 0,
                "msg": f"采集完成，获取 {len(results)} 条",
                "data": results
            })
        except Exception as e:
            self.write({"code": 1, "msg": f"采集失败: {str(e)}"})


class LookoutSaveRecordsHandler(BaseHandler):
    """保存选中的采集记录到数据仓库"""
    @tornado.web.authenticated
    def post(self):
        import json
        source_id = int(self.get_body_argument("source_id", "0"))
        records_json = self.get_body_argument("records", "[]")
        try:
            items = json.loads(records_json)
        except json.JSONDecodeError:
            self.write({"code": 1, "msg": "数据格式错误"})
            return
        if not items:
            self.write({"code": 1, "msg": "请选择要保存的记录"})
            return
        records = []
        for item in items:
            records.append({
                "source_id": source_id,
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "summary": item.get("summary", ""),
                "publish_time": item.get("publish_time", ""),
                "source_name": item.get("source_name", ""),
                "keyword": item.get("keyword", ""),
            })
        count = LookoutRecordRepository.batch_insert(records)
        self.write({"code": 0, "msg": f"成功保存 {count} 条到数据仓库"})


class LookoutWarehouseHandler(BaseHandler):
    """数据仓库主页"""
    @tornado.web.authenticated
    def get(self):
        sources = LookoutSourceRepository.list_all()
        self.render("admin_lookout_warehouse.html", title="数据仓库",
                     username=_get_username(self), sources=sources)


class LookoutWarehouseApiHandler(BaseHandler):
    """数据仓库列表 API"""
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        limit = int(self.get_argument("limit", "20"))
        source_id = self.get_argument("source_id", "")
        keyword = self.get_argument("keyword", "")
        date_from = self.get_argument("date_from", "")
        date_to = self.get_argument("date_to", "")
        sid = int(source_id) if source_id and source_id.isdigit() else None
        records, total = LookoutRecordRepository.list_page(
            page, limit, source_id=sid,
            keyword=keyword, date_from=date_from, date_to=date_to
        )
        data = []
        for r in records:
            data.append({
                "id": r["id"],
                "source_id": r["source_id"],
                "source_name_label": r["source_name_label"],
                "title": r["title"],
                "url": r["url"],
                "summary": r["summary"],
                "publish_time": r["publish_time"],
                "source_name": r["source_name"],
                "keyword": r["keyword"],
                "collected_at": r["collected_at"],
                "full_content": bool(r["full_content"]) if "full_content" in r.keys() else False,
            })
        self.write({"code": 0, "msg": "", "count": total, "data": data})


# ====== 后台首页数据 API ======

class DashboardStatsApiHandler(BaseHandler):
    """后台首页概览数据"""
    @tornado.web.authenticated
    def get(self):
        from app.models.db import get_connection
        with get_connection() as conn:
            user_count = conn.execute("SELECT COUNT(*) AS cnt FROM users").fetchone()["cnt"]
            model_count = conn.execute("SELECT COUNT(*) AS cnt FROM models").fetchone()["cnt"]
            source_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_sources").fetchone()["cnt"]
            record_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_records").fetchone()["cnt"]
            api_token_count = conn.execute("SELECT COUNT(*) AS cnt FROM api_tokens").fetchone()["cnt"]

            # 近期用户
            recent_users = []
            for r in conn.execute(
                "SELECT u.id, u.username, u.create_at, COALESCE(r.name,'普通用户') AS role_name "
                "FROM users u LEFT JOIN roles r ON r.id = u.role_id ORDER BY u.id DESC LIMIT 5"
            ).fetchall():
                recent_users.append({
                    "id": r["id"], "username": r["username"],
                    "role_name": r["role_name"], "create_at": r["create_at"]
                })

            # 近期采集记录
            recent_records = []
            for r in conn.execute(
                "SELECT id, title, source_name, keyword, collected_at "
                "FROM lookout_records ORDER BY id DESC LIMIT 5"
            ).fetchall():
                recent_records.append({
                    "id": r["id"], "title": r["title"],
                    "source_name": r["source_name"], "keyword": r["keyword"],
                    "collected_at": r["collected_at"]
                })

        self.write({
            "code": 0,
            "data": {
                "user_count": user_count,
                "model_count": model_count,
                "source_count": source_count,
                "record_count": record_count,
                "api_token_count": api_token_count,
                "recent_users": recent_users,
                "recent_records": recent_records,
            }
        })


# ====== 接口管理 ======

class ApiTokenListHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        self.render("admin_api_list.html", title="接口管理",
                     username=_get_username(self))


class ApiTokenListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        limit = int(self.get_argument("limit", "15"))
        tokens, total = ApiTokenRepository.list_page(page, limit)
        data = []
        for t in tokens:
            data.append({
                "id": t["id"],
                "name": t["name"],
                "api_key": t["api_key"],
                "status": t["status"],
                "call_count": t["call_count"],
                "create_at": t["create_at"],
            })
        self.write({"code": 0, "msg": "", "count": total, "data": data})


# ====== 技能管理 ======

class SkillListHandler(BaseHandler):
    """技能管理主页"""
    @tornado.web.authenticated
    def get(self):
        self.render("admin_skill_list.html", title="技能管理",
                     username=_get_username(self))


class SkillListApiHandler(BaseHandler):
    """技能列表 API（分页）"""
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        limit = int(self.get_argument("limit", "10"))
        keyword = self.get_argument("keyword", "").strip()
        skills, total = SkillRepository.list(page, limit, keyword)
        data = []
        for s in skills:
            data.append({
                "id": s["id"],
                "name": s["name"],
                "description": s["description"],
                "create_at": s["create_at"]
            })
        self.write({"code": 0, "msg": "", "count": total, "data": data})


class SkillAllApiHandler(BaseHandler):
    """获取所有技能（供下拉选择使用）"""
    @tornado.web.authenticated
    def get(self):
        skills = SkillRepository.get_all()
        data = [{"id": s["id"], "name": s["name"]} for s in skills]
        self.write({"code": 0, "data": data})


class SkillCreateHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        name = self.get_body_argument("name", "").strip()
        description = self.get_body_argument("description", "").strip()
        if not name:
            self.write({"code": 1, "msg": "技能名称不能为空"})
            return
        ok = SkillRepository.create(name, description)
        self.write({"code": 0 if ok else 1, "msg": "创建成功" if ok else "创建失败"})


class SkillEditHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        skill_id = int(self.get_body_argument("id", "0"))
        name = self.get_body_argument("name", "").strip()
        description = self.get_body_argument("description", "").strip()
        if not name:
            self.write({"code": 1, "msg": "技能名称不能为空"})
            return
        ok = SkillRepository.update(skill_id, name, description)
        self.write({"code": 0 if ok else 1, "msg": "更新成功" if ok else "更新失败"})


class SkillDeleteHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        skill_id = int(self.get_body_argument("id", "0"))
        ok, msg = SkillRepository.delete(skill_id)
        self.write({"code": 0 if ok else 1, "msg": msg})


# ====== 数字员工管理 ======

class DigitalEmployeeListHandler(BaseHandler):
    """数字员工管理主页"""
    @tornado.web.authenticated
    def get(self):
        self.render("admin_digital_employee_list.html", title="数字员工管理",
                     username=_get_username(self))


class DigitalEmployeeListApiHandler(BaseHandler):
    """数字员工列表 API（分页）"""
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        limit = int(self.get_argument("limit", "10"))
        keyword = self.get_argument("keyword", "").strip()
        employees, total = DigitalEmployeeRepository.list(page, limit, keyword)
        data = []
        for e in employees:
            data.append({
                "id": e["id"],
                "name": e["name"],
                "avatar_url": e["avatar_url"],
                "welcome_message": e["welcome_message"],
                "system_prompt": e["system_prompt"],
                "status": e["status"],
                "skill_names": e["skill_names"],
                "create_at": e["create_at"]
            })
        self.write({"code": 0, "msg": "", "count": total, "data": data})


class ApiTokenCreateHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        name = self.get_body_argument("name", "").strip()
        if not name:
            self.write({"code": 1, "msg": "名称不能为空"})
            return
        ok, api_key = ApiTokenRepository.create(name)
        if ok:
            self.write({"code": 0, "msg": "创建成功", "api_key": api_key})
        else:
            self.write({"code": 1, "msg": "创建失败"})


class ApiTokenDeleteHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        tid = int(self.get_body_argument("id", "0"))
        ok = ApiTokenRepository.delete(tid)
        self.write({"code": 0 if ok else 1, "msg": "删除成功" if ok else "删除失败"})


# ====== 数智大屏 ======

class BigScreenHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        self.render("admin_big_screen.html", title="数智大屏",
                     username=_get_username(self))


class BigScreenApiHandler(BaseHandler):
    """数智大屏统计数据"""
    @tornado.web.authenticated
    def get(self):
        from app.models.db import get_connection
        with get_connection() as conn:
            user_count = conn.execute("SELECT COUNT(*) AS cnt FROM users").fetchone()["cnt"]
            model_count = conn.execute("SELECT COUNT(*) AS cnt FROM models").fetchone()["cnt"]
            record_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_records").fetchone()["cnt"]
            source_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_sources").fetchone()["cnt"]

            # 各采集源数据量
            source_stats = []
            for r in conn.execute(
                "SELECT s.name, COUNT(lr.id) AS cnt "
                "FROM lookout_sources s LEFT JOIN lookout_records lr ON lr.source_id = s.id "
                "GROUP BY s.id ORDER BY cnt DESC"
            ).fetchall():
                source_stats.append({"name": r["name"], "value": r["cnt"]})

            # 近7天采集趋势
            trend = []
            for r in conn.execute(
                "SELECT date(collected_at) AS d, COUNT(*) AS cnt "
                "FROM lookout_records WHERE collected_at >= datetime('now', '-7 days') "
                "GROUP BY d ORDER BY d"
            ).fetchall():
                trend.append({"date": r["d"], "count": r["cnt"]})

            # 模型 Token 使用排行
            model_stats = []
            for r in conn.execute(
                "SELECT name, total_tokens, total_calls FROM models ORDER BY total_tokens DESC"
            ).fetchall():
                model_stats.append({
                    "name": r["name"],
                    "tokens": r["total_tokens"],
                    "calls": r["total_calls"]
                })

        self.write({
            "code": 0,
            "data": {
                "user_count": user_count,
                "model_count": model_count,
                "record_count": record_count,
                "source_count": source_count,
                "source_stats": source_stats,
                "trend": trend,
                "model_stats": model_stats,
            }
        })
class DigitalEmployeeCreateHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        name = self.get_body_argument("name", "").strip()
        avatar_url = self.get_body_argument("avatar_url", "").strip()
        welcome_message = self.get_body_argument("welcome_message", "").strip()
        system_prompt = self.get_body_argument("system_prompt", "").strip()
        skill_ids_str = self.get_body_argument("skill_ids", "")
        skill_ids = [int(x) for x in skill_ids_str.split(",") if x.strip()] if skill_ids_str else []
        if not name:
            self.write({"code": 1, "msg": "数字员工名称不能为空"})
            return
        ok = DigitalEmployeeRepository.create(name, avatar_url, welcome_message, system_prompt, skill_ids)
        self.write({"code": 0 if ok else 1, "msg": "创建成功" if ok else "名称已存在或创建失败"})


class DigitalEmployeeEditHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        employee_id = int(self.get_body_argument("id", "0"))
        name = self.get_body_argument("name", "").strip()
        avatar_url = self.get_body_argument("avatar_url", "").strip()
        welcome_message = self.get_body_argument("welcome_message", "").strip()
        system_prompt = self.get_body_argument("system_prompt", "").strip()
        skill_ids_str = self.get_body_argument("skill_ids", "")
        skill_ids = [int(x) for x in skill_ids_str.split(",") if x.strip()] if skill_ids_str else []
        if not name:
            self.write({"code": 1, "msg": "数字员工名称不能为空"})
            return
        ok = DigitalEmployeeRepository.update(employee_id, name, avatar_url, welcome_message, system_prompt, skill_ids)
        self.write({"code": 0 if ok else 1, "msg": "更新成功" if ok else "更新失败"})


class DigitalEmployeeDeleteHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        employee_id = int(self.get_body_argument("id", "0"))
        ok = DigitalEmployeeRepository.delete(employee_id)
        self.write({"code": 0 if ok else 1, "msg": "删除成功" if ok else "删除失败"})


class DigitalEmployeeToggleStatusHandler(BaseHandler):
    """切换启用/禁用状态"""
    @tornado.web.authenticated
    def post(self):
        employee_id = int(self.get_body_argument("id", "0"))
        ok = DigitalEmployeeRepository.toggle_status(employee_id)
        if ok:
            status = DigitalEmployeeRepository.get_status(employee_id)
            self.write({"code": 0, "msg": "状态已更新", "data": {"status": status}})
        else:
            self.write({"code": 1, "msg": "操作失败"})


class DigitalEmployeeGetByIdApiHandler(BaseHandler):
    """获取单个数字员工详情（供编辑使用）"""
    @tornado.web.authenticated
    def get(self):
        employee_id = int(self.get_argument("id", "0"))
        employee = DigitalEmployeeRepository.get_by_id(employee_id)
        if employee:
            self.write({"code": 0, "data": employee})
        else:
            self.write({"code": 1, "msg": "数字员工不存在"})


class DigitalEmployeeByNameApiHandler(BaseHandler):
    """根据名称获取数字员工（供用户侧 @ 调用）"""
    def get(self):
        name = self.get_argument("name", "").strip()
        if not name:
            self.write({"code": 1, "msg": "请提供数字员工名称"})
            return
        employee = DigitalEmployeeRepository.get_by_name(name)
        if employee:
            self.write({"code": 0, "data": employee})
        else:
            self.write({"code": 1, "msg": "数字员工不存在或已禁用"})


# ====== 会话管理 ======

class SessionListHandler(BaseHandler):
    """会话管理主页"""
    @tornado.web.authenticated
    def get(self):
        self.render("admin_session_list.html", title="会话管理",
                     username=_get_username(self))


class SessionListApiHandler(BaseHandler):
    """会话列表 API（分页）"""
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        limit = int(self.get_argument("limit", "10"))
        keyword = self.get_argument("keyword", "").strip()
        date_from = self.get_argument("date_from", "").strip()
        date_to = self.get_argument("date_to", "").strip()
        
        sessions, total = SessionRepository.list(
            page, limit, keyword, date_from, date_to
        )
        data = []
        for s in sessions:
            data.append({
                "id": s["id"],
                "user_id": s["user_id"],
                "username": s["username"],
                "title": s["title"],
                "message_count": s["message_count"],
                "start_time": s["start_time"],
                "end_time": s["end_time"] or "-",
                "created_at": s["created_at"]
            })
        self.write({"code": 0, "msg": "", "count": total, "data": data})


class SessionMessagesApiHandler(BaseHandler):
    """获取会话的详细消息记录"""
    @tornado.web.authenticated
    def get(self):
        conversation_id = int(self.get_argument("id", "0"))
        conv = SessionRepository.get_by_id(conversation_id)
        if not conv:
            self.write({"code": 1, "msg": "会话不存在"})
            return
        messages = SessionRepository.get_messages(conversation_id)
        data = {
            "conversation": conv,
            "messages": [dict(m) for m in messages]
        }
        self.write({"code": 0, "data": data})


class SessionDeleteHandler(BaseHandler):
    """删除会话"""
    @tornado.web.authenticated
    def post(self):
        conversation_id = int(self.get_body_argument("id", "0"))
        ok, msg = SessionRepository.delete(conversation_id)
        self.write({"code": 0 if ok else 1, "msg": msg})


# ====== 系统设置 ======

class SystemSettingHandler(BaseHandler):
    """系统设置页面"""
    def get(self):
        settings = SystemSettingsRepository.get_all()
        # 获取模型列表
        from app.models.db import get_connection
        models = []
        try:
            conn = get_connection()
            models = conn.execute("SELECT id, name FROM models ORDER BY id").fetchall()
            conn.close()
        except Exception:
            pass
        self.render("admin_system_setting.html", title="系统设置",
                     settings=settings, models=models)


class SystemSettingApiHandler(BaseHandler):
    """系统设置 API"""

    def get(self):
        settings = SystemSettingsRepository.get_all()
        result = {}
        for row in settings:
            result[row["key"]] = row["value"]
        self.write({"code": 0, "data": result, "msg": "ok"})

    def post(self):
        theme_color = self.get_argument("theme_color", "")
        site_name = self.get_argument("site_name", "")
        default_model_id = self.get_argument("default_model_id", "")
        model_timeout = self.get_argument("model_timeout", "")
        model_max_tokens = self.get_argument("model_max_tokens", "")
        model_temperature = self.get_argument("model_temperature", "")
        retain_days = self.get_argument("retain_days", "")
        max_records_per_collect = self.get_argument("max_records_per_collect", "")
        collect_interval = self.get_argument("collect_interval", "")
        auto_cleanup = self.get_argument("auto_cleanup", "")
        cleanup_conversation_days = self.get_argument("cleanup_conversation_days", "")
        cleanup_session_days = self.get_argument("cleanup_session_days", "")
        cleanup_log_days = self.get_argument("cleanup_log_days", "")
        footer_text = self.get_argument("footer_text", "")
        settings = {}
        if theme_color:
            settings["theme_color"] = theme_color
        if site_name:
            settings["site_name"] = site_name
        if default_model_id:
            settings["default_model_id"] = default_model_id
        if model_timeout:
            settings["model_timeout"] = model_timeout
        if model_max_tokens:
            settings["model_max_tokens"] = model_max_tokens
        if model_temperature:
            settings["model_temperature"] = model_temperature
        if retain_days:
            settings["retain_days"] = retain_days
        if max_records_per_collect:
            settings["max_records_per_collect"] = max_records_per_collect
        if collect_interval:
            settings["collect_interval"] = collect_interval
        if auto_cleanup:
            settings["auto_cleanup"] = auto_cleanup
        if cleanup_conversation_days:
            settings["cleanup_conversation_days"] = cleanup_conversation_days
        if cleanup_session_days:
            settings["cleanup_session_days"] = cleanup_session_days
        if cleanup_log_days:
            settings["cleanup_log_days"] = cleanup_log_days
        if footer_text:
            settings["footer_text"] = footer_text
        SystemSettingsRepository.set_multi(settings)
        self.write({"code": 0, "msg": "保存成功"})


class SystemSettingLogoUploadHandler(BaseHandler):
    """站点 Logo 上传"""
    def post(self):
        import os
        upload_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "app", "static", "uploads"
        )
        os.makedirs(upload_dir, exist_ok=True)
        file = self.request.files.get("file")
        if not file:
            self.write({"code": 1, "msg": "未选择文件"})
            return
        f = file[0]
        import uuid
        ext = os.path.splitext(f["filename"])[1] or ".png"
        filename = f"logo_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(upload_dir, filename)
        with open(filepath, "wb") as wf:
            wf.write(f["body"])
        logo_url = f"/static/uploads/{filename}"
        SystemSettingsRepository.set("site_logo", logo_url)
        self.write({"code": 0, "data": {"url": logo_url}, "msg": "上传成功"})


class SystemSettingLogApiHandler(BaseHandler):
    """日志查看 API"""
    def get(self):
        import os
        level = self.get_argument("level", "").upper()
        keyword = self.get_argument("keyword", "")
        log_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "logs", "app.log"
        )
        lines = []
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    if level and f"[{level}]" not in line:
                        continue
                    if keyword and keyword not in line:
                        continue
                    lines.append(line)
        lines.reverse()
        lines = lines[:500]
        self.write({"code": 0, "data": lines, "msg": "ok"})


class SystemSettingLogClearHandler(BaseHandler):
    """清空日志"""
    def post(self):
        import os
        log_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "logs", "app.log"
        )
        if os.path.exists(log_file):
            open(log_file, "w", encoding="utf-8").close()
        self.write({"code": 0, "msg": "日志已清空"})


class AdminQAHandler(BaseHandler):
    """管理后台 - 智能问数（iframe内嵌）"""
    @tornado.web.authenticated
    def get(self):
        self.render("user_chat.html", title="智能问数", username=self.current_user)


# ====== 词云 ======

# 中文停用词表
_STOP_WORDS = set([
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一",
    "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着",
    "没有", "看", "好", "自己", "这", "他", "她", "它", "们", "那", "些",
    "所", "为", "所以", "因为", "但是", "然而", "而且", "或者", "如果",
    "虽然", "可以", "这个", "那个", "哪", "什么", "怎么", "如何", "为什么",
    "还", "被", "把", "让", "给", "从", "以", "对", "向", "与", "及",
    "等", "其", "之", "将", "已", "吧", "吗", "呢", "啊", "哦", "嗯",
    "哈", "呀", "么", "啦", "哇", "哎", "唉", "嗯嗯", "呵呵", "哈哈",
    "记者", "报道", "新闻", "等", "来", "中", "大", "时", "为", "能",
    "更", "用", "做", "想", "成", "后", "前", "多", "只", "又", "再",
    "吗", "嘛", "罢", "呗", "咚", "呀", "哟", "兮", "呃", "咳", "哗",
    "目前", "进行", "通过", "根据", "相关", "表示", "认为", "已经",
    "主要", "其中", "以及", "包括", "对于", "关于", "经过", "由于",
    "随着", "为了", "除了", "不同", "比较", "非常", "特别", "真的",
])

_STOP_WORDS_EXTRA = set([
    "nbsp", "quot", "amp", "gt", "lt", "mdash", "ndash", "ldquo", "rdquo",
    "lsquo", "rsquo", "hellip", "middot", "times", "divide", "plusmn",
])


class WordCloudApiHandler(BaseHandler):
    """词云数据 API"""
    @tornado.web.authenticated
    def get(self):
        source = self.get_argument("source", "all")
        date_from = self.get_argument("date_from", "")
        date_to = self.get_argument("date_to", "")
        limit = int(self.get_argument("limit", "100"))

        texts = []
        conditions = []
        params = []

        if date_from:
            conditions.append("created_at >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("created_at <= ?")
            params.append(date_to + " 23:59:59")

        where = (" AND ".join(conditions)) if conditions else "1=1"

        from app.models.db import get_connection

        # 瞭望数据：标题 + 摘要
        if source in ("lookout", "all"):
            l_conds = []
            l_params = []
            if date_from:
                l_conds.append("collected_at >= ?")
                l_params.append(date_from)
            if date_to:
                l_conds.append("collected_at <= ?")
                l_params.append(date_to + " 23:59:59")
            l_where = (" AND ".join(l_conds)) if l_conds else "1=1"

            with get_connection() as conn:
                rows = conn.execute(
                    f"SELECT title, summary FROM lookout_records WHERE {l_where}",
                    l_params
                ).fetchall()
                for r in rows:
                    t = (r["title"] or "") + " " + (r["summary"] or "")
                    texts.append(t)

        # 对话数据：提问 + 回答
        if source in ("chat", "all"):
            c_conds = []
            c_params = []
            if date_from:
                c_conds.append("created_at >= ?")
                c_params.append(date_from)
            if date_to:
                c_conds.append("created_at <= ?")
                c_params.append(date_to + " 23:59:59")
            c_where = (" AND ".join(c_conds)) if c_conds else "1=1"

            with get_connection() as conn:
                rows = conn.execute(
                    f"SELECT question, answer FROM conversations WHERE {c_where}",
                    c_params
                ).fetchall()
                for r in rows:
                    t = (r["question"] or "") + " " + (r["answer"] or "")
                    texts.append(t)

        if not texts:
            self.write({"code": 0, "data": []})
            return

        # jieba 分词 + 词频统计
        try:
            import jieba
        except ImportError:
            self.write({"code": 1, "msg": "jieba 未安装"})
            return

        all_text = " ".join(texts)
        words = jieba.cut(all_text)
        word_count = {}
        for w in words:
            w = w.strip().lower()
            # 过滤：长度<2、纯数字、纯标点、停用词
            if len(w) < 2:
                continue
            if w.isdigit():
                continue
            if w in _STOP_WORDS or w in _STOP_WORDS_EXTRA:
                continue
            word_count[w] = word_count.get(w, 0) + 1

        # 排序取 Top N
        sorted_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)[:limit]
        data = [{"name": w, "value": c} for w, c in sorted_words]

        self.write({"code": 0, "data": data})
