/* lib/database/models/User.ts — SSOT + TS-SAFE MONGOOSE USER MODEL */

import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

export interface UserFields {
  email: string;
  name?: string;

  tier: AccessTier | string;
  normalizedTier?: AccessTier;

  subscriptionStatus?:
    | "active"
    | "canceled"
    | "expired"
    | "pending"
    | "trialing";

  subscriptionEndsAt?: Date;

  preferences: {
    emailNotifications?: boolean;
    theme?: string;
    language?: string;
    [key: string]: unknown;
  };

  metadata: {
    originalTier?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    [key: string]: unknown;
  };

  statistics: {
    totalLogins: number;
    lastLoginAt?: Date;
    totalContentAccessed: number;
    favoriteCategories: string[];
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDoc = HydratedDocument<UserFields>;

// Legacy compatibility alias
export type IUser = UserDoc;
export type IUserFields = UserFields;

export interface UserModel extends Model<UserFields> {}

const UserSchema = new Schema<UserFields>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
    },

    tier: {
      type: String,
      required: true,
      default: "member",
      set: function (this: any, value: unknown) {
        const raw = String(value || "member");
        this.normalizedTier = normalizeUserTier(raw);
        if (!this.metadata || typeof this.metadata !== "object") {
          this.metadata = {};
        }
        this.metadata.originalTier = raw;
        return raw;
      },
    },

    normalizedTier: {
      type: String,
      default: "member",
      index: true,
      set: function (_this: any, value: unknown) {
        return normalizeUserTier(value);
      },
    },

    subscriptionStatus: {
      type: String,
      default: "pending",
      index: true,
    },

    subscriptionEndsAt: {
      type: Date,
    },

    preferences: {
      emailNotifications: { type: Boolean, default: true },
      theme: { type: String, default: "dark" },
      language: { type: String, default: "en" },
    },

    metadata: {
      originalTier: { type: String },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
    },

    statistics: {
      totalLogins: { type: Number, default: 0 },
      lastLoginAt: { type: Date },
      totalContentAccessed: { type: Number, default: 0 },
      favoriteCategories: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ tier: 1 });
UserSchema.index({ normalizedTier: 1 });
UserSchema.index({ subscriptionStatus: 1 });
UserSchema.index({ createdAt: -1 });

const MODEL_NAME = "User";

const User =
  (mongoose.models[MODEL_NAME] as UserModel) ||
  mongoose.model<UserFields, UserModel>(MODEL_NAME, UserSchema);

export default User;