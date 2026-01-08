/* eslint-disable no-console */
/**
 * ContentLayer status and health monitoring.
 * Handles ContentLayer build status, errors, and content statistics.
 */

export interface ContentLayerBuildStatus {
  hasRun: boolean;
  lastBuildTime?: Date;
  lastBuildDuration?: number;
  lastError?: string;
  totalDocuments: number;
  documentTypes: Record<string, number>;
  buildTriggered: boolean;
}

export interface ContentLayerHealth {
  healthy: boolean;
  status: 'ready' | 'building' | 'error' | 'not-initialized';
  lastChecked: Date;
  error?: string;
  warning?: string;
  stats?: {
    totalDocuments: number;
    documentTypes: string[];
    lastUpdated?: Date;
  };
}

export interface ContentLayerDocumentStats {
  type: string;
  count: number;
  lastModified?: Date;
  examples: string[];
}

class ContentLayerStatusManager {
  private static instance: ContentLayerStatusManager;
  private buildStatus: ContentLayerBuildStatus = {
    hasRun: false,
    totalDocuments: 0,
    documentTypes: {},
    buildTriggered: false
  };
  private lastHealthCheck: Date = new Date();
  private healthStatus: ContentLayerHealth = {
    healthy: false,
    status: 'not-initialized',
    lastChecked: this.lastHealthCheck
  };
  private retryCount = 0;
  private maxRetries = 3;

  private constructor() {
    // Initialize with environment checks
    this.checkContentLayerAvailability();
  }

  static getInstance(): ContentLayerStatusManager {
    if (!ContentLayerStatusManager.instance) {
      ContentLayerStatusManager.instance = new ContentLayerStatusManager();
    }
    return ContentLayerStatusManager.instance;
  }

  private async checkContentLayerAvailability(): Promise<void> {
    try {
      // Check if ContentLayer is configured
      const hasContentLayer = await this.detectContentLayer();
      if (hasContentLayer) {
        this.healthStatus.status = 'ready';
        this.healthStatus.healthy = true;
        this.retryCount = 0;
      } else {
        this.healthStatus.status = 'not-initialized';
        this.healthStatus.healthy = false;
        this.healthStatus.warning = 'ContentLayer not detected in project';
      }
    } catch (error) {
      this.healthStatus.status = 'error';
      this.healthStatus.healthy = false;
      this.healthStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    this.healthStatus.lastChecked = new Date();
  }

  private async detectContentLayer(): Promise<boolean> {
    try {
      // Try to access ContentLayer generated files
      const fs = require('fs');
      const path = require('path');
      
      // Check for common ContentLayer patterns
      const possiblePaths = [
        '.contentlayer',
        'contentlayer.config.ts',
        'contentlayer.config.js',
        'contentlayer.config.mjs'
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(path.join(process.cwd(), possiblePath))) {
          return true;
        }
      }
      
      // Check for generated types
      try {
        // Dynamic import to avoid build-time errors
        const contentlayer = await import('contentlayer/generated');
        return contentlayer !== undefined;
      } catch {
        // Try alternative import path
        try {
          const contentlayer = await import('@/lib/contentlayer-compat');
          return contentlayer !== undefined;
        } catch {
          return false;
        }
      }
    } catch (error) {
      console.warn('[ContentLayerStatus] Detection failed:', error);
      return false;
    }
  }

  async recordBuildStart(): Promise<void> {
    this.buildStatus.buildTriggered = true;
    console.log('[ContentLayerStatus] Build started');
  }

  async recordBuildComplete(duration: number, documents?: any[]): Promise<void> {
    this.buildStatus.hasRun = true;
    this.buildStatus.lastBuildTime = new Date();
    this.buildStatus.lastBuildDuration = duration;
    this.buildStatus.lastError = undefined;
    this.buildStatus.buildTriggered = false;
    
    if (documents) {
      this.updateDocumentStats(documents);
    }
    
    // Update health status
    this.healthStatus.healthy = true;
    this.healthStatus.status = 'ready';
    this.healthStatus.lastChecked = new Date();
    this.retryCount = 0;
    
    console.log(`[ContentLayerStatus] Build completed in ${duration}ms with ${this.buildStatus.totalDocuments} documents`);
  }

  async recordBuildError(error: Error): Promise<void> {
    this.buildStatus.lastError = error.message;
    this.buildStatus.buildTriggered = false;
    
    // Update health status with error
    this.healthStatus.healthy = false;
    this.healthStatus.status = 'error';
    this.healthStatus.error = error.message;
    this.healthStatus.lastChecked = new Date();
    
    this.retryCount++;
    
    console.error('[ContentLayerStatus] Build error:', error.message);
  }

