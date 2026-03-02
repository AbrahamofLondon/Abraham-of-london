// lib/services/InnerCircleDataService.ts - FULLY SSOT ALIGNED
import InnerCircleData, { IInnerCircleData } from '@/lib/database/models/InnerCircleData';
import { connectToDatabase } from '@/lib/database/connection';

// Import directly from SSOT
import type { AccessTier } from '@/lib/access/tier-policy';
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
  TIER_HIERARCHY,
  TIER_ORDER,
} from '@/lib/access/tier-policy';

// Use SSOT AccessTier directly - no need to redefine
export type InnerCircleTierLevel = AccessTier;

// Legacy tier mapping - use SSOT's TIER_ALIASES via normalize functions
// Don't duplicate the mapping here - trust the SSOT

// Access hierarchy - use SSOT's TIER_HIERARCHY
// const tierHierarchy = TIER_HIERARCHY; // Already defined in SSOT

export interface CreateDataInput {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  tierLevel?: AccessTier | string; // Accept string, will normalize
  authorId: string;
  metadata?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedReadTime?: number;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
    }>;
    videoUrl?: string;
    audioUrl?: string;
    externalLinks?: Array<{
      title: string;
      url: string;
      description?: string;
    }>;
    requiresVerification?: boolean;
  };
}

