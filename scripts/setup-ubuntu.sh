#!/bin/bash

# JW Player Video Extractor - Ubuntu Setup Script
# This script sets up the server with all required dependencies

set -e

echo "🚀 Setting up JW Player Video Extractor on Ubuntu"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2 process manager..."
sudo npm install -g pm2

# Install Chromium for Puppeteer
echo "📦 Installing Chromium browser..."
sudo apt-get install -y chromium-browser

# Install build tools (for native dependencies)
echo "📦 Installing build tools..."
sudo apt-get install -y build-essential

# Install additional dependencies for Puppeteer
echo "📦 Installing additional dependencies..."
sudo apt-get install -y \
  gconf-service \
  libasound2-dev \
  libatk1.0-dev \
  libc6-dev \
  libcairo2-dev \
  libcups2-dev \
  libdbus-1-dev \
  libexpat1-dev \
  libfontconfig1-dev \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-dev \
  libglib2.0-dev \
  libgtk-3-dev \
  libnspr4-dev \
  libpango-1.0-dev \
  libpangocairo-1.0-dev \
  libstdc++6 \
  libx11-dev \
  libx11-xcb1 \
  libxcb1-dev \
  libxcomposite-dev \
  libxcursor-dev \
  libxdamage-dev \
  libxext-dev \
  libxfixes-dev \
  libxi-dev \
  libxrandr-dev \
  libxrender-dev \
  libxss-dev \
  libxtst-dev \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/jwplayer-extractor
sudo chown -R $USER:$USER /var/www/jwplayer-extractor

# Create logs directory
echo "📁 Creating logs directory..."
sudo mkdir -p /var/log/jwplayer-extractor
sudo chown -R $USER:$USER /var/log/jwplayer-extractor

# Configure firewall (optional)
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Display versions
echo "✅ Setup completed!"
echo "📋 Installed versions:"
echo "  Node.js: $(node --version)"
echo "  NPM: $(npm --version)"
echo "  PM2: $(pm2 --version)"
echo "  Chromium: $(chromium-browser --version 2>/dev/null || echo 'Not found')"

echo ""
echo "🎯 Next steps:"
echo "  1. Clone your repository: git clone <your-repo-url> /var/www/jwplayer-extractor"
echo "  2. Navigate to directory: cd /var/www/jwplayer-extractor"
echo "  3. Install dependencies: npm install"
echo "  4. Copy environment file: cp env.example .env"
echo "  5. Edit .env file with your settings"
echo "  6. Start application: npm run pm2:start"
echo ""
echo "🌐 Your application will be available at http://your-server-ip:3000"