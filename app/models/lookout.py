# 瞭望管理 数据访问层
import sqlite3
import re
import urllib.request
import urllib.parse
from typing import Optional
from app.models.db import get_connection


class LookoutSourceRepository:
    @staticmethod
    def list_all():
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM lookout_sources ORDER BY id DESC"
            ).fetchall()
            return list(rows)

    @staticmethod
    def list_page(page: int = 1, page_size: int = 10):
        offset = (page - 1) * page_size
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM lookout_sources ORDER BY id DESC LIMIT ? OFFSET ?",
                (page_size, offset)
            ).fetchall()
            total = conn.execute(
                "SELECT COUNT(*) AS cnt FROM lookout_sources"
            ).fetchone()["cnt"]
            return list(rows), total

    @staticmethod
    def get_by_id(source_id: int) -> Optional[sqlite3.Row]:
        with get_connection() as conn:
            return conn.execute(
                "SELECT * FROM lookout_sources WHERE id = ?", (source_id,)
            ).fetchone()

    @staticmethod
    def create(name: str, url_template: str, pn_param: str = "pn",
               page_size: int = 10, headers: str = "",
               cookies: str = "", keyword_placeholder: str = "{}") -> bool:
        try:
            with get_connection() as conn:
                conn.execute(
                    "INSERT INTO lookout_sources "
                    "(name, url_template, pn_param, page_size, headers, cookies, keyword_placeholder) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (name, url_template, pn_param, page_size, headers, cookies, keyword_placeholder)
                )
            return True
        except sqlite3.IntegrityError:
            return False

    @staticmethod
    def update(source_id: int, name: str, url_template: str,
               pn_param: str = "pn", page_size: int = 10,
               headers: str = "", cookies: str = "",
               keyword_placeholder: str = "{}") -> bool:
        with get_connection() as conn:
            cur = conn.execute(
                "UPDATE lookout_sources SET name=?, url_template=?, pn_param=?, "
                "page_size=?, headers=?, cookies=?, keyword_placeholder=? WHERE id=?",
                (name, url_template, pn_param, page_size, headers, cookies, keyword_placeholder, source_id)
            )
            return cur.rowcount > 0

    @staticmethod
    def delete(source_id: int) -> bool:
        with get_connection() as conn:
            cur = conn.execute(
                "DELETE FROM lookout_sources WHERE id = ?", (source_id,)
            )
            return cur.rowcount > 0

    @staticmethod
    def batch_delete(ids: list) -> int:
        with get_connection() as conn:
            placeholders = ",".join("?" for _ in ids)
            cur = conn.execute(
                f"DELETE FROM lookout_sources WHERE id IN ({placeholders})", ids
            )
            return cur.rowcount


