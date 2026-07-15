"""
对话服务：AI 对话 SSE 流式响应
"""
import json
import logging
from openai import AsyncOpenAI
from app.models.model import ModelRepository
from app.models.conversation import ConversationRepository

logger = logging.getLogger(__name__)


async def chat_completion(model_id: int, messages: list) -> str:
    """异步调用 AI 模型（非流式，用于简单测试）"""
    model = ModelRepository.get_by_id(model_id)
    if not model:
        raise ValueError("模型不存在")

    client = AsyncOpenAI(api_key=model["api_key"], base_url=model["base_url"])
    response = await client.chat.completions.create(
        model=model["model_name"],
        messages=messages,
        stream=False,
    )
    reply = response.choices[0].message.content or ""
    # 记录 token 用量
    if hasattr(response, "usage") and response.usage:
        tokens = (response.usage.prompt_tokens or 0) + (response.usage.completion_tokens or 0)
        ModelRepository.record_usage(model_id, tokens)
    return reply


async def chat_completion_stream(model_id: int, messages: list):
    """异步流式调用 AI 模型（SSE）"""
    model = ModelRepository.get_by_id(model_id)
    if not model:
        raise ValueError("模型不存在")

    client = AsyncOpenAI(api_key=model["api_key"], base_url=model["base_url"])
    response = await client.chat.completions.create(
        model=model["model_name"],
        messages=messages,
        stream=True,
    )

    async for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


def save_conversation(user_id: int, username: str, question: str, answer: str,
                       model_name: str = "") -> int:
    """保存对话记录"""
    return ConversationRepository.create(user_id, username, model_name, question, answer)
