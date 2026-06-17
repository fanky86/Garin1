#!/bin/bash
# Production deployment script untuk garin.fankynas.cloud

echo "🏗️  Building React frontend..."
cd client
REACT_APP_API_URL=https://garin.fankynas.cloud npm run build
cd ..

echo "✅ Build complete!"
echo ""
echo "📋 Starting server with PM2 (recommended for production)..."

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    pm2 stop tiktok-clone 2>/dev/null || true
    pm2 delete tiktok-clone 2>/dev/null || true
    cd server
    pm2 start index.js --name tiktok-clone
    pm2 save
    pm2 startup
    echo "✅ Server started with PM2!"
    echo "📊 Monitor: pm2 monit"
    echo "📜 Logs: pm2 logs tiktok-clone"
else
    echo "PM2 not found. Starting with node..."
    echo "💡 Install PM2 for production: npm install -g pm2"
    cd server
    node index.js
fi
