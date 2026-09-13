#!/usr/bin/env bash
# VPS (Ubuntu/Debian) — login.smartcafe.az üçün Nginx + statik kök.
# İstifadə: sudo bash install-nginx-login-subdomain.sh login.smartcafe.az
set -euo pipefail

DOMAIN="${1:-login.smartcafe.az}"
WEBROOT="/var/www/${DOMAIN}/html"
SITE="/etc/nginx/sites-available/${DOMAIN}.conf"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Root ilə işlədin: sudo bash $0 $DOMAIN"
  exit 1
fi

command -v nginx >/dev/null 2>&1 || {
  apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
}

mkdir -p "$WEBROOT"
chown -R www-data:www-data "/var/www/${DOMAIN}"

cat >"$SITE" <<EOF
# SmartCafe POS (React build) — ${DOMAIN}
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    root ${WEBROOT};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|webp|map)\$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
EOF

ln -sf "$SITE" "/etc/nginx/sites-enabled/${DOMAIN}.conf"

# Default site conflict — disable default if it breaks server_name (optional)
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default || true
fi

nginx -t
systemctl reload nginx

echo "OK: Nginx hazirdir."
echo "  Web root: ${WEBROOT}"
echo "  Sonra SSL: certbot --nginx -d ${DOMAIN}"
echo "  Build fayllarini bu qovluqa kopyalayin (deploy-vps.ps1 bunu edir)."
