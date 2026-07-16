"""
智能问数 Blueprint

替代 Tornado user_chat.py：
- GET  /api?action=list|load|employees|models   会话列表/加载/数字员工/模型
- POST /api                                      发送消息/创建/删除会话
- GET  /export?id=xxx                            PDF 导出
"""
import os
from datetime import datetime
from urllib.parse import quote
from flask import Blueprint, request, jsonify, g, Response
from app.utils.response import success, error, paginated
from app.models.conversation import ConversationRepository, SessionRepository
from app.models.digital_employee import DigitalEmployeeRepository
from app.models.model import ModelRepository
from app.auth_helper import login_required, get_current_user_id

chat_bp = Blueprint("chat", __name__)

QUERY_SYSTEM_PROMPT = (
    "你是 XHAgentOS 智能问数助手，擅长根据用户问题分析数据需求、"
    "给出查询思路与结构化回答。回答应简洁清晰，必要时使用列表或表格形式。"
)


@chat_bp.route("/api", methods=["GET"])
@login_required
def chat_get():
    action = request.args.get("action", "")
    user_id = get_current_user_id()
    if not user_id:
        return jsonify(error(400, "用户不存在")), 400

    if action == "list":
        convs = SessionRepository.list_by_user(user_id)
        for c in convs:
            c["create_at"] = c.get("start_time") or c.get("created_at", "")
        return jsonify(success(convs))

    if action == "load":
        sid = int(request.args.get("id", "0"))
        sess = SessionRepository.get_for_user(sid, user_id)
        if not sess:
            return jsonify(error(400, "会话不存在")), 400
        messages = SessionRepository.get_messages(sid)
        return jsonify(success({
            "conversation": sess,
            "messages": [dict(m) for m in messages],
        }))

    if action == "employees":
        return jsonify(success(DigitalEmployeeRepository.get_enabled()))

    if action == "models":
        models = ModelRepository.list_all()
        model_list = [{"id": m["id"], "name": m["name"], "is_default": m["is_default"]} for m in models]
        return jsonify(success(model_list))

    return jsonify(error(400, "未知操作")), 400


@chat_bp.route("/api", methods=["POST"])
@login_required
def chat_post():
    body = request.get_json(silent=True) or {}
    action = body.get("action", "")
    user_id = get_current_user_id()
    if not user_id:
        return jsonify(error(400, "用户不存在")), 400

    if action == "create":
        mode = body.get("mode", "chat")
        employee_id = body.get("employee_id")
        sid = SessionRepository.create_for_user(user_id, mode=mode, employee_id=employee_id)
        return jsonify(success({"id": sid}))

    if action == "delete":
        sid = body.get("id")
        if SessionRepository.delete_for_user(int(sid), user_id):
            return jsonify(success(None, "删除成功"))
        return jsonify(error(400, "删除失败")), 400

    if action == "send":
        return _handle_send(body, user_id)

    if action == "set_employee":
        sid = body.get("session_id")
        employee_id = body.get("employee_id")
        sess = SessionRepository.get_for_user(int(sid), user_id)
        if not sess:
            return jsonify(error(400, "会话不存在")), 400
        SessionRepository.set_employee(int(sid), employee_id)
        return jsonify(success())

    return jsonify(error(400, "未知操作")), 400


def _build_system_prompt(mode, employee_id):
    parts = []
    if mode == "query":
        parts.append(QUERY_SYSTEM_PROMPT)
    if employee_id:
        emp = DigitalEmployeeRepository.get_by_id(int(employee_id))
        if emp:
            if emp.get("system_prompt"):
                parts.append(emp["system_prompt"])
            full = DigitalEmployeeRepository.get_by_name(emp["name"])
            if full and full.get("skill_descriptions"):
                parts.append(full["skill_descriptions"])
    if not parts:
        return None
    return "\n\n".join(parts)


