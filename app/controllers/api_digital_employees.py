import tornado.web
from app.controllers.base import BaseHandler
from app.utils.response import success, error, paginated
from app.models.digital_employee import DigitalEmployeeRepository


class DigitalEmployeeListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        page_size = int(self.get_argument("pageSize", "10"))
        keyword = self.get_argument("keyword", "").strip()
        employees, total = DigitalEmployeeRepository.list(page, page_size, keyword)
        items = []
        for e in employees:
            items.append({
                "id": e["id"], "name": e["name"],
                "avatarUrl": e["avatar_url"],
                "welcomeMessage": e["welcome_message"],
                "systemPrompt": e["system_prompt"],
                "status": e["status"],
                "skillNames": e["skill_names"],
                "createAt": e["create_at"],
            })
        self.write(paginated(items, total, page, page_size))


class DigitalEmployeeCreateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        name = body.get("name", "").strip()
        if not name:
            self.write(error(400, "数字员工名称不能为空"))
            return
        ok = DigitalEmployeeRepository.create(
            name, body.get("avatarUrl", ""), body.get("welcomeMessage", ""),
            body.get("systemPrompt", ""), body.get("skillIds", [])
        )
        self.write(success(None, "创建成功") if ok else error(400, "名称已存在或创建失败"))


class DigitalEmployeeUpdateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def put(self, employee_id):
        body = self.get_json()
        name = body.get("name", "").strip()
        if not name:
            self.write(error(400, "数字员工名称不能为空"))
            return
        ok = DigitalEmployeeRepository.update(
            int(employee_id), name, body.get("avatarUrl", ""),
            body.get("welcomeMessage", ""), body.get("systemPrompt", ""),
            body.get("skillIds", [])
        )
        self.write(success(None, "更新成功") if ok else error(400, "更新失败"))


class DigitalEmployeeDeleteApiHandler(BaseHandler):
    @tornado.web.authenticated
    def delete(self, employee_id):
        ok = DigitalEmployeeRepository.delete(int(employee_id))
        self.write(success(None, "删除成功") if ok else error(400, "删除失败"))


class DigitalEmployeeGetApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self, employee_id):
        employee = DigitalEmployeeRepository.get_by_id(int(employee_id))
        if employee:
            self.write(success(employee))
        else:
            self.write(error(404, "数字员工不存在"))
