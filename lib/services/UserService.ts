// lib/services/UserService.ts - PRODUCTION READY
import User, { IUser } from '@/lib/database/models/User';
import { connectToDatabase } from '@/lib/database/connection';

export interface CreateUserInput {
  email: string;
  name?: string;
  tier?: 'free' | 'inner-circle' | 'inner-circle-plus' | 'inner-circle-elite';
  subscriptionStatus?: 'active' | 'canceled' | 'expired' | 'pending';
  preferences?: Partial<IUser['preferences']>;
  metadata?: Partial<IUser['metadata']>;
}

export interface UpdateUserInput {
  name?: string;
  tier?: string;
  subscriptionStatus?: string;
  subscriptionEndsAt?: Date;
  preferences?: Partial<IUser['preferences']>;
  metadata?: Partial<IUser['metadata']>;
}

export class UserService {
  static async create(userData: CreateUserInput): Promise<IUser> {
    await connectToDatabase();
    
    const user = new User({
      ...userData,
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
    
    return User.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
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
    tier: string;
  }> {
    await connectToDatabase();
    
    const user = await User.findById(id).select('statistics tier subscriptionStatus createdAt');
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      totalLogins: user.statistics.totalLogins,
      totalContentAccessed: user.statistics.totalContentAccessed,
      favoriteCategories: user.statistics.favoriteCategories,
      memberSince: user.createdAt,
      subscriptionStatus: user.subscriptionStatus,
      tier: user.tier
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

  static async getUsersByTier(tier: string): Promise<IUser[]> {
    await connectToDatabase();
    return User.find({ tier }).select('email name createdAt');
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
    }
  ): Promise<IUser | null> {
    await connectToDatabase();
    
    return User.findByIdAndUpdate(
      userId,
      {
        subscriptionStatus: subscriptionData.status,
        subscriptionEndsAt: subscriptionData.endsAt,
        'metadata.stripeCustomerId': subscriptionData.stripeCustomerId,
        'metadata.stripeSubscriptionId': subscriptionData.stripeSubscriptionId
      },
      { new: true }
    );
  }
}

export default UserService;