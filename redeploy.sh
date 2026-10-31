#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Gruwcer — Quick Redeploy (run after git push)
#  Usage: bash redeploy.sh
# ═══════════════════════════════════════════════════════════

set -e
APP_DIR="/var/www/gruwcer"

echo "→ Pulling latest code..."
cd "$APP_DIR"
git pull origin main

echo "→ Installing packages..."
npm ci --production=false

echo "→ Syncing Prisma schema to DB..."
npx prisma generate
npx prisma db push --accept-data-loss

echo "→ Building..."
npm run build

echo "→ Restarting PM2..."
pm2 restart gruwcer

echo "✅ Redeployed at $(date)"
pm2 status gruwcer
