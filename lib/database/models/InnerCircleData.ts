/* lib/database/models/InnerCircleData.ts — ENTERPRISE SSOT + TS-SAFE MONGOOSE (NO HOOKS, WITH INVARIANTS)
   COMPILES IN NEXT.JS + TS:

   - Validators: do NOT type `this` (Mongoose validator context can be Query).
   - Statics: attach via `(schema.statics as any)` so TS doesn’t mis-type `this`.
   - Invariants: normalizedTier must match normalizeRequiredTier(tierLevel).
*/

import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";
import { v4 as uuidv4 } from "uuid";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
} from "@/lib/access/tier-policy";

// -----------------------------------------------------------------------------
// SSOT Tier Order + Validation
// -----------------------------------------------------------------------------

export const INNER_CIRCLE_TIER_ORDER: AccessTier[] = [
  "public",
  "member",
  "inner-circle",
  "client",
  "legacy",
  "architect",
  "owner",
];

const VALID_TIERS = [
  "public",
  "member",
  "inner-circle",
  "client",
  "legacy",
  "architect",
  "owner",

  // Legacy tolerated values
  "free",
  "basic",
  "standard",
  "premium",
  "inner-circle-plus",
  "inner_circle_plus",
  "inner-circle-elite",
  "inner_circle_elite",
  "elite",
  "enterprise",
  "founder",
  "admin",
  "private",
  "restricted",
  "confidential",
  "vip",
] as const;

