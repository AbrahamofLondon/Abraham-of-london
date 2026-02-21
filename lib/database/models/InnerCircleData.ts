// lib/database/models/InnerCircleData.ts
import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";
import { v4 as uuidv4 } from "uuid";

/** 1) Define plain fields (DO NOT extend Document) */
export interface InnerCircleDataFields {
  _id?: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  tierLevel: "basic" | "premium" | "elite";
  authorId: string;
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  likes: number;
  metadata: {
    difficulty: "beginner" | "intermediate" | "advanced" | "expert";
    estimatedReadTime: number;
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
    lastVerifiedAt?: Date;
    verificationNotes?: string;
  };
  accessLogs: Array<{
    userId: string;
    accessedAt: Date;
    ipAddress: string;
    userAgent: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
}

/** 2) Hydrated document type */
export type InnerCircleDataDoc = HydratedDocument<InnerCircleDataFields>;

const InnerCircleDataSchema = new Schema<InnerCircleDataFields>(
  {
    _id: {
      type: String,
      default: () => `ic_${uuidv4()}`,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    excerpt: {
      type: String,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "trading",
        "investments",
        "insights",
        "education",
        "reports",
        "strategies",
        "research",
        "case-studies",
        "tools",
        "community",
      ],
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    tierLevel: {
      type: String,
      required: true,
      enum: ["basic", "premium", "elite"],
      default: "basic",
    },
    authorId: {
      type: String,
      required: [true, "Author ID is required"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
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
        default: "intermediate",
      },
      estimatedReadTime: {
        type: Number,
        min: [1, "Estimated read time must be at least 1 minute"],
        default: 10,
      },
      attachments: [
        {
          fileName: String,
          fileUrl: String,
          fileSize: Number,
          fileType: String,
        },
      ],
      videoUrl: String,
      audioUrl: String,
      externalLinks: [
        {
          title: String,
          url: String,
          description: String,
        },
      ],
      requiresVerification: { type: Boolean, default: false },
      lastVerifiedAt: Date,
      verificationNotes: String,
    },
    accessLogs: [
      {
        userId: String,
        accessedAt: { type: Date, default: Date.now },
        ipAddress: String,
        userAgent: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
InnerCircleDataSchema.index({ category: 1, isPublished: 1, tierLevel: 1 });
InnerCircleDataSchema.index({ tags: 1, isPublished: 1 });
InnerCircleDataSchema.index({ isFeatured: 1, publishedAt: -1 });
InnerCircleDataSchema.index({ title: "text", content: "text", excerpt: "text" });
InnerCircleDataSchema.index({ authorId: 1, createdAt: -1 });
InnerCircleDataSchema.index({ "metadata.difficulty": 1 });

// Virtual for published date
InnerCircleDataSchema.virtual("publishedAt").get(function (this: InnerCircleDataDoc) {
  return this.isPublished ? this.updatedAt : undefined;
});

// Middleware — typed correctly now; "save" hook resolves
InnerCircleDataSchema.pre("save", function (this: InnerCircleDataDoc) {
  if (this.isModified("content")) {
    if (!this.excerpt && this.content) {
      this.excerpt = this.content.substring(0, 250) + "...";
    }
  }
});

// Static methods (leave runtime intact; type-safe enough)
InnerCircleDataSchema.statics.findByTier = function (tier: string) {
  return this.find({
    tierLevel: { $lte: tier },
    isPublished: true,
  });
};

InnerCircleDataSchema.statics.incrementViews = async function (
  id: string,
  userId: string,
  ip: string,
  userAgent: string
) {
  return this.findByIdAndUpdate(
    id,
    {
      $inc: { views: 1 },
      $push: {
        accessLogs: {
          userId,
          accessedAt: new Date(),
          ipAddress: ip,
          userAgent,
        },
      },
    },
    { new: true }
  );
};

const InnerCircleData: Model<InnerCircleDataFields> =
  (mongoose.models.InnerCircleData as Model<InnerCircleDataFields>) ||
  mongoose.model<InnerCircleDataFields>("InnerCircleData", InnerCircleDataSchema);

export default InnerCircleData;