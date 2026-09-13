#!/usr/bin/env bash
# VPS — öz domainləri eyni React build ilə xidmət et (default_server).
# İstifadə: sudo bash patch-nginx-webmenu-domains.sh login.smartcafe.az
set -euo pipefail

DOMAIN="${1:-login.smartcafe.az}"
SITE="/etc/nginx/sites-available/${DOMAIN}.conf"
WEBROOT="/var/www/${DOMAIN}/html"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Root ilə: sudo bash $0 $DOMAIN"
  exit 1
fi

if [[ ! -f "$SITE" ]]; then
  echo "XETA: $SITE tapilmadi. Evvelce install-nginx-login-subdomain.sh isledin."
  exit 1
fi

# default_server — CNAME/A ilə gələn istənilən Host header eyni SPA-nı alır
if grep -q "default_server" "$SITE"; then
  echo "OK: default_server artiq var."
else
  sed -i "s/listen 80;/listen 80 default_server;/" "$SITE"
  sed -i "s/listen \[::\]:80;/listen [::]:80 default_server;/" "$SITE"
  echo "OK: default_server elave edildi."
fi

nginx -t
systemctl reload nginx
echo "OK: Nginx yenilendi. Webroot: $WEBROOT"
echo "Her aktiv domain ucun SSL: certbot --nginx -d menu.example.az"
