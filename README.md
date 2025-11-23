# Online Image Compressor MCP Server

An MCP (Model Context Protocol) server designed to take in an online image, and use Sharp to compress it, resize it, and convert it to the user's desired specs.

## Features

- **Image Download**: Downloads images from any accessible URL
- **Image Processing**: Uses Sharp for high-performance image transformations
- **Resize**: Resize images with various fit modes (cover, contain, fill, inside, outside)
- **Compression**: Adjust quality settings with progressive and optimization options
- **Format Conversion**: Convert between JPEG, PNG, WebP, AVIF, and TIFF formats
- **HTTP Serving**: Temporarily serves processed images via HTTP endpoints
- **Automatic Cleanup**: Automatically cleans up temporary files after use

## Installation

```bash
npm install
npm run build
```

## Usage

### As an MCP Server

Start the server:

```bash
npm start
```

The server will start on stdio and can be connected to by MCP clients.

### Development Mode

For development with auto-reload:

```bash
npm run dev
```

## Available Tools

### `process_image`

Processes an image from a URL according to the specified transformations.

**Parameters:**

- `imageUrl` (string, required): URL of the image to process
- `specs` (object, required): Processing specifications
  - `resize` (object, optional): Resize specifications
    - `width` (integer): Target width in pixels (1-10000)
    - `height` (integer): Target height in pixels (1-10000)
    - `fit` (string): How to fit the image ('cover', 'contain', 'fill', 'inside', 'outside')
  - `compression` (object, optional): Compression specifications
    - `quality` (integer): Image quality 1-100 (default: 80)
    - `progressive` (boolean): Use progressive encoding (default: false)
    - `optimizeScans` (boolean): Optimize Huffman tables (default: false)
  - `conversion` (object, required): Format conversion
    - `format` (string): Target format ('jpeg', 'png', 'webp', 'avif', 'tiff')

**Example:**

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "specs": {
    "resize": {
      "width": 800,
      "height": 600,
      "fit": "cover"
    },
    "compression": {
      "quality": 85,
      "progressive": true
    },
    "conversion": {
      "format": "webp"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "processedImageUrl": "http://localhost:3001/image/uuid-here"
}
```

## Architecture

1. **Image Download**: Downloads image from provided URL to temporary storage
2. **Sharp Processing**: Applies resize, compression, and conversion transformations
3. **HTTP Serving**: Serves processed images via Express server on `/image/{uuid}` endpoints
4. **Cleanup**: Automatically removes temporary files after serving

## Configuration

The HTTP server runs on port 3001 by default. This can be configured by modifying the `HTTPServer` constructor in `src/index.ts`.

## File Structure

```
src/
├── index.ts              # Main MCP server entry point
├── types.ts              # TypeScript type definitions
├── httpServer.ts         # Express HTTP server for serving images
├── tools/
│   └── imageTools.ts     # MCP tool implementations
└── utils/
    ├── imageDownloader.ts # Image download utilities
    ├── imageProcessor.ts  # Sharp image processing
    └── cleanup.ts         # File cleanup utilities
```

## Requirements

- Node.js 20+
- Sharp (automatically handles native dependencies)

## License

ISC
