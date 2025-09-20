export interface ResizeSpecs {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface CompressionSpecs {
  quality?: number;
  progressive?: boolean;
  optimizeScans?: boolean;
}

export interface ConversionSpecs {
  format: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff';
}

export interface ImageProcessingSpecs {
  resize?: ResizeSpecs;
  compression?: CompressionSpecs;
  conversion?: ConversionSpecs;
}

export interface ProcessImageRequest {
  imageUrl: string;
  specs: ImageProcessingSpecs;
}

export interface ProcessImageResponse {
  success: boolean;
  processedImageUrl?: string;
  error?: string;
}