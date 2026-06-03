#!/usr/bin/env bash
# 一键 Docker 部署（需本机已安装 Docker Desktop）
set -euo pipefail

TEXT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if ! command -v docker >/dev/null; then
  echo "❌ 未安装 Docker。请先安装 Docker Desktop:"
  echo "   https://www.docker.com/products/docker-desktop/"
  exit 1
fi

cd "$TEXT_ROOT"
echo "▶ 构建并启动和拍（端口 8080）…"
docker compose up --build -d

echo ""
echo "✅ 和拍已启动"
echo "   本机访问:  http://127.0.0.1:8080/"
echo "   健康检查:  http://127.0.0.1:8080/api/v1/health"
echo "   演示账号:  E00001 / 123456"
echo ""
echo "   停止服务:  cd \"$TEXT_ROOT\" && docker compose down"
echo "   查看日志:  docker compose logs -f"
echo ""
echo "📌 要给外网访问：在另一终端执行"
echo "   npx localtunnel --port 8080 --local-host 127.0.0.1"
echo "   或把本机 8080 部署到 Zeabur / Render（见 docs/14-更方便部署.md）"
