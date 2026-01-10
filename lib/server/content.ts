// lib/server/content.ts - Simplified content module
import * as ContentHelper from "@/lib/contentlayer";

export interface ContentStats {
  totalItems: number;
  cachedItems: number;
  avgSize: number;
  totalSize: number;
  byType: Record<string, number>;
  lastScan: Date;
  contentlayerStats: {
    posts: number;
    books: number;
    downloads: number;
    shorts: number;
    canons: number;
    strategies: number;
    resources: number;
    events: number;
    prints: number;
    total: number;
  };
}

class ContentManager {
  async getContentStats(): Promise<ContentStats> {
    // Get contentlayer stats
    const contentlayerStats = this.getContentlayerStats();
    
    // Simple file stats (mock for now)
    const totalSize = 0;
    const totalItems = contentlayerStats.total;
    const avgSize = totalItems > 0 ? totalSize / totalItems : 0;

    return {
      totalItems,
      cachedItems: totalItems, // In memory cache
      avgSize,
      totalSize,
      byType: this.getContentTypeDistribution(),
      lastScan: new Date(),
      contentlayerStats
    };
  }

  private getContentlayerStats(): ContentStats['contentlayerStats'] {
    return {
      posts: ContentHelper.allPosts.length,
      books: ContentHelper.allBooks.length,
      downloads: ContentHelper.allDownloads.length,
      shorts: ContentHelper.allShorts.length,
      canons: ContentHelper.allCanons.length,
      strategies: ContentHelper.allStrategies.length,
      resources: ContentHelper.allResources.length,
      events: ContentHelper.allEvents.length,
      prints: ContentHelper.allPrints.length,
      total: ContentHelper.allDocuments.length
    };
  }

  private getContentTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    const allDocs = ContentHelper.allDocuments;

    for (const doc of allDocs) {
      const type = ContentHelper.getDocKind(doc);
      distribution[type] = (distribution[type] || 0) + 1;
    }

    return distribution;
  }
}

const contentManager = new ContentManager();

export async function getContentStats(): Promise<ContentStats> {
  return contentManager.getContentStats();
}

// Default export for backward compatibility
const EnhancedContentHelper = {
  ...ContentHelper,
  getContentStats,
  manager: contentManager
};

export default EnhancedContentHelper;
