import tornado.web
import json
from app.controllers.base import BaseHandler
from app.utils.response import success, error, paginated
from app.models.user import UserRepository
from app.models.role import FunctionRepository, RoleRepository
from app.models.api_token import ApiTokenRepository
from app.models.conversation import ConversationRepository, SessionRepository
from app.models.system_settings import SystemSettingsRepository


# ====== Users ======
class UserListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        page_size = int(self.get_argument("pageSize", "20"))
        users, total = UserRepository.list_users(page, page_size)
        items = [{"id": u["id"], "username": u["username"], "roleId": u["role_id"],
                  "roleName": u["role_name"] or "普通用户", "createAt": u["create_at"]} for u in users]
        self.write(paginated(items, total, page, page_size))


class UserCreateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        username = body.get("username", "").strip()
        password = body.get("password", "")
        role_id = int(body.get("roleId", 2))
        if not username or not password:
            self.write(error(400, "用户名和密码不能为空"))
            return
        ok = UserRepository.create_user(username, password, role_id)
        self.write(success(None, "创建成功") if ok else error(409, "用户名已存在"))


class UserUpdateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def put(self, user_id):
        body = self.get_json()
        username = body.get("username", "").strip()
        password = body.get("password", "").strip()
        role_id = int(body.get("roleId", 2))
        if not username:
            self.write(error(400, "用户名不能为空"))
            return
        ok = UserRepository.update_user(int(user_id), username, password or None)
        if ok:
            UserRepository.update_user_role(int(user_id), role_id)
            self.write(success(None, "更新成功"))
        else:
            self.write(error(400, "更新失败"))


class UserDeleteApiHandler(BaseHandler):
    @tornado.web.authenticated
    def delete(self, user_id):
        ok = UserRepository.delete_user(int(user_id))
        self.write(success(None, "删除成功") if ok else error(400, "删除失败"))


# ====== Roles ======
class RoleListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        roles = RoleRepository.list_all()
        items = [{"id": r["id"], "name": r["name"], "isSystem": r["is_system"],
                  "userCount": RoleRepository.get_user_count(r["id"])} for r in roles]
        self.write(success(items))


class RoleCreateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        name = body.get("name", "").strip()
        if not name:
            self.write(error(400, "角色名称不能为空"))
            return
        ok = RoleRepository.create(name)
        self.write(success(None, "创建成功") if ok else error(409, "角色名已存在"))


class RoleDeleteApiHandler(BaseHandler):
    @tornado.web.authenticated
    def delete(self, role_id):
        ok = RoleRepository.delete(int(role_id))
        self.write(success(None, "删除成功") if ok else error(400, "系统角色不可删除或不存在"))


# ====== Permissions ======
class PermissionRolesApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        roles = RoleRepository.list_all()
        items = [{"id": r["id"], "name": r["name"]} for r in roles]
        self.write(success(items))


class PermissionFunctionsApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        role_id = int(self.get_argument("roleId", "0"))
        funcs = FunctionRepository.list_all()
        granted = set(RoleRepository.get_permissions(role_id)) if role_id else set()
        func_map = {}
        tree = []
        for f in funcs:
            item = dict(id=f["id"], name=f["name"], parentId=f["parent_id"],
                        key=str(f["id"]), checked=f["id"] in granted)
            if "children" not in item:
                item["children"] = []
            func_map[f["id"]] = item
            if f["parent_id"] == 0:
                tree.append(item)
            elif f["parent_id"] in func_map:
                func_map[f["parent_id"]]["children"].append(item)
        self.write(success(tree))


class PermissionSaveApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        role_id = int(body.get("roleId", 0))
        function_ids = [int(x) for x in body.get("functionIds", [])]
        RoleRepository.set_permissions(role_id, function_ids)
        self.write(success(None, "保存成功"))


# ====== Conversations ======
class ConversationListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        page_size = int(self.get_argument("pageSize", "20"))
        username = self.get_argument("username", "")
        keyword = self.get_argument("keyword", "")
        date_from = self.get_argument("dateFrom", "")
        date_to = self.get_argument("dateTo", "")
        records, total = ConversationRepository.list_page(
            page, page_size, username=username, keyword=keyword,
            date_from=date_from, date_to=date_to
        )
        items = [dict(r) for r in records]
        self.write(paginated(items, total, page, page_size))


class ConversationExportApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        username = self.get_argument("username", "")
        keyword = self.get_argument("keyword", "")
        date_from = self.get_argument("dateFrom", "")
        date_to = self.get_argument("dateTo", "")
        csv_content = ConversationRepository.export_csv(
            username=username, keyword=keyword, date_from=date_from, date_to=date_to
        )
        self.set_header("Content-Type", "text/csv; charset=utf-8-sig")
        self.set_header("Content-Disposition", "attachment; filename=conversations.csv")
        self.write(csv_content)


