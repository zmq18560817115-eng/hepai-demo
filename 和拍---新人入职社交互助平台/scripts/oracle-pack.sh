#!/usr/bin/env bash
# Mac 本机执行：构建前端并打包，供上传到 Oracle 云主机
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$(cd "$ROOT/../hepai-server" && pwd)"
OUT="$ROOT/../hepai-deploy.tar.gz"

if [[ ! -d "$SERVER" ]]; then
  echo "❌ 未找到 hepai-server: $SERVER"
  exit 1
fi

echo "▶ 1/2 构建前端（钉钉试点模式）"
cp "$ROOT/.env.pilot" "$ROOT/.env.local"
cd "$ROOT"
npm run build

echo "▶ 2/2 打包（不含 node_modules，体积更小）"
cd "$(dirname "$ROOT")"
tar czf "$OUT" \
  --exclude='hepai-server/node_modules' \
  --exclude='hepai-server/data' \
  hepai-server \
  -C "$ROOT" dist

echo ""
echo "✅ 打包完成:"
echo "   $OUT"
echo ""
echo "下一步：把文件上传到云主机，例如："
echo "   scp -i 你的密钥.key $OUT ubuntu@你的公网IP:~/"
echo ""
echo "然后在云主机执行安装脚本（见 docs/13-oracle-傻瓜部署.md）"
