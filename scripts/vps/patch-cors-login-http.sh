#!/usr/bin/env bash
# VPS: login.smartcafe.az üçün http + https CORS origin-ləri (.env) və config cache.
# İstifadə: sudo bash patch-cors-login-http.sh
# və ya: sudo bash patch-cors-login-http.sh /var/www/laravel-app/.env
set -euo pipefail

ENV="${1:-/var/www/laravel-app/.env}"
if [[ ! -f "$ENV" ]]; then
  echo "Fayl yoxdur: $ENV"
  exit 1
fi

LINE='CORS_ALLOWED_ORIGINS=https://smartcafe.az,https://www.smartcafe.az,http://smartcafe.az,http://www.smartcafe.az,https://login.smartcafe.az,https://www.login.smartcafe.az,http://login.smartcafe.az,http://www.login.smartcafe.az'

if grep -q '^CORS_ALLOWED_ORIGINS=' "$ENV"; then
  cp -a "$ENV" "${ENV}.bak-cors-$(date +%Y%m%d%H%M%S)"
  sed -i "s|^CORS_ALLOWED_ORIGINS=.*|${LINE}|" "$ENV"
  echo "CORS_ALLOWED_ORIGINS yenilendi."
else
  echo "" >> "$ENV"
  echo "$LINE" >> "$ENV"
  echo "CORS_ALLOWED_ORIGINS elave edildi."
fi

LARAVEL_ROOT="$(dirname "$ENV")"
if [[ -f "$LARAVEL_ROOT/artisan" ]]; then
  (cd "$LARAVEL_ROOT" && php artisan config:cache)
  echo "php artisan config:cache — OK"
else
  echo "Xəbərdarlıq: $LARAVEL_ROOT/artisan tapılmadı — əl ilə config:cache işlədin."
fi

grep '^CORS_ALLOWED_ORIGINS=' "$ENV" || true
