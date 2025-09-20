import sharp from 'sharp';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ImageProcessingSpecs } from '../types';

export async function processImage(inputPath: string, specs: ImageProcessingSpecs): Promise<string> {
  try {
    let sharpInstance = sharp(inputPath);

    // Apply resize transformations
    if (specs.resize) {
      const { width, height, fit = 'cover' } = specs.resize;
      sharpInstance = sharpInstance.resize(width, height, { fit });
    }

    // Apply format conversion and compression
    if (specs.conversion) {
      const { format } = specs.conversion;
      const compressionOptions = specs.compression || {};

      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality: compressionOptions.quality || 80,
            progressive: compressionOptions.progressive || false,
            optimizeScans: compressionOptions.optimizeScans || false,
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            quality: compressionOptions.quality || 80,
            progressive: compressionOptions.progressive || false,
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: compressionOptions.quality || 80,
          });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({
            quality: compressionOptions.quality || 80,
          });
          break;
        case 'tiff':
          sharpInstance = sharpInstance.tiff({
            quality: compressionOptions.quality || 80,
          });
          break;
      }
    }

    // Generate output filename
    const outputFileName = `${uuidv4()}.${specs.conversion?.format || 'jpg'}`;
    const outputPath = path.join(process.cwd(), 'tmp', outputFileName);

    // Save the processed image
    await sharpInstance.toFile(outputPath);

    return outputPath;
  } catch (error) {
    throw new Error(`Error processing image: ${error instanceof Error ? error.message : String(error)}`);
  }
}