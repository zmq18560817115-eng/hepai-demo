#!/usr/bin/env bash
# MySQL 初始化（需本机 MySQL 与账号密码）
# 用法: MYSQL_PASSWORD=你的密码 ./scripts/setup-mysql.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${MYSQL_HOST:-127.0.0.1}"
USER="${MYSQL_USER:-root}"
PASS="${MYSQL_PASSWORD:-}"
DB="hepai"

mysql_cmd() {
  if [ -n "$PASS" ]; then
    mysql -h "$HOST" -u "$USER" -p"$PASS" "$@"
  else
    mysql -h "$HOST" -u "$USER" "$@"
  fi
}

echo ">>> 创建数据库 $DB"
mysql_cmd -e "CREATE DATABASE IF NOT EXISTS $DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo ">>> 执行 init.sql"
mysql_cmd "$DB" < "$ROOT/db/init.sql"

echo ">>> 执行迁移"
mysql_cmd "$DB" < "$ROOT/db/migrations/001_api_v1_extensions.sql"

echo ">>> 执行种子数据"
mysql_cmd "$DB" < "$ROOT/db/seed.sql"

echo ">>> MySQL 就绪: $DB"
