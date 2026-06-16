#!/usr/bin/env bash
# 最简单演示：打开首页设计展示（Mock，无需后端）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$ROOT/scripts/start-showcase.sh"
