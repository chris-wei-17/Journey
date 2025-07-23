import { generateSignedUrl } from "./supabase-client.js";

// Photo URL service with caching and automatic refresh
export class PhotoUrlService {
  private urlCache = new Map<string, { url: string; expiresAt: number }>();
  private readonly URL_EXPIRY_HOURS = 1;
  private readonly REFRESH_BUFFER_MINUTES = 10; // Refresh 10 min before expiry

  // Generate signed URL with caching
  async getSignedUrl(filePath: string): Promise<string> {
    const cached = this.urlCache.get(filePath);
    const now = Date.now();
    
    // Check if we have a valid cached URL (with buffer time)
    if (cached && now < (cached.expiresAt - this.REFRESH_BUFFER_MINUTES * 60 * 1000)) {
      return cached.url;
    }
    
    // Generate new signed URL
    const signedUrl = await generateSignedUrl(filePath, this.URL_EXPIRY_HOURS * 3600);
    const expiresAt = now + (this.URL_EXPIRY_HOURS * 60 * 60 * 1000);
    
    // Cache the URL
    this.urlCache.set(filePath, { url: signedUrl, expiresAt });
    
    return signedUrl;
  }

  // Get multiple signed URLs efficiently
  async getSignedUrls(filePaths: string[]): Promise<Record<string, string>> {
    const urls: Record<string, string> = {};
    
    // Process all URLs in parallel
    await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          urls[filePath] = await this.getSignedUrl(filePath);
        } catch (error) {
          console.error(`Failed to generate signed URL for ${filePath}:`, error);
          urls[filePath] = null;
        }
      })
    );
    
    return urls;
  }

  // Clear expired URLs from cache
  private cleanCache(): void {
    const now = Date.now();
    for (const [filePath, cached] of this.urlCache.entries()) {
      if (now >= cached.expiresAt) {
        this.urlCache.delete(filePath);
      }
    }
  }

  // Clear cache for specific file (useful when photo is deleted)
  clearCacheForFile(filePath: string): void {
    this.urlCache.delete(filePath);
  }

  // Periodic cleanup (call this in a background task)
  startCleanupInterval(): void {
    setInterval(() => this.cleanCache(), 15 * 60 * 1000); // Clean every 15 minutes
  }
}

// Singleton instance
export const photoUrlService = new PhotoUrlService();

// Start cleanup when module loads
photoUrlService.startCleanupInterval();