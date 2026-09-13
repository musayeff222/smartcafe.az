#!/usr/bin/env bash
set -euo pipefail
ENV="${1:-/var/www/laravel-app/.env}"
if [[ ! -f "$ENV" ]]; then
  echo "Missing: $ENV"
  exit 1
fi
cp -a "$ENV" "${ENV}.bak-login-$(date +%Y%m%d%H%M%S)"
sed -i 's/^SANCTUM_STATEFUL_DOMAINS=.*/SANCTUM_STATEFUL_DOMAINS=login.smartcafe.az,api.smartcafe.az/' "$ENV"
sed -i 's|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=https://login.smartcafe.az,https://www.login.smartcafe.az|' "$ENV"
grep -E '^SANCTUM_|^CORS_|^SESSION_DOMAIN' "$ENV" || true
cd /var/www/laravel-app
php artisan config:cache
echo OK