type ValidTierValue = (typeof VALID_TIERS)[number];

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InnerCircleDataFields {
  _id?: string;

  title: string;
  slug?: string;

  content: string;
  excerpt?: string;

  category: string;
  tags?: string[];

  tierLevel: AccessTier | ValidTierValue | string;
  normalizedTier?: AccessTier;

  authorId: string;
  authorName?: string;

  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: Date;

  views: number;
  likes: number;

  metadata: {
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

  accessLogs: Array<{
    userId: string;
    accessedAt: Date;
    ip: string;
    userAgent: string;
  }>;

  createdAt?: Date;
  updatedAt?: Date;
}

export type InnerCircleDataDoc = HydratedDocument<InnerCircleDataFields>;

// Legacy compatibility aliases
export type IInnerCircleData = InnerCircleDataDoc;
export type IInnerCircleDataFields = InnerCircleDataFields;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function safeString(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function slugifyTitle(value: string): string {
  return safeString(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ensureMetadata(doc: any): Record<string, unknown> {
  if (!doc.metadata || typeof doc.metadata !== "object") {
    doc.metadata = {};
  }
  return doc.metadata as Record<string, unknown>;
}

function expectedNormalizedTier(doc: any): AccessTier {
  return normalizeRequiredTier(doc?.tierLevel);
}

// -----------------------------------------------------------------------------
// Schema
// -----------------------------------------------------------------------------

const InnerCircleDataSchema = new Schema<InnerCircleDataFields>(
  {
    _id: { type: String, default: () => `icd_${uuidv4()}` },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      set: function (this: any, value: unknown) {
        const raw = safeString(value).trim();
        return raw || slugifyTitle(safeString(this?.title));
      },
    },

    content: {
      type: String,
      required: [true, "Content is required"],
    },

    excerpt: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      index: true,
    },

    tags: [{ type: String, index: true }],

    tierLevel: {
      type: String,
      required: true,
      enum: VALID_TIERS as unknown as string[],
      default: "member",
      set: function (this: any, value: unknown) {
        const raw = safeString(value || "member");
        const md = ensureMetadata(this);
        md.originalTier = raw;
        this.normalizedTier = normalizeRequiredTier(raw);
        return raw;
      },
      validate: {
        validator: function (this: any) {
          const expected = expectedNormalizedTier(this);
          const current = normalizeRequiredTier(
            this?.normalizedTier ?? this?.tierLevel
          );
          return expected === current;
        },
        message: "Invariant failed: normalizedTier must match tierLevel",
      },
    },

    normalizedTier: {
      type: String,
      enum: INNER_CIRCLE_TIER_ORDER as unknown as string[],
      index: true,
      default: "member",
      set: function (_this: any, value: unknown) {
        return normalizeRequiredTier(value);
      },
      validate: {
        validator: function (this: any, value: unknown) {
          const expected = expectedNormalizedTier(this);
          const current = normalizeRequiredTier(value);
          return expected === current;
        },
        message:
          "Invariant failed: normalizedTier must equal normalizeRequiredTier(tierLevel)",
      },
    },

    authorId: {
      type: String,
      required: true,
      index: true,
    },

    authorName: {
      type: String,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
      set: function (this: any, value: unknown) {
        const next = Boolean(value);
        if (next && !this.publishedAt) {
          this.publishedAt = new Date();
        }
        return next;
      },
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
    },

    views: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },

    metadata: {
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      estimatedReadTime: { type: Number },
      attachments: [
        {
          fileName: String,
          fileUrl: String,
          fileSize: Number,
          fileType: String,
        },
      ],
      videoUrl: { type: String },
      audioUrl: { type: String },
      externalLinks: [
        {
          title: String,
          url: String,
          description: String,
        },
      ],
      requiresVerification: { type: Boolean },
      originalTier: { type: String },
    },

    accessLogs: [
      {
        userId: { type: String },
        accessedAt: { type: Date, default: Date.now },
        ip: { type: String },
        userAgent: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// -----------------------------------------------------------------------------
// Indexes
// -----------------------------------------------------------------------------

InnerCircleDataSchema.index({ slug: 1 }, { unique: true, sparse: true });
InnerCircleDataSchema.index({ category: 1, isPublished: 1 });
InnerCircleDataSchema.index({ isFeatured: 1, isPublished: 1 });
InnerCircleDataSchema.index({ createdAt: -1 });
InnerCircleDataSchema.index({ title: "text", content: "text", excerpt: "text" });

// -----------------------------------------------------------------------------
// Virtuals
// -----------------------------------------------------------------------------

InnerCircleDataSchema.virtual("tierLabel").get(function (this: any) {
  return getTierLabel(this.normalizedTier || this.tierLevel);
});

InnerCircleDataSchema.virtual("accessDescription").get(function (this: any) {
  const tier = (this.normalizedTier ||
    normalizeRequiredTier(this.tierLevel)) as AccessTier;

  const descriptions: Record<AccessTier, string> = {
    public: "Available to everyone",
    member: "Available to all members",
    "inner-circle": "Inner Circle exclusive content",
    client: "Client access only",
    legacy: "Legacy member exclusive",
    architect: "Architect level access",
    owner: "Owner only",
  };

  return descriptions[tier] || `Requires ${tier} access`;
});

// -----------------------------------------------------------------------------
// Model statics interface
// -----------------------------------------------------------------------------

export interface InnerCircleDataModel extends Model<InnerCircleDataFields> {
  findByAccessibleTiers(
    userTier: unknown,
    options?: {
      categories?: string[];
      tags?: string[];
      limit?: number;
      skip?: number;
    }
  ): Promise<InnerCircleDataDoc[]>;

  findByCategory(
    category: string,
    userTier?: unknown
  ): Promise<InnerCircleDataDoc[]>;

  incrementViews(
    id: string,
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<InnerCircleDataDoc | null>;

  setTier(
    id: string,
    tierLevel: unknown
  ): Promise<InnerCircleDataDoc | null>;
}

// -----------------------------------------------------------------------------
// Statics
// -----------------------------------------------------------------------------

function findByAccessibleTiers(
  this: any,
  userTier: unknown,
  options: {
    categories?: string[];
    tags?: string[];
    limit?: number;
    skip?: number;
  } = {}
): Promise<InnerCircleDataDoc[]> {
  const normalizedUser = normalizeRequiredTier(userTier);
  const accessibleTiers = INNER_CIRCLE_TIER_ORDER.filter((tier) =>
    hasAccess(normalizedUser, tier)
  );

  const query: Record<string, any> = {
    isPublished: true,
    normalizedTier: { $in: accessibleTiers },
  };

  if (options.categories?.length) {
    query.category = { $in: options.categories };
  }

  if (options.tags?.length) {
    query.tags = { $in: options.tags };
  }

  let dbQuery = this.find(query).sort({ isFeatured: -1, createdAt: -1 });

  if (typeof options.limit === "number") {
    dbQuery = dbQuery.limit(options.limit);
  }

  if (typeof options.skip === "number") {
    dbQuery = dbQuery.skip(options.skip);
  }

  return dbQuery.exec();
}

function findByCategory(
  this: any,
  category: string,
  userTier?: unknown
): Promise<InnerCircleDataDoc[]> {
  const query: Record<string, any> = {
    category,
    isPublished: true,
  };

  if (userTier != null) {
    const normalizedUser = normalizeRequiredTier(userTier);
    const accessibleTiers = INNER_CIRCLE_TIER_ORDER.filter((tier) =>
      hasAccess(normalizedUser, tier)
    );
    query.normalizedTier = { $in: accessibleTiers };
  }

  return this.find(query).sort({ createdAt: -1 }).exec();
}

function incrementViews(
  this: any,
  id: string,
  userId: string,
  ip: string,
  userAgent: string
): Promise<InnerCircleDataDoc | null> {
  return this.findByIdAndUpdate(
    id,
    {
      $inc: { views: 1 },
      $push: {
        accessLogs: {
          userId,
          accessedAt: new Date(),
          ip,
          userAgent,
        },
      },
    },
    { new: true }
  ).exec();
}

function setTier(
  this: any,
  id: string,
  tierLevel: unknown
): Promise<InnerCircleDataDoc | null> {
  const raw = safeString(tierLevel || "member");
  const normalizedTier = normalizeRequiredTier(raw);

  return this.findByIdAndUpdate(
    id,
    {
      tierLevel: raw,
      normalizedTier,
      "metadata.originalTier": raw,
    },
    {
      new: true,
      runValidators: true,
    }
  ).exec();
}

(InnerCircleDataSchema.statics as any).findByAccessibleTiers =
  findByAccessibleTiers;
(InnerCircleDataSchema.statics as any).findByCategory = findByCategory;
(InnerCircleDataSchema.statics as any).incrementViews = incrementViews;
(InnerCircleDataSchema.statics as any).setTier = setTier;

// -----------------------------------------------------------------------------
// Model creation
// -----------------------------------------------------------------------------

const MODEL_NAME = "InnerCircleData";

const InnerCircleData =
  (mongoose.models[MODEL_NAME] as unknown as InnerCircleDataModel) ||
  mongoose.model<InnerCircleDataFields, InnerCircleDataModel>(
    MODEL_NAME,
    InnerCircleDataSchema
  );

export default InnerCircleData;