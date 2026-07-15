import tornado.web
from app.controllers.base import BaseHandler
from app.utils.response import success, error, paginated
from app.models.skill import SkillRepository


class SkillListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        page_size = int(self.get_argument("pageSize", "10"))
        keyword = self.get_argument("keyword", "").strip()
        skills, total = SkillRepository.list(page, page_size, keyword)
        items = [{"id": s["id"], "name": s["name"], "description": s["description"], "createAt": s["create_at"]} for s in skills]
        self.write(paginated(items, total, page, page_size))


class SkillAllApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        skills = SkillRepository.get_all()
        items = [{"id": s["id"], "name": s["name"]} for s in skills]
        self.write(success(items))


class SkillCreateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        name = body.get("name", "").strip()
        description = body.get("description", "").strip()
        if not name:
            self.write(error(400, "技能名称不能为空"))
            return
        ok = SkillRepository.create(name, description)
        self.write(success(None, "创建成功") if ok else error(400, "创建失败"))


class SkillUpdateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def put(self, skill_id):
        body = self.get_json()
        name = body.get("name", "").strip()
        description = body.get("description", "").strip()
        if not name:
            self.write(error(400, "技能名称不能为空"))
            return
        ok = SkillRepository.update(int(skill_id), name, description)
        self.write(success(None, "更新成功") if ok else error(400, "更新失败"))


class SkillDeleteApiHandler(BaseHandler):
    @tornado.web.authenticated
    def delete(self, skill_id):
        ok, msg = SkillRepository.delete(int(skill_id))
        self.write(success(None, msg) if ok else error(400, msg))
