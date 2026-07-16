"""
模型引擎 Blueprint

替代 Tornado api_models.py：
- GET /models              模型列表
- POST /models/create      创建模型
- PUT /models/<id>         更新模型
- DELETE /models/<id>/delete  删除模型
- POST /models/<id>/default   设为默认
- POST /models/test        模型测试对话
- GET /models/<id>/usage   月度用量趋势
"""
from flask import Blueprint, request, jsonify
from app.utils.response import success, error, paginated
from app.services.model_service import ModelService
from app.models.model import ModelRepository
from app.auth_helper import login_required

models_bp = Blueprint("models", __name__)


@models_bp.route("", methods=["GET"])
@login_required
def list_models():
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("pageSize", "10"))
    models_list, total = ModelService.get_model_list(page, page_size)
    items = []
    for m in models_list:
        items.append({
            "id": m["id"], "name": m["name"], "provider": m["provider"],
            "modelName": m["model_name"], "isDefault": bool(m["is_default"]),
            "status": m["status"], "totalTokens": m["total_tokens"],
            "totalCalls": m["total_calls"], "createAt": m["create_at"],
        })
    return jsonify(paginated(items, total, page, page_size))


@models_bp.route("/create", methods=["POST"])
@login_required
def create_model():
    body = request.get_json(silent=True) or {}
    ok, msg = ModelService.create_model(
        body.get("name", ""), body.get("apiKey", ""),
        body.get("baseUrl", "https://api.deepseek.com/v1"),
        body.get("modelName", ""), body.get("provider", "openai"),
    )
    if ok:
        return jsonify(success(None, msg))
    return jsonify(error(400, msg)), 400


@models_bp.route("/<int:model_id>", methods=["PUT"])
@login_required
def update_model(model_id):
    body = request.get_json(silent=True) or {}
    ok, msg = ModelService.update_model(
        model_id, body.get("name", ""), body.get("apiKey", ""),
        body.get("baseUrl", ""), body.get("modelName", ""),
        body.get("provider", "openai"),
    )
    if ok:
        return jsonify(success(None, msg))
    return jsonify(error(400, msg)), 400


@models_bp.route("/<int:model_id>/delete", methods=["DELETE"])
@login_required
def delete_model(model_id):
    ok, msg = ModelService.delete_model(model_id)
    if ok:
        return jsonify(success(None, msg))
    return jsonify(error(400, msg)), 400


@models_bp.route("/<int:model_id>/default", methods=["POST"])
@login_required
def set_default_model(model_id):
    ok, msg = ModelService.set_default(model_id)
    if ok:
        return jsonify(success(None, msg))
    return jsonify(error(400, msg)), 400


@models_bp.route("/test", methods=["POST"])
@login_required
def test_model():
    body = request.get_json(silent=True) or {}
    model_id = int(body.get("modelId", "0"))
    message = body.get("message", "").strip()
    if not message:
        return jsonify(error(400, "请输入消息")), 400

    model = ModelRepository.get_by_id(model_id)
    if not model:
        return jsonify(error(404, "模型不存在")), 404

    try:
        from openai import OpenAI
        client = OpenAI(api_key=model["api_key"], base_url=model["base_url"])
        response = client.chat.completions.create(
            model=model["model_name"],
            messages=[{"role": "user", "content": message}],
        )
        reply = response.choices[0].message.content
        if hasattr(response, "usage") and response.usage:
            tokens = (response.usage.prompt_tokens or 0) + (response.usage.completion_tokens or 0)
            ModelRepository.record_usage(model_id, tokens)
        return jsonify(success({"reply": reply}))
    except Exception as e:
        return jsonify(error(502, f"调用失败: {str(e)}")), 502


@models_bp.route("/<int:model_id>/usage", methods=["GET"])
@login_required
def model_usage(model_id):
    trend = ModelRepository.get_monthly_trend(model_id)
    return jsonify(success(trend))
