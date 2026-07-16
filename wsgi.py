"""
XHAgentOS 生产环境 WSGI 入口

供 PaaS 平台（Zeabur / Railway）或 Waitress 使用。
"""
import os
from app.factory import create_app

app = create_app()

if __name__ == "__main__":
    import waitress
    port = int(os.environ.get("PORT", 35001))
    print(f">>> XHAgentOS 生产服务启动于 0.0.0.0:{port}")
    waitress.serve(app, host="0.0.0.0", port=port)
