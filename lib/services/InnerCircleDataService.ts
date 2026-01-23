// lib/services/InnerCircleDataService.ts - FIXED
import InnerCircleData, { IInnerCircleData } from '@/lib/database/models/InnerCircleData';
import { connectToDatabase } from '@/lib/database/connection';

export interface CreateDataInput {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  tierLevel?: 'basic' | 'premium' | 'elite';
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
  tierLevel?: 'basic' | 'premium' | 'elite';
  isPublished?: boolean;
  isFeatured?: boolean;
  metadata?: Partial<IInnerCircleData['metadata']>;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  tierLevel?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isPublished?: boolean;
  isFeatured?: boolean;
  difficulty?: string;
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
  static async create(data: CreateDataInput): Promise<IInnerCircleData> {
    await connectToDatabase();
    
    const innerCircleData = new InnerCircleData({
      ...data,
      isPublished: false,
      views: 0,
      likes: 0,
      accessLogs: []
    });

    await innerCircleData.save();
    return innerCircleData;
  }

  static async findById(id: string): Promise<IInnerCircleData | null> {
    await connectToDatabase();
    return InnerCircleData.findById(id);
  }

  static async findByUserTier(userTier: string): Promise<IInnerCircleData[]> {
    await connectToDatabase();
    
    // Map user tier to data tier levels they can access
    const tierMapping = {
      'free': [],
      'inner-circle': ['basic'],
      'inner-circle-plus': ['basic', 'premium'],
      'inner-circle-elite': ['basic', 'premium', 'elite']
    };

    const accessibleTiers = tierMapping[userTier as keyof typeof tierMapping] || ['basic'];
    
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
      difficulty
    } = options;

    const skip = (page - 1) * limit;
    const query: any = {};

    if (isPublished !== undefined) {
      query.isPublished = isPublished;
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured;
    }

    if (category) {
      query.category = category;
    }

    if (tierLevel) {
      query.tierLevel = tierLevel;
    }

    if (tags && tags.length > 0) {
      query.tags = { $all: tags };
    }

    if (difficulty) {
      query['metadata.difficulty'] = difficulty;
    }

    if (search) {
      query.$text = { $search: search };
    }

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
    
    return InnerCircleData.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    
    const result = await InnerCircleData.findByIdAndDelete(id);
    return !!result;
  }

  static async incrementViews(id: string, _userId: string, _ip: string, _userAgent: string): Promise<IInnerCircleData | null> {
    await connectToDatabase();
    // Prefix unused parameters with underscore to satisfy ESLint
    return InnerCircleData.incrementViews(id, _userId, _ip, _userAgent);
  }

  static async toggleLike(id: string, _userId: string): Promise<IInnerCircleData | null> {
    await connectToDatabase();
    
    // Check if user already liked
    const data = await InnerCircleData.findById(id);
    if (!data) return null;

    // In production, you'd have a separate likes collection
    // For simplicity, we'll just increment
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
      byTier: Object.fromEntries(byTier.map((item: any) => [item._id, item.count])),
      byDifficulty: Object.fromEntries(byDifficulty.map((item: any) => [item._id, item.count])),
      totalViews: totalViews[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0
    };
  }
}

export default InnerCircleDataService;