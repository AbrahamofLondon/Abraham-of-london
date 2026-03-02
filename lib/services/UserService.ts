// lib/services/UserService.ts - PRODUCTION READY with SSOT tiers
import User, { IUser } from '@/lib/database/models/User';
import { connectToDatabase } from '@/lib/database/connection';
import { normalizeUserTier } from '@/lib/access/tiers';

// Import SSOT tier types
import type { AccessTier } from '@/lib/access/tiers';

// Use SSOT-compatible tiers (mapped from database values)
export type UserTier = 
  | "public"      // Free/unauthenticated
  | "member"       // Basic authenticated (was: free/basic)
  | "inner-circle" // Premium content access (was: inner-circle/premium)
  | "client"       // Paid client access (was: inner-circle-plus)
  | "legacy"       // Long-term trusted (was: inner-circle-elite/enterprise)
  | "architect"    // Strategic partner (was: founder/architect)
  | "owner";       // Principal owner (was: admin/owner)

export interface CreateUserInput {
  email: string;
  name?: string;
  tier?: UserTier;
  subscriptionStatus?: 'active' | 'canceled' | 'expired' | 'pending' | 'trialing';
  preferences?: Partial<IUser['preferences']>;
  metadata?: Partial<IUser['metadata']>;
}

export interface UpdateUserInput {
  name?: string;
  tier?: UserTier;
  subscriptionStatus?: string;
  subscriptionEndsAt?: Date;
  preferences?: Partial<IUser['preferences']>;
  metadata?: Partial<IUser['metadata']>;
}

// Mapping from database values to SSOT tiers
const tierMapping: Record<string, UserTier> = {
  // Legacy values -> SSOT
  'free': 'member',
  'basic': 'member',
  'inner-circle': 'inner-circle',
  'premium': 'inner-circle',
  'inner-circle-plus': 'client',
  'client': 'client',
  'inner-circle-elite': 'legacy',
  'enterprise': 'legacy',
  'elite': 'legacy',
  'founder': 'architect',
  'architect': 'architect',
  'admin': 'owner',
  'owner': 'owner',
  'private': 'client', // Map private to client tier
  'restricted': 'client', // Map restricted to client tier
};

export class UserService {
  static async create(userData: CreateUserInput): Promise<IUser> {
    await connectToDatabase();
    
    // Normalize tier if provided, otherwise default to 'member'
    const normalizedTier = userData.tier 
      ? tierMapping[userData.tier] || 'member'
      : 'member';
    
    const user = new User({
      ...userData,
      tier: normalizedTier, // Store normalized tier
      // Also store original for audit if needed
      metadata: {
        ...userData.metadata,
        originalTier: userData.tier, // Keep original for reference
      },
      statistics: {
        totalLogins: 0,
        lastLoginAt: new Date(),
        totalContentAccessed: 0,
        favoriteCategories: []
      }
    });

    await user.save();
    return user;
  }

  static async findById(id: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findById(id).select('-metadata.stripeCustomerId -metadata.stripeSubscriptionId');
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findOne({ email: email.toLowerCase() });
  }

  static async update(id: string, data: UpdateUserInput): Promise<IUser | null> {
    await connectToDatabase();
    
    // Normalize tier if provided
    const updateData: any = { ...data, updatedAt: new Date() };
    
    if (data.tier) {
      updateData.tier = tierMapping[data.tier] || data.tier;
    }
    
    return User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-metadata.stripeCustomerId -metadata.stripeSubscriptionId');
  }

  static async updateLastLogin(id: string): Promise<IUser | null> {
    await connectToDatabase();
    
    return User.findByIdAndUpdate(
      id,
      {
        $inc: { 'statistics.totalLogins': 1 },
        $set: { 'statistics.lastLoginAt': new Date() }
      },
      { new: true }
    );
  }

  static async incrementContentAccess(id: string, category?: string): Promise<IUser | null> {
    await connectToDatabase();
    
    const update: any = {
      $inc: { 'statistics.totalContentAccessed': 1 }
    };

    if (category) {
      update.$addToSet = { 'statistics.favoriteCategories': category };
    }

    return User.findByIdAndUpdate(id, update, { new: true });
  }

  static async getUserStats(id: string): Promise<{
    totalLogins: number;
    totalContentAccessed: number;
    favoriteCategories: string[];
    memberSince: Date;
    subscriptionStatus: string;
    tier: UserTier;
    accessLevel: string;
  }> {
    await connectToDatabase();
    
    const user = await User.findById(id).select('statistics tier subscriptionStatus createdAt metadata');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get human-readable access level
    const accessLevel = this.getAccessLevelLabel(user.tier as UserTier);

    return {
      totalLogins: user.statistics.totalLogins,
      totalContentAccessed: user.statistics.totalContentAccessed,
      favoriteCategories: user.statistics.favoriteCategories,
      memberSince: user.createdAt,
      subscriptionStatus: user.subscriptionStatus,
      tier: user.tier as UserTier,
      accessLevel,
    };
  }

  static async searchUsers(query: string, page = 1, limit = 20): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectToDatabase();
    
    const skip = (page - 1) * limit;
    
    const searchQuery = query ? {
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      User.find(searchQuery)
        .select('email name tier subscriptionStatus createdAt')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(searchQuery)
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getUsersByTier(tier: UserTier | string): Promise<IUser[]> {
    await connectToDatabase();
    
    // Handle both legacy and SSOT tier values
    const normalizedTier = tierMapping[tier] || tier;
    
    return User.find({ 
      $or: [
        { tier: normalizedTier },
        { tier: tier } // Also search for original value
      ]
    }).select('email name createdAt');
  }

  static async deleteUser(id: string): Promise<boolean> {
    await connectToDatabase();
    
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  static async updateSubscription(
    userId: string, 
    subscriptionData: {
      status: string;
      endsAt?: Date;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      tier?: UserTier; // Add tier mapping from subscription
    }
  ): Promise<IUser | null> {
    await connectToDatabase();
    
    const updateData: any = {
      subscriptionStatus: subscriptionData.status,
      subscriptionEndsAt: subscriptionData.endsAt,
      'metadata.stripeCustomerId': subscriptionData.stripeCustomerId,
      'metadata.stripeSubscriptionId': subscriptionData.stripeSubscriptionId,
    };

    // Update tier based on subscription if provided
    if (subscriptionData.tier) {
      updateData.tier = subscriptionData.tier;
    }

    return User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );
  }

  /**
   * Get human-readable access level label
   */
  static getAccessLevelLabel(tier: UserTier): string {
    const labels: Record<UserTier, string> = {
      'public': 'Public Access',
      'member': 'Member Access',
      'inner-circle': 'Inner Circle Access',
      'client': 'Client Access',
      'legacy': 'Legacy Access',
      'architect': 'Architect Access',
      'owner': 'Owner Access',
    };
    
    return labels[tier] || 'Unknown Access';
  }

  /**
   * Check if user has required tier access
   */
  static hasAccess(userTier: UserTier, requiredTier: UserTier): boolean {
    const rank: Record<UserTier, number> = {
      'public': 0,
      'member': 1,
      'inner-circle': 2,
      'client': 3,
      'legacy': 4,
      'architect': 5,
      'owner': 6,
    };
    
    return rank[userTier] >= rank[requiredTier];
  }

  /**
   * Migrate legacy tier to SSOT tier
   */
  static migrateTier(legacyTier: string): UserTier {
    return tierMapping[legacyTier.toLowerCase()] || 'member';
  }
}

export default UserService;