  private updateDocumentStats(documents: any[]): void {
    this.buildStatus.totalDocuments = documents.length;
    this.buildStatus.documentTypes = {};
    
    const typeCounts: Record<string, number> = {};
    const typeExamples: Record<string, string[]> = {};
    
    for (const doc of documents) {
      const type = doc._raw?.sourceFileDir || doc.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      
      if (!typeExamples[type]) {
        typeExamples[type] = [];
      }
      
      if (typeExamples[type].length < 3 && doc.title) {
        typeExamples[type].push(doc.title);
      }
    }
    
    this.buildStatus.documentTypes = typeCounts;
    
    // Update health stats
    this.healthStatus.stats = {
      totalDocuments: documents.length,
      documentTypes: Object.keys(typeCounts),
      lastUpdated: new Date()
    };
  }

  async getBuildStatus(): Promise<ContentLayerBuildStatus> {
    return { ...this.buildStatus };
  }

  async getHealth(): Promise<ContentLayerHealth> {
    // Auto-refresh health if it's been more than 5 minutes
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    if (this.healthStatus.lastChecked < fiveMinutesAgo) {
      await this.checkContentLayerAvailability();
    }
    
    return { ...this.healthStatus };
  }

  async getDocumentStats(): Promise<ContentLayerDocumentStats[]> {
    const stats: ContentLayerDocumentStats[] = [];
    
    for (const [type, count] of Object.entries(this.buildStatus.documentTypes)) {
      stats.push({
        type,
        count,
        lastModified: this.buildStatus.lastBuildTime
      });
    }
    
    return stats;
  }

  async forceHealthCheck(): Promise<ContentLayerHealth> {
    await this.checkContentLayerAvailability();
    return this.getHealth();
  }

  async getContentLayerData(): Promise<any> {
    try {
      // Try to get actual ContentLayer data
      const contentlayer = await import('contentlayer/generated');
      const allDocuments = contentlayer.allDocuments || [];
      
      return {
        available: true,
        documentCount: allDocuments.length,
        documents: allDocuments.slice(0, 10), // Return first 10 for sampling
        types: [...new Set(allDocuments.map((doc: any) => doc._raw?.sourceFileDir || doc.type))]
      };
    } catch (error) {
      try {
        // Fallback to compatibility layer
        const compat = await import('@/lib/contentlayer-compat');
        return {
          available: true,
          viaCompat: true,
          documentCount: compat.allDocuments?.length || 0
        };
      } catch (compatError) {
        return {
          available: false,
          error: 'ContentLayer data not available',
          suggestion: 'Run `npm run build` or `npm run contentlayer:build` to generate content'
        };
      }
    }
  }

  async getStatusReport(): Promise<{
    build: ContentLayerBuildStatus;
    health: ContentLayerHealth;
    data: any;
    recommendations?: string[];
  }> {
    const build = await this.getBuildStatus();
    const health = await this.getHealth();
    const data = await this.getContentLayerData();
    
    const recommendations: string[] = [];
    
    if (!health.healthy) {
      if (health.status === 'not-initialized') {
        recommendations.push('Install ContentLayer: npm install contentlayer next-contentlayer');
        recommendations.push('Create contentlayer.config.ts with your content configuration');
      } else if (health.status === 'error') {
        recommendations.push('Check contentlayer.config.ts for configuration errors');
        recommendations.push('Run `npm run contentlayer:build` to see detailed error messages');
      }
    }
    
    if (build.hasRun && build.totalDocuments === 0) {
      recommendations.push('Add content files to your content directory');
      recommendations.push('Check that your content matches the schema in contentlayer.config.ts');
    }
    
    return {
      build,
      health,
      data,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  }
}

// Export singleton instance
const contentLayerStatus = ContentLayerStatusManager.getInstance();

// Helper functions for API routes
export async function getContentLayerStatus() {
  return await contentLayerStatus.getStatusReport();
}

export async function checkContentLayerHealth() {
  return await contentLayerStatus.getHealth();
}

export async function getContentLayerBuildStatus() {
  return await contentLayerStatus.getBuildStatus();
}

export async function getContentLayerDocuments() {
  return await contentLayerStatus.getContentLayerData();
}

// Export the function that was being imported
export async function checkContentlayerStatus() {
  const health = await contentLayerStatus.getHealth();
  return {
    healthy: health.healthy,
    status: health.status,
    error: health.error,
    warning: health.warning,
    lastChecked: health.lastChecked,
    stats: health.stats
  };
}

// Initialize on import
contentLayerStatus.forceHealthCheck().catch(console.error);

export default contentLayerStatus;