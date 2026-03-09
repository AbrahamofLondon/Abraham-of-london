// lib/services/InnerCircleDataService.ts - FULLY SSOT ALIGNED
import InnerCircleData, {
  type IInnerCircleData,
} from "@/lib/database/models/InnerCircleData";
import { connectToDatabase } from "@/lib/database/connection";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
  TIER_ORDER,
} from "@/lib/access/tier-policy";

export type InnerCircleTierLevel = AccessTier;

export interface CreateDataInput {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  tierLevel?: AccessTier | string;
  authorId: string;
  metadata?: {
    difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
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
    originalTier?: string;
    [key: string]: unknown;
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
  metadata?: Record<string, unknown>;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  tierLevel?: AccessTier | string | Array<AccessTier | string>;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isPublished?: boolean;
  isFeatured?: boolean;
  difficulty?: string;
  userTier?: AccessTier | string;
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export class InnerCircleDataService {
  static normalizeTier(tier: unknown): AccessTier {
    return normalizeRequiredTier(tier);
  }

  static getAccessibleTiers(userTier: unknown): AccessTier[] {
    const normalizedUser = normalizeUserTier(userTier);
    return TIER_ORDER.filter((tier) => hasAccess(normalizedUser, tier));
  }

  static canAccess(userTier: unknown, requiredTier: unknown): boolean {
    const user = normalizeUserTier(userTier);
    const required = normalizeRequiredTier(requiredTier);
    return hasAccess(user, required);
  }

  static async create(data: CreateDataInput): Promise<IInnerCircleData> {
    await connectToDatabase();

    const normalizedTier = this.normalizeTier(data.tierLevel);
    const metadata = asRecord(data.metadata);

    const innerCircleData = new InnerCircleData({
      ...data,
      tierLevel: normalizedTier,
      isPublished: false,
      views: 0,
      likes: 0,
      accessLogs: [],
      metadata: {
        ...metadata,
        originalTier:
          typeof data.tierLevel === "string" ? data.tierLevel : normalizedTier,
      },
    });

    await innerCircleData.save();
    return innerCircleData as IInnerCircleData;
  }

  static async findById(id: string): Promise<IInnerCircleData | null> {
    await connectToDatabase();
    return (await InnerCircleData.findById(id)) as IInnerCircleData | null;
  }

  static async findByUserTier(userTier: unknown): Promise<IInnerCircleData[]> {
    await connectToDatabase();

    const accessibleTiers = this.getAccessibleTiers(userTier);

    return (await InnerCircleData.find({
      tierLevel: { $in: accessibleTiers },
      isPublished: true,
    }).sort({ createdAt: -1 })) as IInnerCircleData[];
  }

  static async findAll(
    options: QueryOptions = {}
  ): Promise<PaginatedResponse<IInnerCircleData>> {
    await connectToDatabase();

    const {
      page = 1,
      limit = 10,
      category,
      tags,
      tierLevel,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      isPublished = true,
      isFeatured,
      difficulty,
      userTier,
    } = options;

    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (typeof isPublished === "boolean") query.isPublished = isPublished;
    if (typeof isFeatured === "boolean") query.isFeatured = isFeatured;
    if (category) query.category = category;

    if (userTier) {
      query.tierLevel = { $in: this.getAccessibleTiers(userTier) };
    } else if (tierLevel) {
      if (Array.isArray(tierLevel)) {
        query.tierLevel = { $in: tierLevel.map((t) => this.normalizeTier(t)) };
      } else {
        query.tierLevel = this.normalizeTier(tierLevel);
      }
    }

    if (tags?.length) query.tags = { $all: tags };
    if (difficulty) query["metadata.difficulty"] = difficulty;
    if (search) query.$text = { $search: search };

    const [data, total] = await Promise.all([
      InnerCircleData.find(query)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InnerCircleData.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as IInnerCircleData[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  static async update(
    id: string,
    data: UpdateDataInput
  ): Promise<IInnerCircleData | null> {
    await connectToDatabase();

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.tierLevel) {
      updateData.tierLevel = this.normalizeTier(data.tierLevel);
    }

    if (data.metadata) {
      updateData.metadata = asRecord(data.metadata);
    }

    return (await InnerCircleData.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })) as IInnerCircleData | null;
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await InnerCircleData.findByIdAndDelete(id);
    return !!result;
  }

  static async incrementViews(
    id: string,
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<IInnerCircleData | null> {
    await connectToDatabase();
    return (await InnerCircleData.incrementViews(
      id,
      userId,
      ip,
      userAgent
    )) as IInnerCircleData | null;
  }

  static async toggleLike(
    id: string,
    _userId: string
  ): Promise<IInnerCircleData | null> {
    await connectToDatabase();

    const data = await InnerCircleData.findById(id);
    if (!data) return null;

    return (await InnerCircleData.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    )) as IInnerCircleData | null;
  }

  static async getCategories(): Promise<string[]> {
    await connectToDatabase();
    const categories = await InnerCircleData.distinct("category", {
      isPublished: true,
    });
    return (categories as string[]).sort();
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

    const [total, byCategory, byTier, byDifficulty, totalViews, totalLikes] =
      await Promise.all([
        InnerCircleData.countDocuments({ isPublished: true }),
        InnerCircleData.aggregate([
          { $match: { isPublished: true } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ]),
        InnerCircleData.aggregate([
          { $match: { isPublished: true } },
          { $group: { _id: "$tierLevel", count: { $sum: 1 } } },
        ]),
        InnerCircleData.aggregate([
          { $match: { isPublished: true } },
          { $group: { _id: "$metadata.difficulty", count: { $sum: 1 } } },
        ]),
        InnerCircleData.aggregate([
          { $match: { isPublished: true } },
          { $group: { _id: null, total: { $sum: "$views" } } },
        ]),
        InnerCircleData.aggregate([
          { $match: { isPublished: true } },
          { $group: { _id: null, total: { $sum: "$likes" } } },
        ]),
      ]);

    return {
      total,
      byCategory: Object.fromEntries(
        (byCategory as Array<{ _id: string; count: number }>).map((item) => [
          item._id,
          item.count,
        ])
      ),
      byTier: Object.fromEntries(
        (byTier as Array<{ _id: string; count: number }>).map((item) => [
          getTierLabel(item._id) || item._id,
          item.count,
        ])
      ),
      byDifficulty: Object.fromEntries(
        (byDifficulty as Array<{ _id: string; count: number }>).map((item) => [
          item._id,
          item.count,
        ])
      ),
      totalViews: (totalViews as Array<{ total: number }>)[0]?.total || 0,
      totalLikes: (totalLikes as Array<{ total: number }>)[0]?.total || 0,
    };
  }

  static async migrateLegacyData(): Promise<{
    migrated: number;
    failed: number;
  }> {
    await connectToDatabase();

    const result = { migrated: 0, failed: 0 };
    const allDocs = await InnerCircleData.find({}).lean();
    const legacyValues = new Set<string>();

    for (const doc of allDocs as Array<{ tierLevel?: unknown }>) {
      const tier = typeof doc.tierLevel === "string" ? doc.tierLevel : "";
      if (!tier) continue;

      const normalized = this.normalizeTier(tier);
      if (tier !== normalized) {
        legacyValues.add(tier);
      }
    }

    for (const legacyTier of legacyValues) {
      try {
        const normalized = this.normalizeTier(legacyTier);
        const updateResult = await InnerCircleData.updateMany(
          { tierLevel: legacyTier },
          { $set: { tierLevel: normalized } }
        );

        result.migrated += updateResult.modifiedCount;

        console.log(
          `[Migration] ${legacyTier} -> ${normalized}: ${updateResult.modifiedCount} documents`
        );
      } catch (error) {
        console.error(`Failed to migrate tier ${legacyTier}:`, error);
        result.failed += 1;
      }
    }

    return result;
  }
}

export default InnerCircleDataService;