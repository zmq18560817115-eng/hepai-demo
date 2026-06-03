#!/usr/bin/env bash
# 同时启动后端 (8080) + 前端 (3000)，用于测试全栈展示
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$(cd "$ROOT/../hepai-server" && pwd)"

if [[ ! -d "$SERVER" ]]; then
  echo "未找到 hepai-server: $SERVER"
  exit 1
fi

cleanup() {
  echo ""
  echo "正在停止服务…"
  [[ -n "${BACK_PID:-}" ]] && kill "$BACK_PID" 2>/dev/null || true
  [[ -n "${FRONT_PID:-}" ]] && kill "$FRONT_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo "▶ 后端  http://localhost:8080/api/v1"
(cd "$SERVER" && npm run dev) &
BACK_PID=$!

for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf "http://localhost:8080/api/v1/health" >/dev/null 2>&1; then
    echo "  后端已就绪"
    break
  fi
  sleep 1
done

echo "▶ 前端  http://127.0.0.1:3000"
echo "  请确认 .env.local 中 VITE_USE_MOCK_API=false 以走真实 API"
(cd "$ROOT" && npm run dev) &
FRONT_PID=$!

wait "$FRONT_PID"
