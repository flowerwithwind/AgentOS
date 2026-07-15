"""
模型管理服务
"""
import logging
from app.models.model import ModelRepository

logger = logging.getLogger(__name__)


class ModelService:

    @staticmethod
    def get_model_list(page: int = 1, page_size: int = 10) -> tuple[list, int]:
        """获取模型列表"""
        return ModelRepository.list_page(page, page_size)

    @staticmethod
    def create_model(name: str, api_key: str, base_url: str,
                     model_name: str, provider: str = "openai") -> tuple[bool, str]:
        """创建模型"""
        if not name or not api_key or not model_name:
            return False, "名称、API密钥和模型名不能为空"
        ok = ModelRepository.create(name, api_key, base_url, model_name, provider)
        return (True, "创建成功") if ok else (False, "创建失败")

    @staticmethod
    def update_model(model_id: int, name: str, api_key: str, base_url: str,
                     model_name: str, provider: str = "openai") -> tuple[bool, str]:
        """更新模型"""
        if not name or not model_name:
            return False, "名称和模型名不能为空"
        ok = ModelRepository.update(model_id, name, api_key, base_url, model_name, provider)
        return (True, "更新成功") if ok else (False, "更新失败")

    @staticmethod
    def delete_model(model_id: int) -> tuple[bool, str]:
        """删除模型"""
        ok = ModelRepository.delete(model_id)
        return (True, "删除成功") if ok else (False, "删除失败")

    @staticmethod
    def set_default(model_id: int) -> tuple[bool, str]:
        """设为默认模型"""
        ok = ModelRepository.set_default(model_id)
        return (True, "设置成功") if ok else (False, "设置失败")