class LookoutRecordRepository:
    @staticmethod
    def list_page(page: int = 1, page_size: int = 20,
                  source_id: Optional[int] = None,
                  keyword: str = "",
                  date_from: str = "", date_to: str = ""):
        offset = (page - 1) * page_size
        conditions = []
        params = []

        if source_id:
            conditions.append("r.source_id = ?")
            params.append(source_id)
        if keyword:
            conditions.append("(r.title LIKE ? OR r.summary LIKE ?)")
            params.extend([f"%{keyword}%", f"%{keyword}%"])
        if date_from:
            conditions.append("r.collected_at >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("r.collected_at <= ?")
            params.append(date_to + " 23:59:59")

        where = ""
        if conditions:
            where = "WHERE " + " AND ".join(conditions)

        with get_connection() as conn:
            rows = conn.execute(
                f"SELECT r.*, s.name AS source_name_label "
                f"FROM lookout_records r LEFT JOIN lookout_sources s ON r.source_id = s.id "
                f"{where} ORDER BY r.collected_at DESC LIMIT ? OFFSET ?",
                params + [page_size, offset]
            ).fetchall()
            total = conn.execute(
                f"SELECT COUNT(*) AS cnt FROM lookout_records r {where}",
                params
            ).fetchone()["cnt"]
            return list(rows), total

    @staticmethod
    def get_by_id(record_id: int) -> Optional[sqlite3.Row]:
        with get_connection() as conn:
            return conn.execute(
                "SELECT r.*, s.name AS source_name_label "
                "FROM lookout_records r LEFT JOIN lookout_sources s ON r.source_id = s.id "
                "WHERE r.id = ?", (record_id,)
            ).fetchone()

    @staticmethod
    def batch_insert(records: list) -> int:
        """批量插入采集记录。records: [{source_id, title, url, summary, publish_time, source_name, keyword}]"""
        with get_connection() as conn:
            count = 0
            for rec in records:
                try:
                    conn.execute(
                        "INSERT INTO lookout_records (source_id, title, url, summary, publish_time, source_name, keyword) "
                        "VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (rec["source_id"], rec["title"], rec.get("url", ""),
                         rec.get("summary", ""), rec.get("publish_time", ""),
                         rec.get("source_name", ""), rec.get("keyword", ""))
                    )
                    count += 1
                except sqlite3.IntegrityError:
                    pass
            return count

    @staticmethod
    def delete_old(keep_days: int = 30) -> int:
        with get_connection() as conn:
            cur = conn.execute(
                "DELETE FROM lookout_records WHERE collected_at < datetime('now', ?)",
                (f"-{keep_days} days",)
            )
            return cur.rowcount


