#!/usr/bin/env bash
# 公网演示：localtunnel 暴露 3000(前端) + 8080(后端)
# 用法：先在一个终端运行 npm run dev:stack，再运行本脚本
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if ! curl -sf --max-time 2 http://127.0.0.1:3000/ >/dev/null; then
  echo "❌ 前端未运行。请先在另一终端执行："
  echo "   cd \"$ROOT\" && npm run dev:stack"
  exit 1
fi
if ! curl -sf --max-time 2 http://127.0.0.1:8080/api/v1/health >/dev/null; then
  echo "❌ 后端未运行。请确认 npm run dev:stack 已启动。"
  exit 1
fi

echo "▶ 正在创建隧道（约 10–30 秒，请耐心等待）…"
echo ""

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

npx --yes localtunnel --port 3000 --local-host 127.0.0.1 >"$TMP/front.log" 2>&1 &
PID_F=$!
npx --yes localtunnel --port 8080 --local-host 127.0.0.1 >"$TMP/api.log" 2>&1 &
PID_A=$!

FRONT_URL=""
API_URL=""
for i in $(seq 1 30); do
  FRONT_URL=$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$TMP/front.log" | head -1 || true)
  API_URL=$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$TMP/api.log" | head -1 || true)
  if [[ -n "$FRONT_URL" && -n "$API_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$FRONT_URL" || -z "$API_URL" ]]; then
  echo "❌ 隧道创建失败。日志："
  echo "--- front ---"; cat "$TMP/front.log" || true
  echo "--- api ---"; cat "$TMP/api.log" || true
  kill $PID_F $PID_A 2>/dev/null || true
  exit 1
fi

cat >"$ENV_FILE" <<EOF
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=${API_URL}/api/v1
EOF

echo "✅ 隧道已就绪（关闭本脚本会断开公网访问）"
echo ""
echo "  前端  $FRONT_URL"
echo "  后端  $API_URL"
echo ""
echo "  已写入 $ENV_FILE"
echo ""
echo "⚠️  请重启前端使 .env.local 生效："
echo "   在 dev:stack 终端 Ctrl+C 后重新 npm run dev:stack"
echo ""
echo "⚠️  首次打开 loca.lt 可能要求输入「Tunnel Password」= 终端里显示的你的公网 IP"
echo ""
echo "钉钉应用首页 URL 填：$FRONT_URL"
echo ""
echo "按 Ctrl+C 停止隧道…"

wait $PID_F $PID_A
