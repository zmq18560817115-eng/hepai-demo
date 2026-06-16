#!/usr/bin/env bash
# 钉钉 H5 公网 HTTPS 隧道（cloudflared 429 时的备用方案）
# 用法：先启动服务，再运行本脚本
#
#   单端口（填钉钉开放平台）：npm run pilot:dingtalk  或  npm run record（8080 有 dist）
#   bash scripts/tunnel-dingtalk.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8080}"

if ! curl -sf --max-time 3 "http://127.0.0.1:${PORT}/api/v1/health" >/dev/null; then
  echo "❌ 端口 ${PORT} 后端未运行。"
  echo "   请先执行: npm run record  或  npm run pilot:dingtalk"
  exit 1
fi

echo ""
echo "════════════════════════════════════════"
echo "  和拍 · 钉钉 HTTPS 公网隧道"
echo "════════════════════════════════════════"
echo ""
echo "  本地服务: http://127.0.0.1:${PORT}/"
echo ""

PUBLIC_IP=""
PUBLIC_IP=$(curl -sf --max-time 5 https://api.ipify.org 2>/dev/null || true)

cleanup() {
  [[ -n "${LT_PID:-}" ]] && kill "$LT_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

try_localtunnel() {
  echo "▶ 方案 A：localtunnel（无需注册）"
  echo "  正在创建隧道…"
  local log
  log=$(mktemp)
  npx --yes localtunnel --port "$PORT" --local-host 127.0.0.1 >"$log" 2>&1 &
  LT_PID=$!
  local url=""
  for _ in $(seq 1 25); do
    url=$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$log" | head -1 || true)
    [[ -n "$url" ]] && break
    sleep 1
  done
  if [[ -z "$url" ]]; then
    echo "  ❌ localtunnel 创建失败"
    cat "$log" 2>/dev/null || true
    kill "$LT_PID" 2>/dev/null || true
    return 1
  fi
  echo ""
  echo "  ✅ 公网 HTTPS: $url"
  echo ""
  echo "  钉钉开放平台 · 应用首页 URL 填:"
  echo "    $url"
  echo ""
  if [[ -n "$PUBLIC_IP" ]]; then
    echo "  ⚠️  首次打开 loca.lt 若提示 Tunnel Password，填你的公网 IP:"
    echo "    $PUBLIC_IP"
    echo ""
  fi
  echo "  自测: curl -H 'Bypass-Tunnel-Reminder: true' $url/api/v1/health"
  echo ""
  echo "  按 Ctrl+C 停止隧道"
  wait "$LT_PID"
}

print_cloudflared_help() {
  echo "▶ 方案 B：cloudflared（免费，但可能 429 限流）"
  echo ""
  echo "  若出现 429 Too Many Requests / error 1015："
  echo "  · 这是 Cloudflare 免费快速隧道请求过多，不是项目错误"
  echo "  · 等待 30–60 分钟后重试，或换网络/换时段"
  echo ""
  echo "  命令:"
  echo "    cloudflared tunnel --url http://127.0.0.1:${PORT}"
  echo ""
}

print_ngrok_help() {
  echo "▶ 方案 C：ngrok（需免费注册 + authtoken，较稳定）"
  echo ""
  echo "  1. 注册 https://dashboard.ngrok.com/signup"
  echo "  2. ngrok config add-authtoken <你的token>"
  echo "  3. ngrok http ${PORT}"
  echo "  4. 将 Forwarding 的 https://xxx.ngrok-free.app 填到钉钉"
  echo ""
}

print_local_help() {
  echo "▶ 方案 D：本机浏览器录屏（无需公网，推荐）"
  echo ""
  echo "  钉钉 PC 外壳演示:"
  echo "    http://127.0.0.1:3000/?start=onboarding"
  echo ""
  echo "  真钉钉 H5 单页预览:"
  echo "    http://127.0.0.1:3000/?embed=1"
  echo ""
}

print_cloudflared_help
print_ngrok_help
print_local_help

if try_localtunnel; then
  exit 0
fi

echo "❌ 自动隧道未成功，请按上方方案 B/C 手动操作，或直接用方案 D 本机录屏。"
exit 1
