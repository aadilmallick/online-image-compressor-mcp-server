import * as fs from 'fs/promises';
import * as path from 'path';

export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, which is fine
    console.warn(`Warning: Could not delete file ${filePath}:`, error);
  }
}

export async function cleanupOldFiles(maxAge: number = 3600000): Promise<void> {
  try {
    const tmpDir = path.join(process.cwd(), 'tmp');
    const files = await fs.readdir(tmpDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(tmpDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await cleanupFile(filePath);
      }
    }
  } catch (error) {
    console.warn('Warning: Could not cleanup old files:', error);
  }
}

// Schedule cleanup every hour
setInterval(() => {
  cleanupOldFiles();
}, 3600000);