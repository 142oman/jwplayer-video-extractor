#!/bin/bash

# JW Player Video Extractor - Ubuntu Deployment Script
# This script deploys the application to the Ubuntu server

set -e

echo "🚀 Deploying JW Player Video Extractor to Ubuntu"

# Check if we're in the project directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your production settings"
fi

# Build application (if needed)
echo "🔨 Building application..."
npm run build

# Stop existing application
echo "🛑 Stopping existing application..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start application with PM2
echo "▶️  Starting application..."
npm run pm2:start

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 5

# Check if application is running
if pm2 list | grep -q "jwplayer-extractor"; then
    echo "✅ Application started successfully!"
    echo "📊 PM2 Status:"
    pm2 list
    echo ""
    echo "📋 Useful commands:"
    echo "  Check logs: pm2 logs jwplayer-extractor"
    echo "  Monitor: pm2 monit"
    echo "  Restart: npm run pm2:restart"
    echo "  Stop: npm run pm2:stop"
    echo ""
    echo "🌐 Application should be available at:"
    echo "  Web Interface: http://localhost:3000"
    echo "  API: http://localhost:3000/api"
    echo "  Health Check: http://localhost:3000/health"
else
    echo "❌ Failed to start application. Check logs for errors."
    pm2 logs jwplayer-extractor --lines 20
    exit 1
fi

# Setup PM2 startup (optional)
echo "🔄 Setting up PM2 startup (run as root if needed)..."
sudo pm2 startup 2>/dev/null || echo "⚠️  Run 'sudo pm2 startup' as root to enable auto-startup"

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "🎉 Deployment completed successfully!"
echo "📝 Don't forget to:"
echo "  - Configure your firewall/reverse proxy (nginx/apache)"
echo "  - Set up SSL certificates if needed"
echo "  - Configure log rotation"
echo "  - Set up monitoring and alerts"