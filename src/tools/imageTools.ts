import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { v4 as uuidv4 } from 'uuid';
import { downloadImage } from '../utils/imageDownloader';
import { processImage } from '../utils/imageProcessor';
import { cleanupFile } from '../utils/cleanup';
import { HTTPServer } from '../httpServer';
import { ImageProcessingSpecs, ProcessImageRequest, ProcessImageResponse } from '../types';

export function createImageProcessingTool(httpServer: HTTPServer): Tool {
  return {
    name: 'process_image',
    description: 'Download an image from a URL and process it according to specified resize, compression, and conversion specs. Returns a temporary URL to access the processed image.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'The URL of the image to download and process',
          format: 'uri'
        },
        specs: {
          type: 'object',
          description: 'Image processing specifications',
          properties: {
            resize: {
              type: 'object',
              description: 'Resize specifications',
              properties: {
                width: {
                  type: 'integer',
                  description: 'Target width in pixels',
                  minimum: 1,
                  maximum: 10000
                },
                height: {
                  type: 'integer',
                  description: 'Target height in pixels',
                  minimum: 1,
                  maximum: 10000
                },
                fit: {
                  type: 'string',
                  description: 'How the image should be resized to fit the target dimensions',
                  enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
                  default: 'cover'
                }
              }
            },
            compression: {
              type: 'object',
              description: 'Compression specifications',
              properties: {
                quality: {
                  type: 'integer',
                  description: 'Image quality (1-100, higher is better quality)',
                  minimum: 1,
                  maximum: 100,
                  default: 80
                },
                progressive: {
                  type: 'boolean',
                  description: 'Use progressive JPEG encoding',
                  default: false
                },
                optimizeScans: {
                  type: 'boolean',
                  description: 'Optimize Huffman coding tables',
                  default: false
                }
              }
            },
            conversion: {
              type: 'object',
              description: 'Format conversion specifications',
              properties: {
                format: {
                  type: 'string',
                  description: 'Target image format',
                  enum: ['jpeg', 'png', 'webp', 'avif', 'tiff'],
                  default: 'jpeg'
                }
              },
              required: ['format']
            }
          }
        }
      },
      required: ['imageUrl', 'specs']
    }
  };
}

export async function handleImageProcessing(
  args: ProcessImageRequest,
  httpServer: HTTPServer
): Promise<ProcessImageResponse> {
  let downloadedImagePath: string | null = null;
  let processedImagePath: string | null = null;

  try {
    // Validate input
    if (!args.imageUrl || !args.specs) {
      throw new Error('Missing required parameters: imageUrl and specs');
    }

    // Validate image URL
    try {
      new URL(args.imageUrl);
    } catch {
      throw new Error('Invalid image URL provided');
    }

    // Validate specs
    if (!args.specs.conversion?.format) {
      throw new Error('Conversion format is required in specs');
    }

    console.log(`Processing image from URL: ${args.imageUrl}`);

    // Step 1: Download the image
    downloadedImagePath = await downloadImage(args.imageUrl);
    console.log(`Image downloaded to: ${downloadedImagePath}`);

    // Step 2: Process the image using Sharp
    processedImagePath = await processImage(downloadedImagePath, args.specs);
    console.log(`Image processed and saved to: ${processedImagePath}`);

    // Step 3: Add to HTTP server and get URL
    const imageUuid = uuidv4();
    httpServer.addProcessedImage(imageUuid, processedImagePath);
    const processedImageUrl = httpServer.getImageUrl(imageUuid);

    console.log(`Processed image available at: ${processedImageUrl}`);

    // Clean up the original downloaded file
    if (downloadedImagePath) {
      await cleanupFile(downloadedImagePath);
    }

    return {
      success: true,
      processedImageUrl
    };

  } catch (error) {
    // Clean up any temporary files on error
    if (downloadedImagePath) {
      await cleanupFile(downloadedImagePath);
    }
    if (processedImagePath) {
      await cleanupFile(processedImagePath);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error processing image:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}