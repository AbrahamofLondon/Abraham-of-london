// lib/database/models/User.ts — SSOT Tier Model (Mongoose)
import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";
import { v4 as uuidv4 } from "uuid";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

export type SubscriptionStatus = "active" | "canceled" | "expired" | "pending" | "trialing";

export interface UserFields {
  _id?: string;
  email: string;
  name?: string;
  avatar?: string;

  /**
   * `tier` is the raw stored value (legacy tolerated).
   * `normalizedTier` is the SSOT canonical tier used for logic & indexing.
   */
  tier: string;
  normalizedTier: AccessTier;

  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt?: Date;
  stripePriceId?: string;

  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    defaultCategory?: string;
    language: string;
    timezone: string;
    theme?: "light" | "dark" | "system";
  };

  statistics: {
    totalLogins: number;
    lastLoginAt: Date;
    totalContentAccessed: number;
    favoriteCategories: string[];
    lastActiveAt?: Date;
  };

  metadata: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    registrationSource?: string;
    referralCode?: string;
    originalTier?: string;
    tierHistory?: Array<{
      tier: string;
      normalizedTier: AccessTier;
      changedAt: Date;
      reason?: string;
    }>;
  };

  permissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDoc = HydratedDocument<UserFields>;

const UserSchema = new Schema<UserFields>(
  {
    _id: {
      type: String,
      default: () => `user_${uuidv4()}`,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, trim: true },
    avatar: { type: String },

    tier: {
      type: String,
      default: "public",
    },

    normalizedTier: {
      type: String,
      enum: ["public", "member", "inner-circle", "client", "legacy", "architect", "owner"],
      default: "public",
      index: true,
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "canceled", "expired", "pending", "trialing"],
      default: "pending",
    },
    subscriptionEndsAt: { type: Date },
    stripePriceId: { type: String },

    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      defaultCategory: String,
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    },

    statistics: {
      totalLogins: { type: Number, default: 0 },
      lastLoginAt: { type: Date, default: Date.now },
      lastActiveAt: { type: Date },
      totalContentAccessed: { type: Number, default: 0 },
      favoriteCategories: [{ type: String }],
    },

    metadata: {
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      registrationSource: String,
      referralCode: String,
      originalTier: String,
      tierHistory: [
        {
          tier: String,
          normalizedTier: String,
          changedAt: Date,
          reason: String,
        },
      ],
    },

    permissions: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ normalizedTier: 1, subscriptionStatus: 1 });
UserSchema.index({ tier: 1, subscriptionStatus: 1 });
UserSchema.index({ "metadata.stripeCustomerId": 1 });
UserSchema.index({ "statistics.lastActiveAt": -1 });

// Virtual for active subscription
UserSchema.virtual("hasActiveSubscription").get(function (this: UserDoc) {
  return this.subscriptionStatus === "active" && (!this.subscriptionEndsAt || this.subscriptionEndsAt > new Date());
});

// Virtual for access level (SSOT)
UserSchema.virtual("accessLevel").get(function (this: UserDoc) {
  return this.normalizedTier || normalizeUserTier(this.tier);
});

// Virtual label (keep simple; UI can also use tier-policy labels)
UserSchema.virtual("tierLabel").get(function (this: UserDoc) {
  const labels: Record<AccessTier, string> = {
    public: "Public",
    member: "Member",
    "inner-circle": "Inner Circle",
    client: "Client",
    legacy: "Legacy",
    architect: "Architect",
    owner: "Owner",
  };
  return labels[this.normalizedTier] || String(this.normalizedTier);
});

// ✅ FIXED: Pre-save hook without `next` parameter (avoids TS overload confusion)
UserSchema.pre("save", function (this: UserDoc) {
  // No `next` param — avoids TS overload where `next` becomes SaveOptions
  try {
    if (this.isModified("tier") || !this.normalizedTier) {
      const raw = String(this.tier ?? "public");
      const normalized = normalizeUserTier(raw);

      // preserve originalTier once
      if (!this.metadata) this.metadata = {} as any;
      if (!this.metadata.originalTier) this.metadata.originalTier = raw;

      this.normalizedTier = normalized;

      if (!this.metadata.tierHistory) this.metadata.tierHistory = [];
      this.metadata.tierHistory.push({
        tier: raw,
        normalizedTier: normalized,
        changedAt: new Date(),
        reason: this.isNew ? "create" : "update",
      });
    }
  } catch (e) {
    // Throw to trigger mongoose error handling
    throw e;
  }
});

// ✅ FIXED: Create model with proper type assertion through 'unknown'
const User = 
  (mongoose.models.User as unknown as Model<UserFields>) ||
  mongoose.model<UserFields>("User", UserSchema);

export default User;