import tornado.web
from app.controllers.base import BaseHandler
from app.utils.response import success, error, paginated
from app.services.lookout_service import LookoutService
from app.models.lookout import LookoutSourceRepository, LookoutRecordRepository, DeepCollectTask


class SourceListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        page_size = int(self.get_argument("pageSize", "10"))
        sources, total = LookoutService.get_sources(page, page_size)
        items = []
        for s in sources:
            items.append({
                "id": s["id"], "name": s["name"],
                "urlTemplate": s["url_template"],
                "pnParam": s["pn_param"], "pageSize": s["page_size"],
                "keywordPlaceholder": s["keyword_placeholder"],
                "status": s["status"], "createAt": s["create_at"],
            })
        self.write(paginated(items, total, page, page_size))


class SourceCreateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        ok, msg = LookoutService.create_source(
            body.get("name", ""), body.get("urlTemplate", ""),
            body.get("pnParam", "pn"), int(body.get("pageSize", 10)),
            body.get("keywordPlaceholder", "{}")
        )
        self.write(success(None, msg) if ok else error(400, msg))


class SourceUpdateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def put(self, source_id):
        body = self.get_json()
        ok, msg = LookoutService.update_source(
            int(source_id), body.get("name", ""), body.get("urlTemplate", ""),
            body.get("pnParam", "pn"), int(body.get("pageSize", 10)),
            body.get("keywordPlaceholder", "{}")
        )
        self.write(success(None, msg) if ok else error(400, msg))


class SourceDeleteApiHandler(BaseHandler):
    @tornado.web.authenticated
    def delete(self, source_id):
        ok, msg = LookoutService.delete_source(int(source_id))
        self.write(success(None, msg) if ok else error(400, msg))


class CollectApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        ok, msg, results = LookoutService.collect(
            int(body.get("sourceId", 0)), body.get("keyword", ""),
            int(body.get("page", 0)), int(body.get("pageSize", 0))
        )
        if ok:
            self.write(success({"records": results}, msg))
        else:
            self.write(error(400, msg))


class WarehouseListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        page_size = int(self.get_argument("pageSize", "20"))
        source_id_str = self.get_argument("sourceId", "")
        keyword = self.get_argument("keyword", "")
        date_from = self.get_argument("dateFrom", "")
        date_to = self.get_argument("dateTo", "")
        sid = int(source_id_str) if source_id_str and source_id_str.isdigit() else None
        records, total = LookoutService.get_warehouse(
            page, page_size, source_id=sid,
            keyword=keyword, date_from=date_from, date_to=date_to
        )
        items = []
        for r in records:
            items.append({
                "id": r["id"], "sourceId": r["source_id"],
                "title": r["title"], "url": r["url"],
                "summary": r["summary"], "publishTime": r["publish_time"],
                "sourceName": r["source_name"], "keyword": r["keyword"],
                "collectedAt": r["collected_at"],
                "hasFullContent": bool(r.get("full_content", "")),
            })
        self.write(paginated(items, total, page, page_size))


class WarehouseDeleteApiHandler(BaseHandler):
    @tornado.web.authenticated
    def delete(self, record_id):
        ok = LookoutRecordRepository.delete(int(record_id))
        self.write(success(None, "删除成功") if ok else error(400, "删除失败"))


class DeepCollectApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        record_ids = body.get("recordIds", [])
        if not record_ids:
            self.write(error(400, "请选择要采集的数据记录"))
            return
        try:
            task_id = DeepCollectTask.start(record_ids)
            self.write(success({"taskId": task_id}, "采集任务已启动"))
        except Exception as e:
            self.write(error(500, f"启动采集失败: {str(e)}"))


class DeepCollectProgressApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        task_id = self.get_argument("taskId", "")
        if not task_id:
            self.write(error(400, "缺少 taskId"))
            return
        progress = DeepCollectTask.get_progress(task_id)
        self.write(success(progress))
