// lib/database/models/User.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IUser extends Document {
  _id: string;
  email: string;
  name?: string;
  avatar?: string;
  tier: 'free' | 'inner-circle' | 'inner-circle-plus' | 'inner-circle-elite';
  subscriptionStatus: 'active' | 'canceled' | 'expired' | 'pending';
  subscriptionEndsAt?: Date;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    defaultCategory?: string;
    language: string;
    timezone: string;
  };
  statistics: {
    totalLogins: number;
    lastLoginAt: Date;
    totalContentAccessed: number;
    favoriteCategories: string[];
  };
  metadata: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    registrationSource?: string;
    referralCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { 
      type: String, 
      default: () => `user_${uuidv4()}` 
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true,
      lowercase: true,
      trim: true
    },
    name: { 
      type: String, 
      trim: true 
    },
    avatar: { 
      type: String 
    },
    tier: { 
      type: String, 
      enum: ['free', 'inner-circle', 'inner-circle-plus', 'inner-circle-elite'],
      default: 'free'
    },
    subscriptionStatus: { 
      type: String, 
      enum: ['active', 'canceled', 'expired', 'pending'],
      default: 'active'
    },
    subscriptionEndsAt: { 
      type: Date 
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      defaultCategory: String,
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' }
    },
    statistics: {
      totalLogins: { type: Number, default: 0 },
      lastLoginAt: { type: Date, default: Date.now },
      totalContentAccessed: { type: Number, default: 0 },
      favoriteCategories: [{ type: String }]
    },
    metadata: {
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      registrationSource: String,
      referralCode: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ tier: 1, subscriptionStatus: 1 });
UserSchema.index({ 'metadata.stripeCustomerId': 1 });

// Virtual for active subscription
UserSchema.virtual('hasActiveSubscription').get(function() {
  return this.subscriptionStatus === 'active' && 
    (!this.subscriptionEndsAt || this.subscriptionEndsAt > new Date());
});

const User: Model<IUser> = mongoose.models.User || 
  mongoose.model<IUser>('User', UserSchema);

export default User;