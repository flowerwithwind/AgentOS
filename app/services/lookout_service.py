"""
瞭望采集服务
"""
import logging
from app.models.lookout import LookoutSourceRepository, LookoutRecordRepository, BaiduNewsCollector

logger = logging.getLogger(__name__)


class LookoutService:

    @staticmethod
    def get_sources(page: int = 1, page_size: int = 10) -> tuple[list, int]:
        """获取信息源列表"""
        return LookoutSourceRepository.list_page(page, page_size)

    @staticmethod
    def create_source(name: str, url_template: str, pn_param: str = "pn",
                      page_size: int = 10, keyword_placeholder: str = "{}") -> tuple[bool, str]:
        """创建信息源"""
        if not name or not url_template:
            return False, "名称和URL模板不能为空"
        ok = LookoutSourceRepository.create(name, url_template, pn_param,
                                             page_size, keyword_placeholder=keyword_placeholder)
        return (True, "创建成功") if ok else (False, "创建失败")

    @staticmethod
    def update_source(sid: int, name: str, url_template: str, pn_param: str = "pn",
                      page_size: int = 10, keyword_placeholder: str = "{}") -> tuple[bool, str]:
        """更新信息源"""
        if not name or not url_template:
            return False, "名称和URL模板不能为空"
        ok = LookoutSourceRepository.update(sid, name, url_template, pn_param,
                                             page_size, keyword_placeholder=keyword_placeholder)
        return (True, "更新成功") if ok else (False, "更新失败")

    @staticmethod
    def delete_source(sid: int) -> tuple[bool, str]:
        """删除信息源"""
        ok = LookoutSourceRepository.delete(sid)
        return (True, "删除成功") if ok else (False, "删除失败")

    @staticmethod
    def collect(source_id: int, keyword: str, page: int = 0, page_size: int = 0) -> tuple[bool, str, list]:
        """执行采集"""
        if source_id <= 0 or not keyword:
            return False, "请选择采集源并输入关键词", []
        source = LookoutSourceRepository.get_by_id(source_id)
        if not source:
            return False, "采集源不存在", []
        if page_size > 0:
            source = dict(source)
            source["page_size"] = page_size
        try:
            results = BaiduNewsCollector.collect(source, keyword, page)
            return True, f"采集完成，获取 {len(results)} 条", results
        except Exception as e:
            return False, f"采集失败: {str(e)}", []

    @staticmethod
    def get_warehouse(page: int = 1, page_size: int = 20,
                      source_id: int = None, keyword: str = "",
                      date_from: str = "", date_to: str = "") -> tuple[list, int]:
        """获取数据仓库列表"""
        return LookoutRecordRepository.list_page(
            page, page_size, source_id=source_id,
            keyword=keyword, date_from=date_from, date_to=date_to
        )
