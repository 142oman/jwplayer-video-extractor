#!/usr/bin/env node

/**
 * JW Player Video Extractor API Example
 * Usage: node api-example.js [url]
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JW-Player-Extractor-Example/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function getAPIInfo() {
  console.log('🔍 Getting API information...\n');
  try {
    const response = await makeRequest('/api/info');
    console.log('✅ API Info:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Failed to get API info:', error.message);
  }
}

async function extractVideos(url) {
  console.log(`🎬 Extracting videos from: ${url}\n`);
  try {
    const response = await makeRequest('/api/extract', 'POST', { url });

    if (response.data.success) {
      const { data } = response.data;
      console.log(`✅ Successfully extracted ${data.totalSources} video sources\n`);

      data.sources.forEach((sourceGroup, index) => {
        console.log(`${index + 1}. ${sourceGroup.type}`);
        sourceGroup.videos.forEach((video, videoIndex) => {
          console.log(`   ${videoIndex + 1}. [${video.quality}] ${video.url}`);
        });
        console.log('');
      });

      // Show example of how to get the best quality video
      const bestVideo = findBestVideo(data.sources);
      if (bestVideo) {
        console.log('🎯 Best quality video found:');
        console.log(`   Quality: ${bestVideo.quality}`);
        console.log(`   URL: ${bestVideo.url}`);
        console.log(`   Type: ${bestVideo.type}`);
      }

    } else {
      console.error('❌ Extraction failed:', response.data.error.message);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

function findBestVideo(sources) {
  const qualityOrder = ['1080p', '720p', '480p', '360p', '240p', '144p'];

  let bestVideo = null;
  let bestQualityIndex = -1;

  sources.forEach(sourceGroup => {
    sourceGroup.videos.forEach(video => {
      const qualityIndex = qualityOrder.indexOf(video.quality);
      if (qualityIndex > bestQualityIndex && video.type.includes('mpegurl')) {
        bestVideo = video;
        bestQualityIndex = qualityIndex;
      }
    });
  });

  return bestVideo;
}

// Main execution
async function main() {
  const url = process.argv[2];

  console.log('🚀 JW Player Video Extractor API Example\n');

  await getAPIInfo();

  if (url) {
    console.log('─'.repeat(50));
    await extractVideos(url);
  } else {
    console.log('💡 Usage: node api-example.js <url>');
    console.log('📝 Example: node api-example.js https://bysezejataos.com/e/jix4qzh7w8ss/\n');

    // Show example with the demo URL
    console.log('🎬 Running example with demo URL...');
    console.log('─'.repeat(50));
    await extractVideos('https://bysezejataos.com/e/jix4qzh7w8ss/');
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeRequest, findBestVideo };