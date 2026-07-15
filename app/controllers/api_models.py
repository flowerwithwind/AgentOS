import tornado.web
from app.controllers.base import BaseHandler
from app.utils.response import success, error, paginated
from app.services.model_service import ModelService
from app.models.model import ModelRepository


class ModelListApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        page = int(self.get_argument("page", "1"))
        page_size = int(self.get_argument("pageSize", "10"))
        models, total = ModelService.get_model_list(page, page_size)
        items = []
        for m in models:
            items.append({
                "id": m["id"], "name": m["name"], "provider": m["provider"],
                "modelName": m["model_name"], "isDefault": bool(m["is_default"]),
                "status": m["status"], "totalTokens": m["total_tokens"],
                "totalCalls": m["total_calls"], "createAt": m["create_at"],
            })
        self.write(paginated(items, total, page, page_size))


class ModelCreateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        ok, msg = ModelService.create_model(
            body.get("name", ""), body.get("apiKey", ""),
            body.get("baseUrl", "https://api.deepseek.com/v1"),
            body.get("modelName", ""), body.get("provider", "openai")
        )
        if ok:
            self.write(success(None, msg))
        else:
            self.write(error(400, msg))


class ModelUpdateApiHandler(BaseHandler):
    @tornado.web.authenticated
    def put(self, model_id):
        body = self.get_json()
        ok, msg = ModelService.update_model(
            int(model_id), body.get("name", ""), body.get("apiKey", ""),
            body.get("baseUrl", ""), body.get("modelName", ""), body.get("provider", "openai")
        )
        if ok:
            self.write(success(None, msg))
        else:
            self.write(error(400, msg))


class ModelDeleteApiHandler(BaseHandler):
    @tornado.web.authenticated
    def delete(self, model_id):
        ok, msg = ModelService.delete_model(int(model_id))
        if ok:
            self.write(success(None, msg))
        else:
            self.write(error(400, msg))


class ModelSetDefaultApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self, model_id):
        ok, msg = ModelService.set_default(int(model_id))
        if ok:
            self.write(success(None, msg))
        else:
            self.write(error(400, msg))


class ModelTestApiHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        model_id = int(body.get("modelId", "0"))
        message = body.get("message", "").strip()
        if not message:
            self.write(error(400, "请输入消息"))
            return
        model = ModelRepository.get_by_id(model_id)
        if not model:
            self.write(error(404, "模型不存在"))
            return
        try:
            from openai import OpenAI
            client = OpenAI(api_key=model["api_key"], base_url=model["base_url"])
            response = client.chat.completions.create(
                model=model["model_name"],
                messages=[{"role": "user", "content": message}]
            )
            reply = response.choices[0].message.content
            if hasattr(response, "usage") and response.usage:
                tokens = (response.usage.prompt_tokens or 0) + (response.usage.completion_tokens or 0)
                ModelRepository.record_usage(model_id, tokens)
            self.write(success({"reply": reply}))
        except Exception as e:
            self.write(error(502, f"调用失败: {str(e)}"))


class ModelUsageApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self, model_id):
        trend = ModelRepository.get_monthly_trend(int(model_id))
        self.write(success(trend))