class BaiduNewsCollector:
    """新闻采集器：支持百度新闻、搜狗新闻等多源采集"""

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,"
                  "image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    }

    @staticmethod
    def collect(source: sqlite3.Row, keyword: str, page: int = 0) -> list:
        """采集新闻，自动检测源类型（百度/搜狗）"""
        url_template = source["url_template"] or ""
        if "sogou.com" in url_template:
            return BaiduNewsCollector._collect_sogou(source, keyword, page)
        else:
            return BaiduNewsCollector._collect_baidu(source, keyword, page)

    @staticmethod
    def _collect_baidu(source: sqlite3.Row, keyword: str, page: int = 0) -> list:
        """采集百度新闻，返回解析后的记录列表"""
        url_template = source["url_template"]
        pn_param = source["pn_param"] or "pn"
        page_size = source["page_size"] or 10
        keyword_placeholder = source["keyword_placeholder"] or "{}"

        # 构建 URL
        real_url = url_template.replace(keyword_placeholder, urllib.parse.quote(keyword))
        if page > 0:
            pn_value = page * page_size
            if "?" in real_url:
                real_url += f"&{pn_param}={pn_value}"
            else:
                real_url += f"?{pn_param}={pn_value}"

        # 请求
        req = urllib.request.Request(real_url, headers=BaiduNewsCollector.HEADERS)
        try:
            resp = urllib.request.urlopen(req, timeout=15)
            html = resp.read().decode("utf-8", errors="ignore")
        except Exception:
            return []

        # 解析 HTML
        results = []
        # 百度新闻列表模式 1: div.result 或 div.result-op
        blocks = re.findall(
            r'<div\s+class="result[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>',
            html, re.DOTALL
        )
        if not blocks:
            # 模式 2: 尝试 <div class="c-single"> 或更一般的模式
            blocks = re.findall(
                r'<div\s+class="c-(?:single|abstract|c-result)[^"]*"[^>]*>(.*?)</div>\s*</div>',
                html, re.DOTALL
            )
        if not blocks:
            # 模式 3: 宽泛匹配新闻条目
            blocks = re.findall(
                r'<div\s+class="result[^"]*op[^"]*"[^>]*>.*?<h3[^>]*>(.*?)</h3>.*?<div\s+class="c-abstract"[^>]*>(.*?)</div>',
                html, re.DOTALL
            )
            for title_html, summary_html in blocks:
                title = re.sub(r'<[^>]+>', '', title_html).strip()
                summary = re.sub(r'<[^>]+>', '', summary_html).strip()
                # 提取 url
                url_match = re.search(r'href="(https?://[^"]+)"', title_html)
                url = url_match.group(1) if url_match else ""
                # 提取来源和时间
                source_name = ""
                pub_time = ""
                src_match = re.search(r'c-gap-right[^>]*>([^<]+)', html)
                if src_match:
                    source_name = src_match.group(1).strip()
                if title and not any(r["title"] == title for r in results):
                    results.append({
                        "title": title,
                        "url": url,
                        "summary": summary,
                        "source_name": source_name,
                        "publish_time": pub_time,
                        "keyword": keyword,
                    })
            return results

        for block in blocks:
            # 标题
            title_match = re.search(r'<h3[^>]*>(.*?)</h3>', block, re.DOTALL)
            if not title_match:
                continue
            title_html = title_match.group(1)
            title = re.sub(r'<[^>]+>', '', title_html).strip()
            if not title:
                continue

            # URL
            url_match = re.search(r'href="(https?://[^"]+)"', title_html)
            url = url_match.group(1) if url_match else ""

            # 摘要
            summary_match = re.search(
                r'<span\s+class="content-right_[^"]*"[^>]*>(.*?)</span>', block, re.DOTALL
            )
            if not summary_match:
                summary_match = re.search(r'c-abstract[^>]*>(.*?)</div>', block, re.DOTALL)
            summary = ""
            if summary_match:
                summary = re.sub(r'<[^>]+>', '', summary_match.group(1)).strip()

            # 来源名称 + 时间
            source_name = ""
            pub_time = ""
            src_match = re.search(r'<span[^>]*>([^<]+)</span>', block)
            if src_match:
                txt = src_match.group(1).strip()
                if txt and not txt.startswith("http"):
                    source_name = txt

            # 去重
            if not any(r["title"] == title for r in results):
                results.append({
                    "title": title,
                    "url": url,
                    "summary": summary,
                    "source_name": source_name,
                    "publish_time": pub_time,
                    "keyword": keyword,
                })

        return results

    @staticmethod
    def _collect_sogou(source: sqlite3.Row, keyword: str, page: int = 0) -> list:
        """采集搜狗新闻，返回解析后的记录列表。支持多页采集以获取 page_size 条结果。
        使用 crawl4ai 绕过搜狗反爬虫验证。"""
        import time
        import asyncio
        from concurrent.futures import ThreadPoolExecutor

        url_template = source["url_template"] or "https://news.sogou.com/news?query={}"
        page_size = source["page_size"] or 10
        keyword_placeholder = source["keyword_placeholder"] or "{}"

        SOGOU_PER_PAGE = 8  # 搜狗每页约返回 8 条
        # 计算需要采集的搜狗页数
        target_pages = max(1, (page_size + SOGOU_PER_PAGE - 1) // SOGOU_PER_PAGE)
        all_results = []

        urls = []
        for pg in range(target_pages):
            u = url_template.replace(keyword_placeholder, urllib.parse.quote(keyword))
            if pg > 0:
                u += f"&page={pg + 1}" if "?" in u else f"?page={pg + 1}"
            urls.append(u)

        async def _fetch_with_crawl4ai(urls):
            htmls = {}
            try:
                from crawl4ai import AsyncWebCrawler
                async with AsyncWebCrawler(verbose=False) as crawler:
                    for i, url in enumerate(urls):
                        try:
                            result = await crawler.arun(url=url, bypass_cache=True)
                            htmls[i] = result.html or ""
                        except Exception:
                            htmls[i] = ""
                        if i < len(urls) - 1:
                            await asyncio.sleep(0.5)  # 页间延迟
            except Exception:
                pass
            return htmls

        # 在新线程中运行 asyncio 事件循环
        try:
            htmls = ThreadPoolExecutor(max_workers=1).submit(
                lambda: asyncio.run(_fetch_with_crawl4ai(urls))
            ).result(timeout=90)
        except Exception:
            # crawl4ai 不可用时降级为 requests
            return BaiduNewsCollector._collect_sogou_fallback(source, keyword, page)

        for pg in range(target_pages):
            html = htmls.get(pg, "")
            if not html:
                continue
            if "验证码" in html or "seccode" in html:
                continue
            page_results = BaiduNewsCollector._parse_sogou_page(html, keyword)
            if not page_results and pg > 0:
                break
            all_results.extend(page_results)

        return all_results[:page_size]

    @staticmethod
    def _collect_sogou_fallback(source: sqlite3.Row, keyword: str, page: int = 0) -> list:
        """搜狗新闻采集降级方案：使用 requests 直接请求"""
        import requests
        import time
        import random
        url_template = source["url_template"] or "https://news.sogou.com/news?query={}"
        page_size = source["page_size"] or 10
        keyword_placeholder = source["keyword_placeholder"] or "{}"

        SOGOU_PER_PAGE = 8
        target_pages = max(1, (page_size + SOGOU_PER_PAGE - 1) // SOGOU_PER_PAGE)
        all_results = []

        agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0",
        ]

        for pg in range(target_pages):
            real_url = url_template.replace(keyword_placeholder, urllib.parse.quote(keyword))
            if pg > 0:
                if "?" in real_url:
                    real_url += f"&page={pg + 1}"
                else:
                    real_url += f"?page={pg + 1}"

            try:
                resp = requests.get(
                    real_url,
                    headers={
                        "User-Agent": random.choice(agents),
                        "Accept": "text/html,application/xhtml+xml",
                        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                    },
                    timeout=15,
                )
                html = resp.text
            except Exception:
                continue

            if "验证码" in html or "seccode" in html:
                continue

            page_results = BaiduNewsCollector._parse_sogou_page(html, keyword)
            if not page_results and pg > 0:
                break
            all_results.extend(page_results)

            if pg < target_pages - 1:
                time.sleep(1.5)

        return all_results[:page_size]

    @staticmethod
    def _parse_sogou_page(html: str, keyword: str) -> list:
        """解析单页搜狗新闻 HTML，返回结果列表"""
        # 搜狗新闻结构：<div class="vrwrap"> > <div class="news200616">
        # 标题：<h3 class="vr-title"> > <a>，URL在 href 或 data-url
        # 来源/时间：<p class="news-from text-lightgray"> > <span>
        # 摘要：<p class="star-wiki">

        results = []

        # 找到所有 news200616 块
        news_blocks = re.findall(
            r'<div\s+class="news200616"[^>]*>(.*?)</div>\s*</div>\s*</div>',
            html, re.DOTALL
        )

        # 提取所有 data-url 真实链接（按在 HTML 中出现的顺序）
        real_urls = re.findall(r'data-url="(https?://[^"]+)"', html)
        url_idx = 0  # 用于遍历 real_urls

        for block in news_blocks:
            # 标题
            title_match = re.search(r'<h3\s+class="vr-title"[^>]*>\s*<a[^>]*>(.*?)</a>', block, re.DOTALL)
            if not title_match:
                url_idx += 1
                continue
            title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
            if not title:
                url_idx += 1
                continue

            # URL：优先从 data-url 获取真实链接
            url = ""
            if url_idx < len(real_urls):
                url = real_urls[url_idx]
            url_idx += 1
            if not url:
                url_match = re.search(r'href="(/link\?[^"]+)"', title_match.group(0))
                if url_match:
                    url = "https://news.sogou.com" + url_match.group(1)

            # 跳过纯日期格式的标题
            if re.match(r'^\(\d{4}-\d{2}-\d{2}[\s\d:]*\)$', title):
                continue

            # 摘要
            summary = ""
            summary_match = re.search(
                r'<p\s+class="(?:star-wiki|news-desc)"[^>]*>(.*?)</p>', block, re.DOTALL
            )
            if summary_match:
                summary = re.sub(r'<[^>]+>', '', summary_match.group(1)).strip()

            # 来源和时间
            source_name = ""
            pub_time = ""
            from_match = re.search(
                r'<p\s+class="news-from[^"]*"[^>]*>(.*?)</p>', block, re.DOTALL
            )
            if from_match:
                spans = re.findall(r'<span[^>]*>(.*?)</span>', from_match.group(1))
                if len(spans) >= 1:
                    source_name = spans[0].strip()
                if len(spans) >= 2:
                    pub_time = spans[1].strip()

            if not any(r["title"] == title for r in results):
                results.append({
                    "title": title,
                    "url": url,
                    "summary": summary,
                    "source_name": source_name,
                    "publish_time": pub_time,
                    "keyword": keyword,
                })

        return results


# ====== 深度采集：对数据仓库已有记录的 URL 采集完整内容 ======

class DeepCollectTask:
    """深度采集任务：对瞭望采集到的新闻等网址采集其完整内容。
    支持 crawl4ai 和配置的模型引擎两种方式。
    使用线程池异步执行，通过 _progress 字典跟踪进度供前端轮询。
    """

    _progress = {}        # task_id -> {"total": N, "completed": N, "current": title, "status": "running"/"done"/"error", "errors": []}
    _lock = __import__('threading').Lock()

    @classmethod
    def init_db(cls):
        """启动时确保 full_content 列存在"""
        try:
            with get_connection() as conn:
                conn.execute("ALTER TABLE lookout_records ADD COLUMN full_content TEXT DEFAULT ''")
        except sqlite3.OperationalError:
            pass

    @classmethod
    def start(cls, record_ids: list) -> str:
        """启动深度采集任务，返回 task_id"""
        import uuid
        task_id = str(uuid.uuid4())[:8]

        with cls._lock:
            cls._progress[task_id] = {
                "total": len(record_ids),
                "completed": 0,
                "current": "",
                "status": "running",
                "errors": []
            }

        # 在线程池中异步执行
        from concurrent.futures import ThreadPoolExecutor
        executor = ThreadPoolExecutor(max_workers=3)
        executor.submit(cls._run, task_id, record_ids)

        return task_id

    @classmethod
    def _run(cls, task_id: str, record_ids: list):
        """在线程中执行深度采集"""
        try:
            for i, rid in enumerate(record_ids):
                # 更新当前进度
                with cls._lock:
                    if task_id not in cls._progress:
                        return
                    cls._progress[task_id]["completed"] = i
                try:
                    record = LookoutRecordRepository.get_by_id(rid)
                    if not record or not record["url"]:
                        with cls._lock:
                            cls._progress[task_id]["completed"] = i + 1
                        continue

                    cls._progress[task_id]["current"] = record["title"] or record["url"]

                    # 尝试用 crawl4ai 采集
                    content = cls._fetch_with_crawl4ai(record["url"])
                    if not content:
                        # 降级：用配置的模型引擎采集
                        content = cls._fetch_with_model(record["url"], record["title"] or "")

                    if content:
                        cls._save_content(rid, content)

                except Exception as e:
                    with cls._lock:
                        cls._progress[task_id]["errors"].append(
                            f"记录#{rid}: {str(e)[:100]}"
                        )

                with cls._lock:
                    cls._progress[task_id]["completed"] = i + 1

            with cls._lock:
                cls._progress[task_id]["status"] = "done"
                cls._progress[task_id]["current"] = ""
        except Exception as e:
            with cls._lock:
                cls._progress[task_id]["status"] = "error"
                cls._progress[task_id]["errors"].append(str(e)[:200])

    @staticmethod
    def _fetch_with_crawl4ai(url: str) -> str:
        """使用 crawl4ai 提取网页完整内容"""
        try:
            import asyncio
            from crawl4ai import AsyncWebCrawler

            async def _fetch():
                async with AsyncWebCrawler() as crawler:
                    result = await crawler.arun(url=url)
                    return result.markdown if result and result.markdown else ""

            # 在新线程的事件循环中运行
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(_fetch())
            finally:
                loop.close()
        except ImportError:
            return ""
        except Exception:
            return ""

    @staticmethod
    def _fetch_with_model(url: str, title: str = "") -> str:
        """使用配置的模型引擎提取网页内容"""
        try:
            import urllib.request
            from bs4 import BeautifulSoup

            # 先用 requests 获取原始 HTML
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            resp = urllib.request.urlopen(req, timeout=15)
            html = resp.read().decode("utf-8", errors="ignore")

            # 提取文本
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)
            # 截取前 8000 字符
            text = text[:8000]

            # 使用默认模型提取内容
            model = ModelRepository.get_default()
            if not model:
                return text  # 无模型则直接返回原始文本

            from openai import OpenAI
            client = OpenAI(api_key=model["api_key"], base_url=model["base_url"])
            response = client.chat.completions.create(
                model=model["model_name"],
                messages=[{
                    "role": "user",
                    "content": f"请从以下网页文本中提取正文内容，去除广告、导航等无关信息。"
                               f"网页标题：{title}\n\n原始文本：\n{text}\n\n请输出整理后的正文内容："
                }]
            )
            return response.choices[0].message.content or text
        except ImportError:
            return ""
        except Exception:
            return ""

    @staticmethod
    def _save_content(record_id: int, content: str):
        """保存完整内容到数据库"""
        with get_connection() as conn:
            conn.execute(
                "UPDATE lookout_records SET full_content = ? WHERE id = ?",
                (content, record_id)
            )

    @classmethod
    def get_progress(cls, task_id: str) -> dict:
        """获取任务进度"""
        with cls._lock:
            if task_id not in cls._progress:
                return {"total": 0, "completed": 0, "current": "", "status": "not_found", "errors": []}
            return dict(cls._progress[task_id])

    @classmethod
    def get_full_content(cls, record_id: int) -> str:
        """获取某条记录的完整内容"""
        with get_connection() as conn:
            row = conn.execute(
                "SELECT full_content, title, url FROM lookout_records WHERE id = ?",
                (record_id,)
            ).fetchone()
            if row:
                return {
                    "title": row["title"],
                    "url": row["url"],
                    "full_content": row["full_content"] or ""
                }
            return None

    @classmethod
    def cleanup_old_progress(cls, max_age_seconds: int = 3600):
        """清理过期的进度记录"""
        # 简单实现：清理所有已完成的旧任务
        import time
        with cls._lock:
            to_remove = [tid for tid, p in cls._progress.items()
                         if p["status"] in ("done", "error")]
            for tid in to_remove[:50]:  # 最多保留最近50个
                del cls._progress[tid]


