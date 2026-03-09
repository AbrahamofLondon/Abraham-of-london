// lib/services/UserService.ts - PRODUCTION READY with SSOT tiers
import User, { type IUser } from "@/lib/database/models/User";
import { connectToDatabase } from "@/lib/database/connection";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

export type UserTier = AccessTier;

export interface CreateUserInput {
  email: string;
  name?: string;
  tier?: UserTier | string;
  subscriptionStatus?: "active" | "canceled" | "expired" | "pending" | "trialing";
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateUserInput {
  name?: string;
  tier?: UserTier | string;
  subscriptionStatus?: string;
  subscriptionEndsAt?: Date;
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

const ACCESS_RANK: Record<UserTier, number> = {
  public: 0,
  member: 1,
  "inner-circle": 2,
  client: 3,
  legacy: 4,
  architect: 5,
  owner: 6,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export class UserService {
  static async create(userData: CreateUserInput): Promise<IUser> {
    await connectToDatabase();

    const normalizedTier = normalizeUserTier(userData.tier ?? "member");

    const user = new User({
      email: userData.email.toLowerCase().trim(),
      name: userData.name,
      tier: normalizedTier,
      normalizedTier,
      subscriptionStatus: userData.subscriptionStatus ?? "pending",
      preferences: {
        emailNotifications: true,
        theme: "dark",
        language: "en",
        ...asRecord(userData.preferences),
      },
      metadata: {
        ...asRecord(userData.metadata),
        originalTier:
          typeof userData.tier === "string" ? userData.tier : normalizedTier,
      },
      statistics: {
        totalLogins: 0,
        lastLoginAt: new Date(),
        totalContentAccessed: 0,
        favoriteCategories: [],
      },
    });

    await user.save();
    return user as IUser;
  }

  static async findById(id: string): Promise<IUser | null> {
    await connectToDatabase();
    return (await User.findById(id).select(
      "-metadata.stripeCustomerId -metadata.stripeSubscriptionId"
    )) as IUser | null;
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase();
    return (await User.findOne({
      email: email.toLowerCase().trim(),
    })) as IUser | null;
  }

  static async update(id: string, data: UpdateUserInput): Promise<IUser | null> {
    await connectToDatabase();

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.tier) {
      const normalizedTier = normalizeUserTier(data.tier);
      updateData.tier = normalizedTier;
      updateData.normalizedTier = normalizedTier;
      updateData["metadata.originalTier"] =
        typeof data.tier === "string" ? data.tier : normalizedTier;
    }

    if (data.preferences) {
      updateData.preferences = asRecord(data.preferences);
    }

    if (data.metadata) {
      updateData.metadata = asRecord(data.metadata);
    }

    return (await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-metadata.stripeCustomerId -metadata.stripeSubscriptionId")) as IUser | null;
  }

  static async updateLastLogin(id: string): Promise<IUser | null> {
    await connectToDatabase();

    return (await User.findByIdAndUpdate(
      id,
      {
        $inc: { "statistics.totalLogins": 1 },
        $set: { "statistics.lastLoginAt": new Date() },
      },
      { new: true }
    )) as IUser | null;
  }

  static async incrementContentAccess(
    id: string,
    category?: string
  ): Promise<IUser | null> {
    await connectToDatabase();

    const update: Record<string, unknown> = {
      $inc: { "statistics.totalContentAccessed": 1 },
    };

    if (category) {
      update.$addToSet = { "statistics.favoriteCategories": category };
    }

    return (await User.findByIdAndUpdate(id, update, {
      new: true,
    })) as IUser | null;
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

    const user = (await User.findById(id).select(
      "statistics tier normalizedTier subscriptionStatus createdAt metadata"
    )) as IUser | null;

    if (!user) {
      throw new Error("User not found");
    }

    const tier = normalizeUserTier((user as any).normalizedTier ?? (user as any).tier);
    const stats = (user as any).statistics ?? {};

    return {
      totalLogins: Number(stats.totalLogins ?? 0),
      totalContentAccessed: Number(stats.totalContentAccessed ?? 0),
      favoriteCategories: Array.isArray(stats.favoriteCategories)
        ? stats.favoriteCategories
        : [],
      memberSince: (user as any).createdAt,
      subscriptionStatus: String((user as any).subscriptionStatus ?? "pending"),
      tier,
      accessLevel: this.getAccessLevelLabel(tier),
    };
  }

  static async searchUsers(
    query: string,
    page = 1,
    limit = 20
  ): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectToDatabase();

    const skip = (page - 1) * limit;

    const searchQuery = query
      ? {
          $or: [
            { email: { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(searchQuery)
        .select("email name tier normalizedTier subscriptionStatus createdAt")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(searchQuery),
    ]);

    return {
      users: users as IUser[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getUsersByTier(tier: UserTier | string): Promise<IUser[]> {
    await connectToDatabase();

    const normalizedTier = normalizeUserTier(tier);

    return (await User.find({
      $or: [{ tier: normalizedTier }, { normalizedTier }],
    }).select("email name createdAt tier normalizedTier")) as IUser[];
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
      tier?: UserTier | string;
    }
  ): Promise<IUser | null> {
    await connectToDatabase();

    const updateData: Record<string, unknown> = {
      subscriptionStatus: subscriptionData.status,
      subscriptionEndsAt: subscriptionData.endsAt,
      "metadata.stripeCustomerId": subscriptionData.stripeCustomerId,
      "metadata.stripeSubscriptionId": subscriptionData.stripeSubscriptionId,
    };

    if (subscriptionData.tier) {
      const normalizedTier = normalizeUserTier(subscriptionData.tier);
      updateData.tier = normalizedTier;
      updateData.normalizedTier = normalizedTier;
      updateData["metadata.originalTier"] =
        typeof subscriptionData.tier === "string"
          ? subscriptionData.tier
          : normalizedTier;
    }

    return (await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    })) as IUser | null;
  }

  static getAccessLevelLabel(tier: UserTier): string {
    const labels: Record<UserTier, string> = {
      public: "Public Access",
      member: "Member Access",
      "inner-circle": "Inner Circle Access",
      client: "Client Access",
      legacy: "Legacy Access",
      architect: "Architect Access",
      owner: "Owner Access",
    };

    return labels[tier] || "Unknown Access";
  }

  static hasAccess(userTier: UserTier, requiredTier: UserTier): boolean {
    return ACCESS_RANK[userTier] >= ACCESS_RANK[requiredTier];
  }

  static migrateTier(legacyTier: string): UserTier {
    return normalizeUserTier(legacyTier);
  }
}

export default UserService;