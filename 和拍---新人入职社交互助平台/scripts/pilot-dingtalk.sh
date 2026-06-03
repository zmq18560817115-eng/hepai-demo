#!/usr/bin/env bash
# 钉钉插件试点：build 前端 + 单端口后端（同源 /api/v1）
# 用法：bash scripts/pilot-dingtalk.sh
# 公网 HTTPS：另开终端执行 cloudflared（见 docs/12-dingtalk-pilot-deploy.md）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$(cd "$ROOT/../hepai-server" && pwd)"

if [[ ! -d "$SERVER" ]]; then
  echo "未找到 hepai-server: $SERVER"
  exit 1
fi

echo "▶ 1/4 切换前端环境 .env.pilot"
cp "$ROOT/.env.pilot" "$ROOT/.env.local"

echo "▶ 2/4 构建前端（VITE_DINGTALK_EMBED=true, API=/api/v1）"
cd "$ROOT"
npm run build

echo "▶ 3/4 同步演示数据库"
cd "$SERVER"
npm run db:sync

echo "▶ 4/4 启动试点服务（前端+API 单端口 ${PORT:-8080}）"
export FRONTEND_DIST="$ROOT/dist"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8080}"

echo ""
echo "✅ 本地访问:  http://127.0.0.1:${PORT}/"
echo "✅ 健康检查:  http://127.0.0.1:${PORT}/api/v1/health"
echo ""
echo "📌 钉钉开放平台 · 应用首页 URL 需填 HTTPS 公网地址，例如："
echo "   cloudflared tunnel --url http://127.0.0.1:${PORT}"
echo "   将生成的 https://xxx.trycloudflare.com 填到钉钉 H5 首页"
echo ""
echo "📖 完整步骤见: docs/12-dingtalk-pilot-deploy.md"
echo ""

npm run start
