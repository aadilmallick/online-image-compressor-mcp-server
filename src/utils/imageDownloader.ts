import { createWriteStream } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function downloadImage(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    // Generate a unique filename
    const fileName = `${uuidv4()}.tmp`;
    const filePath = path.join(process.cwd(), 'tmp', fileName);

    // Create write stream
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write the file
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, buffer);

    return filePath;
  } catch (error) {
    throw new Error(`Error downloading image: ${error instanceof Error ? error.message : String(error)}`);
  }
}