module.exports = {
  apps: [{
    name: 'jwplayer-extractor',
    script: 'server.js',
    instances: process.env.NODE_ENV === 'production' ? 2 : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.git',
      '*.log'
    ],
    env: {
      'NODE_ENV': 'development',
      'PORT': 3000,
      'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD': 'false'
    },
    env_production: {
      'NODE_ENV': 'production',
      'PORT': 3000,
      'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD': 'false'
    }
  }]
};