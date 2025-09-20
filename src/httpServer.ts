import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import * as fs from 'fs/promises';
import { cleanupFile } from './utils/cleanup';

export class HTTPServer {
  private app: express.Application;
  private server: any;
  private port: number;
  private processedImages: Map<string, string> = new Map();

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: true,
      credentials: true
    }));
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Serve processed images
    this.app.get('/image/:uuid', async (req, res) => {
      try {
        const { uuid } = req.params;
        const filePath = this.processedImages.get(uuid);

        if (!filePath) {
          return res.status(404).json({ error: 'Image not found' });
        }

        // Check if file exists
        try {
          await fs.access(filePath);
        } catch {
          this.processedImages.delete(uuid); // Clean up stale reference
          return res.status(404).json({ error: 'Image file not found' });
        }

        // Determine content type from file extension
        const ext = path.extname(filePath).toLowerCase();
        const contentTypeMap: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.avif': 'image/avif',
          '.tiff': 'image/tiff',
        };

        const contentType = contentTypeMap[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        // Stream the file
        res.sendFile(path.resolve(filePath));

        // Schedule cleanup after serving
        setTimeout(() => {
          this.removeProcessedImage(uuid);
        }, 3600000); // Clean up after 1 hour

      } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // List all available images (for debugging)
    this.app.get('/images', (req, res) => {
      const imageList = Array.from(this.processedImages.keys());
      res.json({ images: imageList, count: imageList.length });
    });
  }

  public addProcessedImage(uuid: string, filePath: string): void {
    this.processedImages.set(uuid, filePath);
  }

  public removeProcessedImage(uuid: string): void {
    const filePath = this.processedImages.get(uuid);
    if (filePath) {
      this.processedImages.delete(uuid);
      cleanupFile(filePath); // Async cleanup, no need to wait
    }
  }

  public getImageUrl(uuid: string): string {
    return `http://localhost:${this.port}/image/${uuid}`;
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`HTTP server running on port ${this.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('HTTP server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}