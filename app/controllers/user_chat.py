"""用户侧智能问数 Handler"""
import os
from datetime import datetime
from urllib.parse import quote

import tornado.web
from fpdf import FPDF

from app.controllers.base import BaseHandler
from app.models.conversation import ConversationRepository, SessionRepository
from app.models.digital_employee import DigitalEmployeeRepository
from app.models.model import ModelRepository

QUERY_SYSTEM_PROMPT = (
    "你是 XHAgentOS 智能问数助手，擅长根据用户问题分析数据需求、"
    "给出查询思路与结构化回答。回答应简洁清晰，必要时使用列表或表格形式。"
)


class ChatHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        self.render("user_chat.html", title="智能问数", username=self.current_user)


class ChatApiHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        action = self.get_argument("action", "")
        user_id = self.get_user_id()
        if not user_id:
            return self.json_fail("用户不存在")

        if action == "list":
            convs = SessionRepository.list_by_user(user_id)
            for c in convs:
                c["create_at"] = c.get("start_time") or c.get("created_at", "")
            return self.json_ok(data=convs)

        if action == "load":
            sid = self.get_int_argument("id")
            sess = SessionRepository.get_for_user(sid, user_id)
            if not sess:
                return self.json_fail("会话不存在")
            messages = SessionRepository.get_messages(sid)
            return self.json_ok(data={
                "conversation": sess,
                "messages": [dict(m) for m in messages],
            })

        if action == "employees":
            return self.json_ok(data=DigitalEmployeeRepository.get_enabled())

        if action == "models":
            models = ModelRepository.list_all()
            model_list = [{"id": m["id"], "name": m["name"], "is_default": m["is_default"]} for m in models]
            return self.json_ok(data=model_list)

        return self.json_fail("未知操作")

    @tornado.web.authenticated
    def post(self):
        body = self.get_json()
        action = body.get("action", "")
        user_id = self.get_user_id()
        if not user_id:
            return self.json_fail("用户不存在")

        if action == "create":
            mode = body.get("mode", "chat")
            employee_id = body.get("employee_id")
            sid = SessionRepository.create_for_user(
                user_id, mode=mode, employee_id=employee_id
            )
            return self.json_ok(data={"id": sid})

        if action == "delete":
            sid = body.get("id")
            if SessionRepository.delete_for_user(int(sid), user_id):
                return self.json_ok(msg="删除成功")
            return self.json_fail("删除失败")

        if action == "send":
            return self._handle_send(body, user_id)

        if action == "set_employee":
            sid = body.get("session_id")
            employee_id = body.get("employee_id")
            sess = SessionRepository.get_for_user(int(sid), user_id)
            if not sess:
                return self.json_fail("会话不存在")
            SessionRepository.set_employee(int(sid), employee_id)
            return self.json_ok()

        return self.json_fail("未知操作")

    def _build_system_prompt(self, mode, employee_id):
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

    def _handle_send(self, body, user_id):
        content = (body.get("content") or "").strip()
        if not content:
            return self.json_fail("消息不能为空")

        sid = body.get("session_id")
        mode = body.get("mode", "chat")
        employee_id = body.get("employee_id")
        model_id = body.get("model_id")

        if not sid:
            sid = SessionRepository.create_for_user(
                user_id, title=content[:30], mode=mode, employee_id=employee_id
            )
        else:
            sid = int(sid)
            sess = SessionRepository.get_for_user(sid, user_id)
            if not sess:
                return self.json_fail("会话不存在")

        SessionRepository.add_message(sid, "user", content)

        messages_for_api = []
        system_prompt = self._build_system_prompt(mode, employee_id)
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
            return self.json_fail("未配置默认模型，请联系管理员")

        try:
            from openai import OpenAI
            client = OpenAI(api_key=model["api_key"], base_url=model["base_url"])
            response = client.chat.completions.create(
                model=model["model_name"],
                messages=messages_for_api,
            )
            reply = response.choices[0].message.content or ""
            if hasattr(response, "usage") and response.usage:
                tokens = (
                    (response.usage.prompt_tokens or 0)
                    + (response.usage.completion_tokens or 0)
                )
                ModelRepository.record_usage(model["id"], tokens)
        except Exception as e:
            return self.json_fail(f"模型调用失败: {e}")

        SessionRepository.add_message(sid, "assistant", reply)

        sess = SessionRepository.get_for_user(sid, user_id)
        if sess and sess.get("title") in (None, "", "新会话"):
            SessionRepository.update_title(sid, content[:30])

        ConversationRepository.insert(
            user_id,
            self.current_user,
            content,
            reply,
            model["name"] if "name" in model.keys() else "",
        )

        return self.json_ok(data={"session_id": sid, "reply": reply})


class ChatExportHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        sid = self.get_int_argument("id")
        user_id = self.get_user_id()
        sess = SessionRepository.get_for_user(sid, user_id)
        if not sess:
            self.set_status(404)
            self.write("会话不存在")
            return

        messages = SessionRepository.get_messages(sid)
        pdf_bytes = self._build_pdf(sess, messages)
        filename = f"对话记录_{sid}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        ascii_name = f"chat_{sid}.pdf"
        self.set_header("Content-Type", "application/pdf")
        self.set_header(
            "Content-Disposition",
            f'attachment; filename="{ascii_name}"; filename*=UTF-8\'\'{quote(filename)}',
        )
        self.write(pdf_bytes)

    def _find_font(self):
        win_font = os.path.join(
            os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "simhei.ttf"
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

    def _build_pdf(self, conv, messages):
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        font_path = self._find_font()
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
            ts = msg["created_at"] if "created_at" in msg.keys() else ""
            pdf.set_font(font_name, size=10)
            pdf.multi_cell(pdf.epw, 7, text=f"[{role}] {ts}")
            pdf.set_font_size(11)
            pdf.multi_cell(pdf.epw, 7, text=msg["content"])
            pdf.ln(3)

        return bytes(pdf.output())
