#!/usr/bin/env bash
# 最简单演示：本地浏览器打开，无需 ngrok / cloudflared / localtunnel
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/.env.stack" "$ROOT/.env.local"

echo ""
echo "✅ 已切换为本地全栈模式（.env.local ← .env.stack）"
echo ""
echo "▶ 启动后请在浏览器打开："
echo "   http://127.0.0.1:3000"
echo ""
echo "▶ 演示路径：左侧「和 新人入职」→「我是新人」"
echo ""

cd "$ROOT"
npm run dev:stack