# ====== Sessions ======
class SessionListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        page_size = int(self.get_argument("pageSize", "10"))
        keyword = self.get_argument("keyword", "").strip()
        date_from = self.get_argument("dateFrom", "").strip()
        date_to = self.get_argument("dateTo", "").strip()
        sessions, total = SessionRepository.list(page, page_size, keyword, date_from, date_to)
        items = []
        for s in sessions:
            items.append({
                "id": s["id"], "userId": s["user_id"], "username": s["username"],
                "title": s["title"], "messageCount": s["message_count"],
                "startTime": s["start_time"], "endTime": s.get("end_time", ""),
                "createdAt": s["created_at"],
            })
        self.write(paginated(items, total, page, page_size))


class SessionMessagesApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self, session_id):
        conv = SessionRepository.get_by_id(int(session_id))
        if not conv:
            self.write(error(404, "会话不存在"))
            return
        messages = SessionRepository.get_messages(int(session_id))
        self.write(success({"conversation": dict(conv), "messages": [dict(m) for m in messages]}))


class SessionDeleteApiHandler(BaseHandler):
    @tornado.web.authenticated
    def delete(self, session_id):
        ok, msg = SessionRepository.delete(int(session_id))
        self.write(success(None, msg) if ok else error(400, msg))


# ====== API Tokens ======
class ApiTokenListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        page_size = int(self.get_argument("pageSize", "15"))
        tokens, total = ApiTokenRepository.list_page(page, page_size)
        items = [{"id": t["id"], "name": t["name"], "apiKey": t["api_key"],
                  "status": t["status"], "callCount": t["call_count"],
                  "createAt": t["create_at"]} for t in tokens]
        self.write(paginated(items, total, page, page_size))


class ApiTokenCreateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        name = body.get("name", "").strip()
        if not name:
            self.write(error(400, "名称不能为空"))
            return
        ok, api_key = ApiTokenRepository.create(name)
        if ok:
            self.write(success({"apiKey": api_key}, "创建成功"))
        else:
            self.write(error(400, "创建失败"))


class ApiTokenDeleteApiHandler(BaseHandler):
    @tornado.web.authenticated
    def delete(self, token_id):
        ok = ApiTokenRepository.delete(int(token_id))
        self.write(success(None, "删除成功") if ok else error(400, "删除失败"))


# ====== Settings ======
class SettingGetApiHandler(BaseHandler):
    def get(self):
        settings = SystemSettingsRepository.get_all()
        self.write(success(settings))


class SettingUpdateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def put(self):
        body = self.get_json()
        SystemSettingsRepository.set_multi(body)
        self.write(success(None, "保存成功"))


class SettingLogoUploadApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        import os, uuid
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        upload_dir = os.path.join(base_dir, "app", "static", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file = self.request.files.get("file")
        if not file:
            self.write(error(400, "未选择文件"))
            return
        f = file[0]
        ext = os.path.splitext(f["filename"])[1] or ".png"
        filename = f"logo_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(upload_dir, filename)
        with open(filepath, "wb") as wf:
            wf.write(f["body"])
        logo_url = f"/static/uploads/{filename}"
        SystemSettingsRepository.set("site_logo", logo_url)
        self.write(success({"url": logo_url}, "上传成功"))


# ====== Big Screen ======
class BigScreenApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        from app.models.db import get_connection
        with get_connection() as conn:
            user_count = conn.execute("SELECT COUNT(*) AS cnt FROM users").fetchone()["cnt"]
            model_count = conn.execute("SELECT COUNT(*) AS cnt FROM models").fetchone()["cnt"]
            record_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_records").fetchone()["cnt"]
            source_count = conn.execute("SELECT COUNT(*) AS cnt FROM lookout_sources").fetchone()["cnt"]
            source_stats = [dict(r) for r in conn.execute(
                "SELECT s.name, COUNT(lr.id) AS value FROM lookout_sources s LEFT JOIN lookout_records lr ON lr.source_id = s.id GROUP BY s.id ORDER BY value DESC"
            ).fetchall()]
            trend = [dict(r) for r in conn.execute(
                "SELECT date(collected_at) AS date, COUNT(*) AS count FROM lookout_records WHERE collected_at >= datetime('now', '-7 days') GROUP BY date ORDER BY date"
            ).fetchall()]
            model_stats = [dict(r) for r in conn.execute(
                "SELECT name, total_tokens AS tokens, total_calls AS calls FROM models ORDER BY total_tokens DESC"
            ).fetchall()]
        self.write(success({
            "userCount": user_count, "modelCount": model_count,
            "recordCount": record_count, "sourceCount": source_count,
            "sourceStats": source_stats, "trend": trend, "modelStats": model_stats,
        }))
