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
sudo ufw allow 18082/tcp
sudo ufw allow 18002/tcp
```

## 访问

| 服务 | 地址 |
|------|------|
| 前端 | `http://公网IP:18082/` |
| 后端 | `http://公网IP:18002/` |

## 镜像

- `${DOCKER_USERNAME}/xhagentos-backend:latest`
- `${DOCKER_USERNAME}/xhagentos-frontend:latest`

三项目端口：SmartQA `18080/18000`，Code Review `18001`，本项目 `18082/18002`。
