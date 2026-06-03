#!/usr/bin/env bash
# 在 Oracle 云主机（Ubuntu）上执行，需先上传 hepai-deploy.tar.gz 到用户主目录
# 用法：sudo bash oracle-install-on-server.sh 你的子域名
# 示例：sudo bash oracle-install-on-server.sh hepai-demo
# 完整域名将是 hepai-demo.duckdns.org
set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "用法: sudo bash $0 你的DuckDNS子域名"
  echo "示例: sudo bash $0 hepai-demo"
  echo "      → 网站地址 https://hepai-demo.duckdns.org/"
  exit 1
fi

FQDN="${DOMAIN}.duckdns.org"
ARCHIVE="$HOME/hepai-deploy.tar.gz"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "❌ 未找到 $ARCHIVE"
  echo "请先在 Mac 上运行 scripts/oracle-pack.sh，再用 scp 上传到此目录"
  exit 1
fi

echo "▶ 安装系统依赖..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git build-essential python3 debian-keyring debian-archive-keyring apt-transport-https

if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]]; then
  echo "▶ 安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo "▶ 解压项目到 /opt/hepai ..."
EXTRACT="/tmp/hepai-extract-$$"
mkdir -p "$EXTRACT"
tar xzf "$ARCHIVE" -C "$EXTRACT"
rm -rf /opt/hepai/hepai-server /opt/hepai/dist
mkdir -p /opt/hepai
mv "$EXTRACT/hepai-server" /opt/hepai/
mv "$EXTRACT/dist" /opt/hepai/
rm -rf "$EXTRACT"
chown -R ubuntu:ubuntu /opt/hepai 2>/dev/null || true

echo "▶ 安装和拍后端..."
cd /opt/hepai/hepai-server
sudo -u ubuntu npm install 2>/dev/null || npm install
sudo -u ubuntu npm run db:sync 2>/dev/null || npm run db:sync

JWT_SECRET="hepai-$(openssl rand -hex 16 2>/dev/null || echo randomsecret)"
cat > /opt/hepai/hepai-server/.env <<EOF
PORT=8080
HOST=127.0.0.1
JWT_SECRET=${JWT_SECRET}
SQLITE_PATH=./data/hepai.sqlite
FRONTEND_DIST=/opt/hepai/dist
EOF
chown ubuntu:ubuntu /opt/hepai/hepai-server/.env 2>/dev/null || true

echo "▶ 安装 pm2..."
npm install -g pm2
cd /opt/hepai/hepai-server
sudo -u ubuntu pm2 delete hepai 2>/dev/null || true
sudo -u ubuntu pm2 start npm --name hepai -- run start
sudo -u ubuntu pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null | tail -1 | bash || true

echo "▶ 安装 Caddy（自动 HTTPS）..."
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || true
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -qq
  apt-get install -y -qq caddy
fi

cat > /etc/caddy/Caddyfile <<EOF
${FQDN} {
    reverse_proxy 127.0.0.1:8080
}
EOF
systemctl enable caddy
systemctl reload caddy

echo ""
echo "=============================================="
echo "✅ 安装完成"
echo ""
echo "  网站地址:  https://${FQDN}/"
echo "  健康检查:  https://${FQDN}/api/v1/health"
echo ""
echo "  请确认 DuckDNS 已把 ${FQDN} 指向本机公网 IP"
echo "  钉钉 H5 首页填: https://${FQDN}/"
echo "  可信域名填:     ${FQDN}"
echo ""
echo "  演示账号 E00001 密码 123456"
echo "=============================================="
sleep 3
curl -sf "http://127.0.0.1:8080/api/v1/health" && echo "" || echo "⚠️  本机 8080 未响应，请执行: pm2 logs hepai"
