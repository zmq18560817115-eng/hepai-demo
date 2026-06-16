#!/usr/bin/env bash
# 和拍演示：钉钉外壳 + 玻璃拟态身份选择
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/.env.mock" "$ROOT/.env.local"

echo ""
echo "════════════════════════════════════════"
echo "  和拍 · 新人入职社交互助平台"
echo "════════════════════════════════════════"
echo ""
echo "  浏览器： http://127.0.0.1:3000"
echo "  设计导航： http://127.0.0.1:3000/?showcase=1"
echo ""
echo "  进入后：左侧点「新人入职」→ 玻璃拟态身份选择"
echo "  三张卡片：局外新人 / 资深导师 / 行政/HR"
echo ""
echo "  演示账号 E00001 / 123456"
echo ""

cd "$ROOT"
exec env VITE_USE_MOCK_API=true npx vite --open / --port 3000 --host 127.0.0.1