class ScheduledTaskRepository:
    """定时任务仓库（测试用）"""

    @staticmethod
    def create(task_type, task_config, cron_expr, task_name="", status=1):
        """创建定时任务"""
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO scheduled_tasks (task_type, task_config, cron_expr, task_name, status) "
                "VALUES (?, ?, ?, ?, ?)",
                (task_type, task_config, cron_expr, task_name, status)
            )
            return conn.last_insert_rowid()

    @staticmethod
    def list_page(page=1, page_size=20):
        """分页查询"""
        with get_connection() as conn:
            total = conn.execute("SELECT COUNT(*) AS cnt FROM scheduled_tasks").fetchone()["cnt"]
            rows = conn.execute(
                "SELECT * FROM scheduled_tasks ORDER BY id DESC LIMIT ? OFFSET ?",
                (page_size, (page - 1) * page_size)
            ).fetchall()
            return rows, total

    @staticmethod
    def get_by_id(task_id):
        """根据ID查询"""
        with get_connection() as conn:
            return conn.execute(
                "SELECT * FROM scheduled_tasks WHERE id = ?", (task_id,)
            ).fetchone()

    @staticmethod
    def toggle_status(task_id):
        """切换启用/禁用"""
        with get_connection() as conn:
            task = conn.execute("SELECT * FROM scheduled_tasks WHERE id = ?", (task_id,)).fetchone()
            if not task:
                return False
            new_status = 0 if task["status"] == 1 else 1
            conn.execute("UPDATE scheduled_tasks SET status = ? WHERE id = ?", (new_status, task_id))
            return True


# 延迟导入，避免循环引用
from app.models.model import ModelRepository
