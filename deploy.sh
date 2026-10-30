#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Gruwcer — VPS Deploy Script
#  Server: 169.58.148.248 (Ubuntu + nginx/1.24.0)
#  Run this ON the VPS after SSH-ing in
# ═══════════════════════════════════════════════════════════

set -e

APP_DIR="/var/www/gruwcer"
REPO="https://github.com/mojadollc/gruwcer.git"
NODE_VERSION="20"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Gruwcer Deploy Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Install dependencies if missing ──────────────────────
echo "[1/8] Checking system dependencies..."

if ! command -v node &> /dev/null; then
  echo "  → Installing Node.js $NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
  echo "  → Installing PM2..."
  sudo npm install -g pm2
fi

if ! command -v git &> /dev/null; then
  echo "  → Installing git..."
  sudo apt-get install -y git
fi

echo "  ✓ Node $(node -v) | npm $(npm -v) | PM2 $(pm2 -v)"

# ── 2. Clone or pull latest code ────────────────────────────
echo "[2/8] Pulling latest code..."

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  sudo mkdir -p "$APP_DIR"
  sudo chown $USER:$USER "$APP_DIR"
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "  ✓ Code up to date"

# ── 3. Write .env ────────────────────────────────────────────
echo "[3/8] Writing .env..."

cat > "$APP_DIR/.env" << 'EOF'
DATABASE_URL="postgresql://gruwcer_user:Gruwcer@2025@localhost:5432/gruwcer"
JWT_SECRET="change_this_to_a_long_random_secret_string"
NEXT_PUBLIC_STORE_ID="8807"
XENDIT_SECRET_KEY=""
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=""
XENDIT_WEBHOOK_TOKEN=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
EOF

echo "  ✓ .env written (edit JWT_SECRET and keys after deploy)"

# ── 4. Setup PostgreSQL ──────────────────────────────────────
echo "[4/8] Setting up PostgreSQL..."

if ! command -v psql &> /dev/null; then
  echo "  → Installing PostgreSQL..."
  sudo apt-get install -y postgresql postgresql-contrib
fi

sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create DB user and database if they don't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'gruwcer_user'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER gruwcer_user WITH PASSWORD 'Gruwcer@2025';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'gruwcer'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE gruwcer OWNER gruwcer_user;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE gruwcer TO gruwcer_user;"

echo "  ✓ PostgreSQL ready (gruwcer_user @ localhost:5432/gruwcer)"

# ── 5. Install npm packages ──────────────────────────────────
echo "[5/8] Installing npm packages..."
cd "$APP_DIR"
npm ci --production=false
echo "  ✓ Packages installed"

# ── 6. Run Prisma migrations ─────────────────────────────────
echo "[6/8] Running Prisma migrations..."
cd "$APP_DIR"
npx prisma generate
npx prisma db push --accept-data-loss
echo "  ✓ Database schema pushed"

# ── 7. Build Next.js ─────────────────────────────────────────
echo "[7/8] Building Next.js app..."
cd "$APP_DIR"
npm run build
echo "  ✓ Build complete"

# ── 8. Start / restart with PM2 ─────────────────────────────
echo "[8/8] Starting app with PM2..."
cd "$APP_DIR"

pm2 delete gruwcer 2>/dev/null || true
pm2 start npm --name gruwcer -- start -- -p 3000
pm2 save
pm2 startup | tail -1 | sudo bash || true

echo "  ✓ App running on port 3000"

# ── Configure nginx ──────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Configuring nginx..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sudo tee /etc/nginx/sites-available/gruwcer > /dev/null << 'NGINX'
server {
    listen 80;
    server_name 169.58.148.248 gruwcer.com www.gruwcer.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Next.js static files — long cache
    location /_next/static/ {
        alias /var/www/gruwcer/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Public folder
    location /public/ {
        alias /var/www/gruwcer/public/;
        expires 7d;
    }

    # Proxy everything else to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINX

# Enable site
sudo ln -sf /etc/nginx/sites-available/gruwcer /etc/nginx/sites-enabled/gruwcer
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ DEPLOY COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  URL:      http://169.58.148.248"
echo "  PM2:      pm2 status"
echo "  Logs:     pm2 logs gruwcer"
echo "  Restart:  pm2 restart gruwcer"
echo ""
echo "  ⚠  Next steps:"
echo "  1. Edit JWT_SECRET in $APP_DIR/.env"
echo "  2. Add your Xendit / Firebase keys to .env"
echo "  3. Point your domain DNS to 169.58.148.248"
echo "  4. Run: sudo certbot --nginx  (for HTTPS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
