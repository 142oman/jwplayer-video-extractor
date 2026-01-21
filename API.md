# JW Player Video Source Extractor API

A clean REST API for extracting video sources from JW Player embedded pages.

## Base URL
```
http://localhost:3000/api
```

## Authentication
No authentication required for public use.

## Endpoints

### GET /api/info
Get API information and capabilities.

**Response:**
```json
{
  "name": "JW Player Video Source Extractor API",
  "version": "2.0.0",
  "description": "Extract video sources from JW Player embedded pages",
  "endpoints": {
    "POST /api/extract": "Extract video sources from a JW Player page",
    "GET /api/info": "Get API information"
  },
  "supportedFormats": ["HLS (M3U8)", "MP4", "MPEG-TS"],
  "author": "VideoFlex API"
}
```

### POST /api/extract
Extract video sources from a JW Player page.

**Request Body:**
```json
{
  "url": "https://example.com/video-page"
}
```

**Parameters:**
- `url` (required): The URL of the page containing the JW Player

**Response (Success):**
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
            "url": "https://fin-3dg-b1.r66nv9ed.com/hls2/06/10002/,jix4qzh7w8ss_x,lang/eng/jix4qzh7w8ss_eng,.urlset/master.m3u8?t=...",
            "type": "application/vnd.apple.mpegurl",
            "label": "Status: 200",
            "quality": "Master Playlist"
          },
          {
            "url": "https://fin-3dg-b1.r66nv9ed.com/hls2/06/10002/jix4qzh7w8ss_x/index-v1-a2.m3u8?t=...",
            "type": "application/vnd.apple.mpegurl",
            "label": "Status: 200",
            "quality": "Video Segment"
          }
        ]
      }
    ],
    "totalSources": 6
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_URL",
    "message": "URL parameter is required"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_URL` | URL parameter is missing from request |
| `INVALID_URL` | URL format is invalid |
| `EXTRACTION_FAILED` | Failed to extract video sources from the page |

## Usage Examples

### cURL
```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://bysezejataos.com/e/jix4qzh7w8ss/"}'
```

### JavaScript (Fetch)
```javascript
fetch('http://localhost:3000/api/extract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://bysezejataos.com/e/jix4qzh7w8ss/'
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Found', data.data.totalSources, 'video sources');
    data.data.sources.forEach(source => {
      console.log(source.type + ':', source.videos.length, 'videos');
    });
  } else {
    console.error('Error:', data.error.message);
  }
});
```

### Python (requests)
```python
import requests

response = requests.post('http://localhost:3000/api/extract', json={
    'url': 'https://bysezejataos.com/e/jix4qzh7w8ss/'
})

data = response.json()
if data['success']:
    print(f"Found {data['data']['totalSources']} video sources")
    for source in data['data']['sources']:
        print(f"{source['type']}: {len(source['videos'])} videos")
        for video in source['videos']:
            print(f"  - {video['quality']}: {video['url']}")
else:
    print(f"Error: {data['error']['message']}")
```

## Supported Video Formats

- **HLS (M3U8)**: HTTP Live Streaming playlists
- **MP4**: Direct video files
- **MPEG-TS**: Transport stream segments

## Quality Detection

The API automatically detects video quality from labels:

- `Master Playlist`: Main HLS playlist with multiple qualities
- `1080p/720p/480p/etc.`: Video resolution
- `Audio`: Audio-only streams
- `Video Segment`: Individual video segments

## Rate Limiting

Currently no rate limiting is implemented. Use responsibly.

## CORS

CORS headers are enabled for all `/api/*` endpoints, allowing cross-origin requests from web applications.

## Backward Compatibility

The legacy `/extract` endpoint is still available for existing integrations, but `/api/extract` is recommended for new implementations.