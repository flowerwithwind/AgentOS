#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/xhagentos}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:18002/}"
cd "$APP_DIR"

[[ -f docker-compose.yml ]] || { echo "missing compose"; ls -la; exit 1; }
[[ -f .env ]] || { echo "missing .env"; exit 1; }

get_env() {
  local line
  line="$(grep -E "^${1}=" .env | tail -n1 || true)"
  echo "${line#*=}"
}

DOCKER_USERNAME="$(get_env DOCKER_USERNAME)"
[[ -n "$DOCKER_USERNAME" ]] || { echo "DOCKER_USERNAME empty"; exit 1; }

run_root() {
  if [[ "$(id -u)" -eq 0 ]]; then "$@"; elif command -v sudo >/dev/null 2>&1; then sudo "$@"; else "$@"; fi
}

force_registry_mirrors() {
  echo "==> registry-mirrors"
  run_root mkdir -p /etc/docker
  run_root tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.m.daocloud.io",
    "https://docker.1ms.run"
  ],
  "max-concurrent-downloads": 3
}
EOF
  run_root systemctl daemon-reload 2>/dev/null || true
  run_root systemctl restart docker 2>/dev/null || true
  sleep 4
}

hub_reachable() {
  timeout 5 bash -c 'echo >/dev/tcp/registry-1.docker.io/443' 2>/dev/null || false
}

force_registry_mirrors
rm -f .docker_password 2>/dev/null || true
if hub_reachable && [[ -n "${DOCKER_PASSWORD:-}" ]]; then
  echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin || true
fi

echo "==> Pull"
for i in 1 2 3 4 5; do
  docker compose pull && break
  sleep $((i * 6))
  [[ "$i" -eq 5 ]] && exit 1
done

echo "==> Up"
docker compose up -d --remove-orphans
docker compose ps

echo "==> Health"
ok=0
for i in $(seq 1 24); do
  curl -fsS "$HEALTH_URL" >/dev/null 2>&1 && { ok=1; break; }
  sleep 5
done
[[ "$ok" -ne 1 ]] && docker compose logs --tail=40 backend || true
echo "Done $(date -Is)"
