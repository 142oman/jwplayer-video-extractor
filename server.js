require('dotenv').config();

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'JW Player Video Extractor';
const APP_VERSION = process.env.APP_VERSION || '2.0.0';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper function to extract quality information from labels
function extractQualityFromLabel(label) {
  if (!label) return 'Unknown';

  const qualityPatterns = [
    { pattern: /1080p|fullhd|fhd/i, quality: '1080p' },
    { pattern: /720p|hd/i, quality: '720p' },
    { pattern: /480p|sd/i, quality: '480p' },
    { pattern: /360p/i, quality: '360p' },
    { pattern: /240p/i, quality: '240p' },
    { pattern: /144p/i, quality: '144p' },
    { pattern: /master|playlist/i, quality: 'Master Playlist' },
    { pattern: /audio|eng|english/i, quality: 'Audio' }
  ];

  for (const { pattern, quality } of qualityPatterns) {
    if (pattern.test(label)) {
      return quality;
    }
  }

  return label.includes('Status:') ? 'Video Segment' : 'Unknown';
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Function to extract JW Player video sources
async function extractJWPlayerSources(url) {
  let browser;
  try {
    // Build Puppeteer arguments for server environment
    let puppeteerArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ];

    // Add custom args from environment if specified
    if (process.env.PUPPETEER_ARGS) {
      const customArgs = process.env.PUPPETEER_ARGS.split(',').map(arg => arg.trim());
      puppeteerArgs = puppeteerArgs.concat(customArgs);
    }

    // Use Puppeteer's bundled Chromium (recommended for Ubuntu 24.04+)
    browser = await puppeteer.launch({
      headless: 'new',
      args: puppeteerArgs
    });

    const page = await browser.newPage();
    const videoUrls = [];

    // Intercept network requests to capture video URLs
    page.on('response', response => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      // Capture video files and m3u8 playlists
      if (url.includes('.mp4') || url.includes('.m3u8') || url.includes('.m3u') ||
          contentType.includes('video/') || contentType.includes('application/vnd.apple.mpegurl')) {
        videoUrls.push({
          url: url,
          type: contentType,
          status: response.status()
        });
      }

      // Also check for JSON responses that might contain video data
      if (contentType.includes('application/json') && (url.includes('video') || url.includes('stream') || url.includes('player'))) {
        response.json().then(data => {
          // Look for video URLs in JSON responses
          const extractUrls = (obj) => {
            if (typeof obj === 'string' && (obj.includes('.mp4') || obj.includes('.m3u8'))) {
              videoUrls.push({
                url: obj,
                type: 'video/mp4',
                status: 200,
                source: 'JSON response'
              });
            } else if (typeof obj === 'object' && obj !== null) {
              Object.values(obj).forEach(extractUrls);
            }
          };
          extractUrls(data);
        }).catch(() => {});
      }
    });

    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content to load (using Promise instead of deprecated waitForTimeout)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // First, let's log what we find on the page for debugging
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasJWPlayer: !!window.jwplayer,
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || s.textContent.substring(0, 200)).filter(Boolean),
        videos: Array.from(document.querySelectorAll('video')).map(v => ({ src: v.src, type: v.type })),
        iframes: Array.from(document.querySelectorAll('iframe')).map(i => i.src),
        allText: document.body ? document.body.textContent.substring(0, 1000) : ''
      };
    });

    console.log('Page analysis:', JSON.stringify(pageContent, null, 2));

    // Wait for content to load (using Promise instead of deprecated waitForTimeout)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract JW Player configuration
    const jwPlayerData = await page.evaluate(() => {
      const results = [];

      // Look for JW Player instances
      const jwPlayers = document.querySelectorAll('[id*="jwplayer"], .jwplayer, [class*="jw-player"]');

      // Check for JW Player configuration in window object
      if (window.jwplayer) {
        try {
          const players = window.jwplayer();
          if (Array.isArray(players)) {
            players.forEach(player => {
              if (player.getPlaylist) {
                const playlist = player.getPlaylist();
                if (playlist && playlist.length > 0) {
                  playlist.forEach(item => {
                    if (item.sources && item.sources.length > 0) {
                      results.push({
                        title: item.title || 'Untitled',
                        sources: item.sources
                      });
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.log('Error extracting from jwplayer():', e.message);
        }
      }

      // Look for JW Player configuration in script tags
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const content = script.textContent || script.innerHTML;
        if (content.includes('jwplayer') || content.includes('setup')) {
          // Try to extract configuration objects
          const setupMatches = content.match(/jwplayer\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\.setup\s*\(\s*(\{[\s\S]*?\})\s*\)/g);
          if (setupMatches) {
            setupMatches.forEach(match => {
              try {
                const configMatch = match.match(/\.setup\s*\(\s*(\{[\s\S]*?\})\s*\)/);
                if (configMatch) {
                  const configStr = configMatch[1];
                  const config = JSON.parse(configStr.replace(/'/g, '"').replace(/,(\s*[}\]])/g, '$1'));
                  if (config.playlist && config.playlist.length > 0) {
                    results.push({
                      title: 'Configuration Found',
                      sources: config.playlist.flatMap(item =>
                        item.sources ? item.sources : [item]
                      )
                    });
                  } else if (config.sources && config.sources.length > 0) {
                    results.push({
                      title: 'Direct Sources',
                      sources: config.sources
                    });
                  }
                }
              } catch (e) {
                console.log('Parse error:', e.message);
              }
            });
          }

          // Look for jwplayer setup calls with string IDs
          const simpleSetup = content.match(/jwplayer\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\.setup\s*\(\s*(\{[\s\S]*?\})\s*\)/);
          if (simpleSetup) {
            try {
              const configStr = simpleSetup[2];
              const config = JSON.parse(configStr.replace(/'/g, '"').replace(/,(\s*[}\]])/g, '$1'));
              if (config.sources && config.sources.length > 0) {
                results.push({
                  title: 'Simple Setup Sources',
                  sources: config.sources
                });
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      });

      // Look for video elements that might be JW Player sources
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        if (video.src) {
          results.push({
            title: 'Video Element',
            sources: [{ file: video.src, type: video.type || 'video/mp4' }]
          });
        }
      });

      // Look for source elements within video tags
      const sourceElements = document.querySelectorAll('video source');
      if (sourceElements.length > 0) {
        const sources = Array.from(sourceElements).map(source => ({
          file: source.src,
          type: source.type || 'video/mp4',
          label: source.getAttribute('label') || 'Source'
        }));
        results.push({
          title: 'Video Sources',
          sources: sources
        });
      }

      // Look for data attributes that might contain video URLs
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        const attributes = element.attributes;
        for (let i = 0; i < attributes.length; i++) {
          const attr = attributes[i];
          if (attr.name.includes('video') || attr.name.includes('src') || attr.name.includes('source')) {
            if (attr.value && (attr.value.includes('.mp4') || attr.value.includes('.m3u8') || attr.value.includes('stream'))) {
              results.push({
                title: `Data Attribute: ${attr.name}`,
                sources: [{ file: attr.value, type: 'video/mp4' }]
              });
            }
          }
        }
      });

      return results;
    });

    // Add network-captured URLs to results
    if (videoUrls.length > 0) {
      jwPlayerData.push({
        title: 'Network Captured URLs',
        sources: videoUrls.map(v => ({
          file: v.url,
          type: v.type || 'video/mp4',
          label: `Status: ${v.status}${v.source ? ` (${v.source})` : ''}`
        }))
      });
    }

    return jwPlayerData;

  } catch (error) {
    console.error('Error extracting JW Player sources:', error);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Middleware for API requests
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Legacy endpoint (keeping for backward compatibility)
app.post('/extract', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const sources = await extractJWPlayerSources(url);
    res.json({ success: true, data: sources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enhanced API endpoints
app.post('/api/extract', async (req, res) => {
  try {
    // Validate request
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_URL',
          message: 'URL parameter is required'
        }
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Invalid URL format'
        }
      });
    }

    // Extract video sources
    const sources = await extractJWPlayerSources(url);

    // Format response
    const response = {
      success: true,
      data: {
        url: url,
        extractedAt: new Date().toISOString(),
        sources: sources.map(sourceGroup => ({
          type: sourceGroup.title,
          videos: sourceGroup.sources.map(video => ({
            url: video.file || video.src || video,
            type: video.type || 'video/mp4',
            label: video.label || 'Video Source',
            quality: extractQualityFromLabel(video.label)
          }))
        })),
        totalSources: sources.reduce((total, group) => total + group.sources.length, 0)
      }
    };

    res.json(response);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXTRACTION_FAILED',
        message: 'Failed to extract video sources',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

// Get API information
app.get('/api/info', (req, res) => {
  res.json({
    name: APP_NAME,
    version: APP_VERSION,
    environment: NODE_ENV,
    description: 'Extract video sources from JW Player embedded pages',
    endpoints: {
      'POST /api/extract': 'Extract video sources from a JW Player page',
      'GET /api/info': 'Get API information',
      'GET /health': 'Health check endpoint'
    },
    supportedFormats: ['HLS (M3U8)', 'MP4', 'MPEG-TS'],
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: APP_VERSION
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});