def _handle_send(body, user_id):
    content = (body.get("content") or "").strip()
    if not content:
        return jsonify(error(400, "消息不能为空")), 400

    sid = body.get("session_id")
    mode = body.get("mode", "chat")
    employee_id = body.get("employee_id")
    model_id = body.get("model_id")

    if not sid:
        sid = SessionRepository.create_for_user(
            user_id, title=content[:30], mode=mode, employee_id=employee_id,
        )
    else:
        sid = int(sid)
        sess = SessionRepository.get_for_user(sid, user_id)
        if not sess:
            return jsonify(error(400, "会话不存在")), 400

    SessionRepository.add_message(sid, "user", content)

    messages_for_api = []
    system_prompt = _build_system_prompt(mode, employee_id)
    if system_prompt:
        messages_for_api.append({"role": "system", "content": system_prompt})

    for m in SessionRepository.get_messages(sid):
        if m["role"] in ("user", "assistant"):
            messages_for_api.append({
                "role": m["role"],
                "content": m["content"],
            })

    if model_id:
        model = ModelRepository.get_by_id(int(model_id))
    else:
        model = ModelRepository.get_default()
    if not model:
        return jsonify(error(400, "未配置默认模型，请联系管理员")), 400

    try:
        from openai import OpenAI
        client = OpenAI(api_key=model["api_key"], base_url=model["base_url"])
        response = client.chat.completions.create(
            model=model["model_name"],
            messages=messages_for_api,
        )
        reply = response.choices[0].message.content or ""
        if hasattr(response, "usage") and response.usage:
            tokens = (response.usage.prompt_tokens or 0) + (response.usage.completion_tokens or 0)
            ModelRepository.record_usage(model["id"], tokens)
    except Exception as e:
        return jsonify(error(502, f"模型调用失败: {e}")), 502

    SessionRepository.add_message(sid, "assistant", reply)

    sess = SessionRepository.get_for_user(sid, user_id)
    if sess and sess.get("title") in (None, "", "新会话"):
        SessionRepository.update_title(sid, content[:30])

    ConversationRepository.insert(
        user_id, g.username, content, reply,
        model["name"] if "name" in model.keys() else "",
    )

    return jsonify(success({"session_id": sid, "reply": reply}))


@chat_bp.route("/export", methods=["GET"])
@login_required
def chat_export():
    sid = int(request.args.get("id", "0"))
    user_id = get_current_user_id()
    sess = SessionRepository.get_for_user(sid, user_id)
    if not sess:
        return jsonify(error(404, "会话不存在")), 404

    messages = SessionRepository.get_messages(sid)
    pdf_bytes = _build_pdf(sess, messages)
    filename = f"对话记录_{sid}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    ascii_name = f"chat_{sid}.pdf"

    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{ascii_name}"; '
                f"filename*=UTF-8''{quote(filename)}"
            ),
        },
    )


def _find_font():
    win_font = os.path.join(
        os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "simhei.ttf",
    )
    if os.path.isfile(win_font):
        return win_font
    for path in (
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/System/Library/Fonts/PingFang.ttc",
    ):
        if os.path.isfile(path) and path.endswith(".ttf"):
            return path
    return None


def _build_pdf(conv, messages):
    from fpdf import FPDF

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    font_path = _find_font()
    font_name = "Helvetica"
    if font_path:
        pdf.add_font("CJK", "", font_path)
        font_name = "CJK"

    pdf.set_font(font_name, size=12)
    title = conv.get("title") or "对话记录"
    pdf.multi_cell(pdf.epw, 10, text=title)
    pdf.set_font_size(10)
    pdf.multi_cell(
        pdf.epw, 8,
        text=f"导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    )
    pdf.ln(5)

    role_map = {"user": "用户", "assistant": "AI助手", "system": "系统"}
    for msg in messages:
        role = role_map.get(msg["role"], msg["role"])
        ts = msg.get("created_at", "")
        pdf.set_font(font_name, size=10)
        pdf.multi_cell(pdf.epw, 7, text=f"[{role}] {ts}")
        pdf.set_font_size(11)
        pdf.multi_cell(pdf.epw, 7, text=msg["content"])
        pdf.ln(3)

    return bytes(pdf.output())
