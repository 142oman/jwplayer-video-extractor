# 🚀 JW Player Video Extractor - Ubuntu Deployment Guide

Complete guide to deploy the JW Player Video Extractor on Ubuntu Linux.

## 📁 Repository Information

- **GitHub Repository**: https://github.com/142oman/jwplayer-video-extractor
- **Latest Release**: Check the repository for the latest stable version
- **Documentation**: See [README.md](README.md) and [API.md](API.md) for details

## Prerequisites

- Ubuntu 18.04+ server
- Root or sudo access
- Git installed
- Internet connection

## Quick Deployment

### 1. Server Setup
```bash
# SSH into your Ubuntu server
ssh user@your-server-ip

# Run the automated setup script
curl -fsSL https://raw.githubusercontent.com/142oman/jwplayer-video-extractor/refs/heads/master/scripts/setup-ubuntu.sh | bash
```

### 2. Clone and Deploy
```bash
# Clone your repository
cd /var/www
git clone https://github.com/142oman/jwplayer-video-extractor.git
cd jwplayer-video-extractor

# Install dependencies and deploy
npm install
npm run deploy:ubuntu
```

## Manual Installation

### Step 1: Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Chromium for Puppeteer
sudo apt-get install -y chromium-browser

# Install additional dependencies
sudo apt-get install -y \
  build-essential \
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
```

### Step 2: Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/jwplayer-extractor
sudo chown -R $USER:$USER /var/www/jwplayer-extractor

# Clone repository
cd /var/www/jwplayer-extractor
git clone https://github.com/142oman/jwplayer-video-extractor.git .
```

### Step 3: Configure Environment

```bash
# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

Edit the `.env` file with your production settings:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Application Settings
APP_NAME=JW Player Video Extractor
APP_VERSION=2.0.0

# Puppeteer Settings
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# CORS Settings
CORS_ORIGIN=https://yourdomain.com
```

### Step 4: Install Dependencies and Deploy

```bash
# Install Node.js dependencies
npm install

# Start application with PM2
npm run pm2:start
```

### Step 5: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Check status
sudo ufw status
```

## PM2 Management

### Useful PM2 Commands

```bash
# Check status
pm2 list

# View logs
pm2 logs jwplayer-extractor

# Monitor application
pm2 monit

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop

# Reload without downtime
pm2 reload ecosystem.config.js
```

### Enable PM2 Auto-startup

```bash
# Generate startup script
sudo pm2 startup

# Save current processes
pm2 save
```

## Nginx Reverse Proxy (Optional)

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/jwplayer-extractor
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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
        proxy_read_timeout 86400;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/jwplayer-extractor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test renewal
sudo certbot renew --dry-run
```

## Monitoring and Logs

### Log Files

```bash
# Application logs
/var/log/jwplayer-extractor/

# PM2 logs
~/.pm2/logs/

# Nginx logs
/var/log/nginx/
```

### System Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check application logs
pm2 logs jwplayer-extractor --lines 100
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Puppeteer Chromium issues**
   ```bash
   # Ensure Chromium is installed
   which chromium-browser
   chromium-browser --version

   # Check Puppeteer configuration in .env
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   ```

3. **Memory issues**
   ```bash
   # Check memory usage
   pm2 monit

   # Restart with more memory
   pm2 restart ecosystem.config.js --max-memory-restart 1G
   ```

4. **Permission issues**
   ```bash
   sudo chown -R $USER:$USER /var/www/jwplayer-extractor
   sudo chown -R $USER:$USER /var/log/jwplayer-extractor
   ```

### Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Check API info
curl http://localhost:3000/api/info

# Test video extraction
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/video-page"}'
```

## Backup and Updates

### Backup Application

```bash
# Create backup directory
mkdir -p ~/backups

# Backup application
tar -czf ~/backups/jwplayer-extractor-$(date +%Y%m%d-%H%M%S).tar.gz /var/www/jwplayer-extractor

# Backup PM2 processes
pm2 save
pm2 startup
```

### Update Application

```bash
cd /var/www/jwplayer-extractor

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart application
npm run pm2:restart
```

## Security Best Practices

1. **Keep system updated**: `sudo apt update && sudo apt upgrade`
2. **Use strong passwords** and SSH keys
3. **Configure firewall**: `sudo ufw enable`
4. **Use SSL/TLS** certificates
5. **Regular backups**
6. **Monitor logs** for suspicious activity
7. **Limit exposed ports** to necessary services only

## Support

- Check application logs: `pm2 logs jwplayer-extractor`
- Check system logs: `sudo journalctl -u pm2-user`
- Health check: `curl http://localhost:3000/health`

For issues, check the logs and ensure all dependencies are properly installed.