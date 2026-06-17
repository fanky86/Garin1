#!/bin/bash

echo "🚀 Setting up TikTok Clone..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v) found"
echo ""

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Bootstrap server .env if not present
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Dibuat server/.env dari template. Edit file ini untuk isi JWT_SECRET, SMTP, dan GOOGLE_CLIENT_ID."
fi
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  WAJIB: Edit server/.env sebelum jalan production:"
echo "   - JWT_SECRET (ganti dengan string acak)"
echo "   - SMTP_*     (untuk kirim kode OTP via email — opsional, ada fallback dev mode)"
echo "   - GOOGLE_CLIENT_ID (untuk Login Google — opsional)"
echo "   Kalau pakai GOOGLE_CLIENT_ID, isi juga REACT_APP_GOOGLE_CLIENT_ID yang SAMA"
echo "   di client/.env.development dan client/.env.production"
echo ""
echo "👉 Jalankan server:"
echo "   cd server && npm start"
echo ""
echo "👉 Jalankan client (development):"
echo "   cd client && npm start"
echo ""
echo "👉 Build untuk production (deploy ke garin.fankynas.cloud):"
echo "   cd client && npm run build"
echo "   Lalu jalankan server (otomatis serve hasil build React)"
echo ""
echo "🌐 Server: http://localhost:5017"
echo "🌐 Client (dev): http://localhost:3000"
echo "🌐 Production: https://garin.fankynas.cloud"
