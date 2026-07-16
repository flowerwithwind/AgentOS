# XHAgentOS Flask API (production)
FROM python:3.11-slim

WORKDIR /app

RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list 2>/dev/null || true && \
    apt-get update && \
    apt-get install -y --no-install-recommends curl gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com \
    -r requirements.txt

COPY app ./app
COPY wsgi.py app.py ./
COPY database ./database

ENV PYTHONUNBUFFERED=1
ENV PORT=35001
ENV FLASK_ENV=production

EXPOSE 35001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:35001/api/health || curl -fsS http://127.0.0.1:35001/ || exit 1

CMD ["python", "wsgi.py"]
