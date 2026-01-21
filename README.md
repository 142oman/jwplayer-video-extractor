# JW Player Video Source Extractor

A Node.js web application that extracts video sources from JW Player embedded pages using Puppeteer for browser automation and network request interception.

## Features

- **Automatic Detection**: Uses network request interception to capture video URLs
- **Multiple Source Types**: Supports MP4, HLS (M3U8), and other video formats
- **Web Interface**: Clean, responsive HTML interface for easy URL input
- **Copy to Clipboard**: One-click copying of video URLs
- **Built-in Video Player**: Play extracted videos directly in the browser using Video.js
- **Real-time Results**: Displays extracted sources immediately

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Enter the URL of a page containing a JW Player and click "Extract Video Sources"

4. The application will analyze the page and display any found video sources

5. Click "Play Video" next to any HLS or MP4 source to watch it directly in the built-in player

## How It Works

The application uses Puppeteer to:

1. **Load the webpage** with a headless browser
2. **Intercept network requests** to capture video file URLs (MP4, M3U8, etc.)
3. **Analyze page content** for JW Player configurations and video elements
4. **Extract and display** all found video sources

## API Usage

The application provides both a web interface and a REST API for video extraction.

### REST API Endpoints

#### POST `/api/extract`
Extract video sources from a JW Player page.

**Request:**
```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://bysezejataos.com/e/jix4qzh7w8ss/"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://bysezejataos.com/e/jix4qzh7w8ss/",
    "extractedAt": "2024-01-21T12:00:00.000Z",
    "sources": [
      {
        "type": "Network Captured URLs",
        "videos": [
          {
            "url": "https://fin-3dg-b1.r66nv9ed.com/hls2/.../master.m3u8",
            "type": "application/vnd.apple.mpegurl",
            "label": "Status: 200",
            "quality": "Master Playlist"
          }
        ]
      }
    ],
    "totalSources": 6
  }
}
```

#### GET `/api/info`
Get API information and capabilities.

**Request:**
```bash
curl http://localhost:3000/api/info
```

### Legacy API (still supported)
```bash
curl -X POST http://localhost:3000/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/video-page"}'
```

See [API.md](API.md) for complete API documentation and code examples.

### Example Usage
Run the included example script to test the API:

```bash
# Run example with demo URL
npm run example

# Or run with your own URL
node examples/api-example.js "https://your-jwplayer-page.com"
```

## Example Output

For the URL `https://bysezejataos.com/e/jix4qzh7w8ss/`, the application successfully extracted:

- Master playlist: `https://fin-3dg-b1.r66nv9ed.com/hls2/06/10002/,jix4qzh7w8ss_x,lang/eng/jix4qzh7w8ss_eng,.urlset/master.m3u8`
- Video segment: `https://fin-3dg-b1.r66nv9ed.com/hls2/06/10002/jix4qzh7w8ss_x/index-v1-a2.m3u8`

## Environment Configuration

Create a `.env` file from the provided template:

```bash
cp env.example .env
```

**Important for Ubuntu deployment:**
```bash
# Puppeteer Configuration (using bundled Chromium - recommended for Ubuntu 24.04+)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Additional server optimization args
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-gpu,--disable-software-rasterizer,--disable-background-timer-throttling,--disable-backgrounding-occluded-windows,--disable-renderer-backgrounding,--disable-features=TranslateUI,--disable-ipc-flooding-protection
```

**Note:** For Ubuntu 24.04+, we use Puppeteer's bundled Chromium (no system Chromium needed):
- ✅ No Snap-related issues
- ✅ No DBus/dconf errors
- ✅ Better stability on servers
- ✅ Automatic Chromium management

## Technologies Used

- **Node.js** - Server runtime
- **Express.js** - Web framework with REST API
- **Puppeteer** - Browser automation for video extraction
- **Video.js** - HLS video player for direct streaming
- **HTML/CSS/JavaScript** - Frontend interface and API client

## Requirements

- Node.js 14+
- NPM for package management

## License

MIT License