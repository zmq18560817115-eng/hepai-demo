#!/usr/bin/env bash
# 录制演示：前后端全连接（后端 8080 + 前端 3000 + 钉钉外壳）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$(cd "$ROOT/../hepai-server" && pwd)"

if [[ ! -d "$SERVER" ]]; then
  echo "❌ 未找到 hepai-server: $SERVER"
  exit 1
fi

# 强制走真实 API（非 Mock）
cp "$ROOT/.env.stack" "$ROOT/.env.local"
echo "✓ 已切换 .env.local → VITE_USE_MOCK_API=false"

cleanup() {
  echo ""
  echo "正在停止服务…"
  [[ -n "${BACK_PID:-}" ]] && kill "$BACK_PID" 2>/dev/null || true
  [[ -n "${FRONT_PID:-}" ]] && kill "$FRONT_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo ""
echo "════════════════════════════════════════"
echo "  和拍 · 全栈演示（录制用）"
echo "════════════════════════════════════════"
echo ""
echo "  前端  http://127.0.0.1:3000"
echo "  后端  http://127.0.0.1:8080/api/v1"
echo ""
echo "  演示账号（密码均为 123456）："
echo "    E00001  新人首次接入（大礼包→团队→盲盒）"
echo "    E00008  老员工（已完成入职，直达安全屋）"
echo "    M00001  导师"
echo "    HR0001  HR"
echo ""
echo "  重录首次接入：cd ../hepai-server && npm run db:reset-newcomer"
echo ""

# 确保数据库已初始化
if [[ ! -f "$SERVER/data/hepai.sqlite" ]]; then
  echo "▶ 首次运行，初始化 SQLite 数据库…"
  (cd "$SERVER" && npm run db:setup)
fi

echo "▶ 启动后端…"
(cd "$SERVER" && npm run dev) &
BACK_PID=$!

for i in $(seq 1 15); do
  if curl -sf "http://127.0.0.1:8080/api/v1/health" >/dev/null 2>&1; then
    echo "  ✓ 后端已就绪"
    break
  fi
  if [[ "$i" -eq 15 ]]; then
    echo "  ❌ 后端启动超时，请检查 hepai-server 日志"
    kill "$BACK_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

echo "▶ 启动前端…"
(cd "$ROOT" && npm run dev) &
FRONT_PID=$!

for i in $(seq 1 10); do
  if curl -sf "http://127.0.0.1:3000/" >/dev/null 2>&1; then
    echo "  ✓ 前端已就绪"
    break
  fi
  sleep 1
done

# macOS 自动打开浏览器（直达新人入职，方便录制）
if command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:3000/?start=onboarding" 2>/dev/null || true
fi

echo ""
echo "  按 Ctrl+C 停止前后端"
echo ""

wait "$FRONT_PID"
