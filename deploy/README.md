# XHAgentOS — GitHub 自动部署

模式与 wenshu 相同：测试/构建 → Docker Hub → SSH 上传 → `docker compose up`。

## Secrets

| Secret | 说明 |
|--------|------|
| `DOCKER_USERNAME` / `DOCKER_PASSWORD` | 必填 |
| `SERVER_HOST` / `SERVER_USER` / `SERVER_PASSWORD` | 远程部署 |
| `SERVER_PORT` | 可选，默认 22 |
| `DEEPSEEK_API_KEY` | 可选 LLM |

## 服务器

```bash
sudo mkdir -p /opt/xhagentos
sudo chown -R ubuntu:ubuntu /opt/xhagentos
sudo ufw allow 8080/tcp
sudo ufw allow 35001/tcp
```

## 访问

| 服务 | 地址 |
|------|------|
| 前端 | `http://公网IP:8080/` |
| 后端 | `http://公网IP:35001/` |

## 镜像

- `${DOCKER_USERNAME}/xhagentos-backend:latest`
- `${DOCKER_USERNAME}/xhagentos-frontend:latest`

与 SmartQA（`:80` / `:8000`）、Code Review Agent（`:8001`）端口错开。