export interface UpdateDataInput {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  tierLevel?: AccessTier | string;
  isPublished?: boolean;
  isFeatured?: boolean;
  metadata?: Partial<IInnerCircleData['metadata']>;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  tierLevel?: AccessTier | string | (AccessTier | string)[]; // Can filter by multiple tiers
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isPublished?: boolean;
  isFeatured?: boolean;
  difficulty?: string;
  userTier?: AccessTier | string; // For filtering based on user access
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class InnerCircleDataService {
  /**
   * Normalize a tier value to SSOT (for REQUIRED context)
   */
  static normalizeTier(tier: unknown): AccessTier {
    return normalizeRequiredTier(tier);
  }

  /**
   * Get accessible tiers for a user tier
   * Uses SSOT's hasAccess to determine what tiers user can access
   */
  static getAccessibleTiers(userTier: unknown): AccessTier[] {
    const normalizedUser = normalizeUserTier(userTier);
    
    // Return all tiers that the user can access (their level and below)
    return TIER_ORDER.filter(tier => hasAccess(normalizedUser, tier));
  }

  /**
   * Check if user can access content with required tier
   * Uses SSOT's hasAccess
   */
  static canAccess(userTier: unknown, requiredTier: unknown): boolean {
    const user = normalizeUserTier(userTier);
    const required = normalizeRequiredTier(requiredTier);
    return hasAccess(user, required);
  }

  static async create(data: CreateDataInput): Promise<IInnerCircleData> {
    await connectToDatabase();
    
    // Normalize tier to SSOT
    const normalizedTier = this.normalizeTier(data.tierLevel);
    
    const innerCircleData = new InnerCircleData({
      ...data,
      tierLevel: normalizedTier, // Store normalized tier
      isPublished: false,
      views: 0,
      likes: 0,
      accessLogs: [],
      metadata: {
        ...data.metadata,
        originalTier: data.tierLevel, // Keep original for reference
      },
    });

    await innerCircleData.save();
    return innerCircleData;
  }

  static async findById(id: string): Promise<IInnerCircleData | null> {
    await connectToDatabase();
    return InnerCircleData.findById(id);
  }

  static async findByUserTier(userTier: unknown): Promise<IInnerCircleData[]> {
    await connectToDatabase();
    
    // Get all tiers this user can access
    const accessibleTiers = this.getAccessibleTiers(userTier);
    
    return InnerCircleData.find({
      tierLevel: { $in: accessibleTiers },
      isPublished: true
    }).sort({ createdAt: -1 });
  }

  static async findAll(options: QueryOptions = {}): Promise<PaginatedResponse<IInnerCircleData>> {
    await connectToDatabase();
    
    const {
      page = 1,
      limit = 10,
      category,
      tags,
      tierLevel,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isPublished = true,
      isFeatured,
      difficulty,
      userTier,
    } = options;

    const skip = (page - 1) * limit;
    const query: any = {};

    if (isPublished !== undefined) query.isPublished = isPublished;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (category) query.category = category;

    // Handle tier filtering using SSOT
    if (userTier) {
      // Filter by what this user can access
      const accessibleTiers = this.getAccessibleTiers(userTier);
      query.tierLevel = { $in: accessibleTiers };
    } else if (tierLevel) {
      // Direct tier filter
      if (Array.isArray(tierLevel)) {
        const normalizedTiers = tierLevel.map(t => this.normalizeTier(t));
        query.tierLevel = { $in: normalizedTiers };
      } else {
        query.tierLevel = this.normalizeTier(tierLevel);
      }
    }

    if (tags?.length) query.tags = { $all: tags };
    if (difficulty) query['metadata.difficulty'] = difficulty;
    if (search) query.$text = { $search: search };

    const [data, total] = await Promise.all([
      InnerCircleData.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InnerCircleData.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  }

  static async update(id: string, data: UpdateDataInput): Promise<IInnerCircleData | null> {
    await connectToDatabase();
    
    const updateData: any = { ...data, updatedAt: new Date() };
    
    // Normalize tier if provided
    if (data.tierLevel) {
      updateData.tierLevel = this.normalizeTier(data.tierLevel);
    }
    
    return InnerCircleData.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await InnerCircleData.findByIdAndDelete(id);
    return !!result;
  }

  static async incrementViews(id: string, userId: string, ip: string, userAgent: string): Promise<IInnerCircleData | null> {
    await connectToDatabase();
    return InnerCircleData.incrementViews(id, userId, ip, userAgent);
  }

  static async toggleLike(id: string, userId: string): Promise<IInnerCircleData | null> {
    await connectToDatabase();
    const data = await InnerCircleData.findById(id);
    if (!data) return null;
    
    return InnerCircleData.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );
  }

  static async getCategories(): Promise<string[]> {
    await connectToDatabase();
    const categories = await InnerCircleData.distinct('category', { isPublished: true });
    return categories.sort();
  }

  static async getStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byTier: Record<string, number>;
    byDifficulty: Record<string, number>;
    totalViews: number;
    totalLikes: number;
  }> {
    await connectToDatabase();
    
    const [total, byCategory, byTier, byDifficulty, totalViews, totalLikes] = await Promise.all([
      InnerCircleData.countDocuments({ isPublished: true }),
      InnerCircleData.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      InnerCircleData.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$tierLevel', count: { $sum: 1 } } }
      ]),
      InnerCircleData.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$metadata.difficulty', count: { $sum: 1 } } }
      ]),
      InnerCircleData.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]),
      InnerCircleData.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: null, total: { $sum: '$likes' } } }
      ])
    ]);

    return {
      total,
      byCategory: Object.fromEntries(byCategory.map((item: any) => [item._id, item.count])),
      byTier: Object.fromEntries(
        byTier.map((item: any) => [
          getTierLabel(item._id) || item._id, 
          item.count
        ])
      ),
      byDifficulty: Object.fromEntries(byDifficulty.map((item: any) => [item._id, item.count])),
      totalViews: totalViews[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0
    };
  }

  /**
   * Migrate legacy tier data to SSOT
   */
  static async migrateLegacyData(): Promise<{ migrated: number; failed: number }> {
    await connectToDatabase();
    
    const result = { migrated: 0, failed: 0 };
    
    // Get all legacy values that aren't SSOT
    const allDocs = await InnerCircleData.find({}).lean();
    const legacyValues = new Set<string>();
    
    for (const doc of allDocs) {
      const tier = doc.tierLevel as string;
      const normalized = this.normalizeTier(tier);
      if (tier !== normalized) {
        legacyValues.add(tier);
      }
    }
    
    // Migrate each legacy value
    for (const legacyTier of legacyValues) {
      try {
        const normalized = this.normalizeTier(legacyTier);
        const updateResult = await InnerCircleData.updateMany(
          { tierLevel: legacyTier },
          { $set: { tierLevel: normalized } }
        );
        result.migrated += updateResult.modifiedCount;
        console.log(`[Migration] ${legacyTier} -> ${normalized}: ${updateResult.modifiedCount} documents`);
      } catch (error) {
        console.error(`Failed to migrate tier ${legacyTier}:`, error);
        result.failed += 1;
      }
    }
    
    return result;
  }
}

export default InnerCircleDataService;