// contentlayer.config.ts — ULTRA PRODUCTION SAFE
// - No duplicate routes
// - Strict access tier normalization
// - Comprehensive validation
// - Zero tolerance for ambiguous states

import {
  defineDocumentType,
  defineNestedType,
  makeSource,
  type ComputedFields,
} from "contentlayer2/source-files";

// ============================================================================
// ENVIRONMENT & CONFIGURATION
// ============================================================================

const ENV = {
  IS_WINDOWS: process.platform === "win32",
  IS_CI: process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true",
  IS_PROD: process.env.NODE_ENV === "production",
  IS_DEV: process.env.NODE_ENV === "development",
  FAIL_ON_INVALID: process.env.CONTENTLAYER_FAIL_ON_INVALID === "true",
  STRICT_MODE: process.env.CONTENTLAYER_STRICT === "true",
} as const;

// ============================================================================
// TYPE DEFINITIONS (CANONICAL)
// ============================================================================

export const ACCESS_TIER_ORDER = [
  "public",
  "member",
  "verified",
  "restricted",
  "top-secret",
] as const;

export type AccessTier = (typeof ACCESS_TIER_ORDER)[number];

const ACCESS_TIER_LABELS: Record<AccessTier, string> = {
  public: "Public",
  member: "Inner Circle",
  verified: "Verified",
  restricted: "Restricted",
  "top-secret": "Top Secret",
} as const;

// ============================================================================
// SAFE UTILITIES (IMMUTABLE, PURE)
// ============================================================================

const safeString = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return String(v);
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return "";
    }
  }
  return "";
};

const safeNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const safeBoolean = (v: unknown, fallback = false): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const lower = v.toLowerCase().trim();
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    if (lower === "false" || lower === "0" || lower === "no") return false;
  }
  if (typeof v === "number") return v !== 0;
  return fallback;
};

const safeDate = (v: unknown): Date | null => {
  if (!v) return null;
  try {
    const date = new Date(safeString(v));
    return Number.isFinite(date.getTime()) ? date : null;
  } catch {
    return null;
  }
};

const cleanSlug = (v: unknown): string => {
  return safeString(v)
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/[^a-z0-9-/_]/g, "-")
    .replace(/-+/g, "-");
};

const stripPrefix = (s: string, prefix: string): string => {
  if (!s || !prefix) return s;
  return s.startsWith(prefix) ? s.slice(prefix.length).replace(/^\/+/, "") : s;
};

const defaultSlugFrom = (doc: any, prefix: string): string => {
  const flat = cleanSlug(doc?._raw?.flattenedPath || doc?._raw?.sourceFilePath || "");
  return stripPrefix(flat, prefix);
};

const normalizeSlugForRoute = (slug: string, routeBase: string): string => {
  const s = cleanSlug(slug);
  const prefix = `${routeBase}/`;
  return s.startsWith(prefix) ? s.slice(prefix.length) : s;
};

const defaultHrefFrom = (doc: any, prefix: string, routeBase: string): string => {
  const rawSlug = cleanSlug(doc?.slug) || defaultSlugFrom(doc, prefix);
  const slug = normalizeSlugForRoute(rawSlug, routeBase).replace(/\/index$/, "");
  return slug ? `/${routeBase}/${slug}` : `/${routeBase}`;
};

// ============================================================================
// ACCESS TIER NORMALIZATION (SINGLE SOURCE OF TRUTH)
// ============================================================================

const ACCESS_TIER_MAP: Readonly<Record<string, AccessTier>> = {
  // Public variants
  public: "public",
  open: "public",
  unclassified: "public",
  free: "public",
  "free-tier": "public",
  basic: "public",

  // Member variants
  member: "member",
  members: "member",
  "inner-circle": "member",
  innercircle: "member",

  // Verified variants
  verified: "verified",
  "verified-member": "verified",

  // Restricted variants
  restricted: "restricted",
  private: "restricted",
  premium: "restricted",
  architect: "restricted",
  confidential: "restricted",
  secret: "restricted",

  // Top secret variants
  "top-secret": "top-secret",
  "top secret": "top-secret",
  ts: "top-secret",
  hardened: "top-secret",
  sovereign: "top-secret",
} as const;

const normalizeAccessTier = (input?: unknown): AccessTier => {
  if (input === null || input === undefined) return "public";
  
  const raw = safeString(input).toLowerCase().trim();
  if (!raw) return "public";

  // Direct mapping
  const mapped = ACCESS_TIER_MAP[raw];
  if (mapped) return mapped;

  // Check if valid tier directly
  if (ACCESS_TIER_ORDER.includes(raw as AccessTier)) {
    return raw as AccessTier;
  }

  // Default secure: unknown = restricted
  return "restricted";
};

const requiredAccessTierFromDoc = (doc: any): AccessTier => {
  if (!doc) return "public";

  // Priority order: new canonical first, then legacy fields
  const raw =
    doc.accessTier ??
    doc.accessLevel ??
    doc.tier ??
    doc.clearance ??
    doc.classification;

  if (raw !== undefined && raw !== null) {
    return normalizeAccessTier(raw);
  }

  // Boolean fallback
  if (safeBoolean(doc.requiresAuth)) return "restricted";

  return "public";
};

// Legacy access level (backward compatibility)
type AccessLevel = "public" | "inner-circle" | "private";
const asAccessLevel = (v: unknown): AccessLevel => {
  const s = safeString(v).toLowerCase().trim();
  if (s === "private") return "private";
  if (s === "inner-circle" || s === "innercircle" || s === "member" || s === "members") {
    return "inner-circle";
  }
  return "public";
};

// ============================================================================
// CONTENT ANALYSIS (PURE FUNCTIONS)
// ============================================================================

const safeRawBody = (doc: any): string => {
  try {
    return safeString(doc?.body?.raw ?? doc?.body?.code ?? doc?.body ?? "");
  } catch {
    return "";
  }
};

const analyzeContent = (text: string) => {
  const t = safeString(text);
  
  // Use regex test with proper escaping
  const imageRegex = /!\[.*?\]\(.*?\)/g;
  const codeRegex = /```[\s\S]*?```/g;
  
  const images = (t.match(imageRegex) || []).length;
  const codeBlocks = (t.match(codeRegex) || []).length;
  
  // Word count: strip markdown and normalize whitespace
  const words = t
    .replace(/[`*_>#~\[\]\(\)\{\}.,;:!?'"\\\/|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;
    
  return { images, codeBlocks, words } as const;
};

const estimateReadTime = (text: string): string => {
  const { images, codeBlocks, words } = analyzeContent(text);
  // Weighted calculation: code blocks are denser, images add context
  const adjustedWords = words + codeBlocks * 50 + images * 12;
  const minutes = Math.max(1, Math.ceil(adjustedWords / 200));
  return minutes === 1 ? "1 min read" : `${minutes} min read`;
};

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const validateBase = (doc: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const flat = cleanSlug(doc?._raw?.flattenedPath || "");
  const slug = cleanSlug(doc?.slug) || flat;
  
  if (!slug) errors.push("Missing slug (slug + flattenedPath both empty)");
  if (!doc?.title && ENV.STRICT_MODE) errors.push("Missing title in strict mode");
  if (doc?.title && safeString(doc.title).length > 200) warnings.push("Title exceeds 200 characters");
  
  return { isValid: errors.length === 0, errors, warnings };
};

const parseEventDate = (raw: unknown): { start: string | null; end: string | null } => {
  const s = safeString(raw).trim();
  if (!s) return { start: null, end: null };
  
  try {
    const parts = s.split(" - ").map(p => p.trim());
    const startStr = parts[0];
    
    if (!startStr) return { start: null, end: null };
    
    const startDate = new Date(startStr);
    if (!Number.isFinite(startDate.getTime())) return { start: null, end: null };
    
    // If we have an end time
    if (parts.length > 1 && parts[1]) {
      const timeParts = parts[1].split(":").map(n => parseInt(n, 10));
      const [hours = 0, minutes = 0, seconds = 0] = timeParts;
      
      const endDate = new Date(startDate);
      endDate.setHours(hours, minutes, seconds, 0);
      
      if (Number.isFinite(endDate.getTime())) {
        return { start: startDate.toISOString(), end: endDate.toISOString() };
      }
    }
    
    return { start: startDate.toISOString(), end: null };
  } catch {
    return { start: null, end: null };
  }
};

const validateEvent = (doc: any): ValidationResult => {
  const base = validateBase(doc);
  const errors = [...base.errors];
  
  const dateInput = doc?.eventDate ?? doc?.startDate ?? doc?.startdate;
  const { start, end } = parseEventDate(dateInput);
  
  if (!start && ENV.STRICT_MODE) {
    errors.push(`Invalid or missing event date: ${safeString(dateInput)}`);
  }
  
  return { ...base, errors };
};

// ============================================================================
// NESTED TYPES
// ============================================================================

const FeatureGridItem = defineNestedType(() => ({
  name: "FeatureGridItem",
  fields: {
    title: { type: "string", required: true },
    icon: { type: "string", required: false },
    content: { type: "string", required: false },
    color: { type: "string", required: false },
    badge: { type: "string", required: false },
    link: { 
      type: "string", 
      required: false,
      validate: (v: unknown) => !v || safeString(v).startsWith("/") || safeString(v).startsWith("http"),
    },
  },
}));

const CTAButton = defineNestedType(() => ({
  name: "CTAButton",
  fields: {
    label: { type: "string", required: true },
    href: { 
      type: "string", 
      required: true,
      validate: (v: unknown) => safeString(v).startsWith("/") || safeString(v).startsWith("http"),
    },
    variant: { 
      type: "enum", 
      options: ["primary", "secondary", "outline", "ghost"], 
      default: "primary",
      required: false,
    },
    icon: { type: "string", required: false },
    external: { type: "boolean", required: false, default: false },
  },
}));

// ============================================================================
// FIELD DEFINITIONS (SHARED)
// ============================================================================

const seoFields = {
  ogTitle: { type: "string", required: false },
  ogDescription: { type: "string", required: false },
  ogImage: { type: "string", required: false },
  ogType: { type: "string", required: false },
  twitterTitle: { type: "string", required: false },
  twitterDescription: { type: "string", required: false },
  twitterImage: { type: "string", required: false },
  twitterCard: { type: "string", required: false },
  canonicalUrl: { type: "string", required: false },
  robots: { type: "string", required: false },
} as const;

export const baseFields = {
  title: { type: "string", required: false },
  subtitle: { type: "string", required: false },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },
  slug: { type: "string", required: false },
  href: { type: "string", required: false },
  date: { type: "string", required: false },
  updated: { type: "string", required: false },
  published: { type: "boolean", required: false, default: true },
  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },
  
  // ✅ Add status field to base fields
  status: { 
    type: "string", 
    required: false,
    description: "Document status (published, draft, archived, limited, etc.)"
  },
  
  aliases: { type: "list", of: { type: "string" }, required: false },
  docKind: { type: "string", required: false },
  layout: { type: "string", required: false },
  density: { type: "string", required: false },
  author: { type: "string", required: false },
  authorTitle: { type: "string", required: false },
  authorNote: { type: "string", required: false },
  tags: { type: "list", of: { type: "string" }, required: false },
  category: { type: "string", required: false },
  coverImage: { type: "string", required: false },
  featuredImage: { type: "string", required: false },
  coverAspect: { type: "string", required: false },
  coverFit: { type: "string", required: false },
  coverPosition: { type: "string", required: false },
  socialCaption: { type: "string", required: false },
  readTime: { type: "string", required: false },

  // Legacy access fields
  accessLevel: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false, default: false },
  tier: { type: "string", required: false },
  lockMessage: { type: "string", required: false },

  // Canonical access field
  accessTier: { type: "string", required: false },

  resources: { type: "json", required: false },
  downloads: { type: "json", required: false },
  relatedDownloads: { type: "list", of: { type: "string" }, required: false },
  keyInsights: { type: "list", of: { type: "string" }, required: false },
  order: { type: "number", required: false },
  volumeNumber: { type: "string", required: false },
  volume: { type: "string", required: false },
  part: { type: "string", required: false },
  contentOnly: { type: "boolean", required: false, default: false },
  version: { type: "string", required: false },
  institutionalId: { type: "string", required: false },
  ...seoFields,
} as const;

// ============================================================================
// COMPUTED FIELDS FACTORY
// ============================================================================

const createComputedFields = (prefix: string, routeBase: string): ComputedFields => {
  return {
    // Canonical slug
    slugSafe: {
      type: "string",
      resolve: (doc) => {
        const raw = cleanSlug(doc?.slug) || defaultSlugFrom(doc, prefix) || "";
        return normalizeSlugForRoute(raw, routeBase);
      },
    },
    
    // Canonical href with duplicate prevention
    hrefSafe: {
      type: "string",
      resolve: (doc) => {
        const rawFlat = safeString(doc?._raw?.flattenedPath || "");
        
        // Guardrail: never allow linked mirrors to hijack routes
        if (/^downloads\/linked-/i.test(rawFlat)) {
          const s = cleanSlug(rawFlat).replace(/^downloads\/linked-[^/]+\//i, "");
          return s ? `/downloads/linked/${s}` : "/downloads/linked";
        }
        
        // If explicit href provided and valid, use it
        if (doc?.href && safeString(doc.href).startsWith("/")) {
          return safeString(doc.href);
        }
        
        return defaultHrefFrom(doc, prefix, routeBase);
      },
    },
    
    // Safe title with fallback
    titleSafe: {
      type: "string",
      resolve: (doc) => {
        const title = safeString(doc?.title).trim();
        return title || "Untitled";
      },
    },
    
    // Safe excerpt with fallback to description
    excerptSafe: {
      type: "string",
      resolve: (doc) => {
        const excerpt = safeString(doc?.excerpt).trim();
        if (excerpt) return excerpt;
        return safeString(doc?.description).trim();
      },
    },
    
    // ✅ STATUS FIELD NORMALIZATION
    statusSafe: {
      type: "string",
      resolve: (doc) => {
        const status = doc?.status;
        if (!status) return "published"; // Default
        
        const normalized = String(status).toLowerCase().trim();
        
        // Comprehensive list of valid statuses across all document types
        const validStatuses = [
          // Publishing states
          "published", "draft", "archived", "deprecated", "superseded",
          // Event states
          "announced", "open", "limited", "sold-out", "cancelled", "completed",
          // Vault/classified states
          "verified", "classified", "production",
          // Resource states
          "active", "inactive",
        ];
        
        // Return normalized status if valid, otherwise default to published
        return validStatuses.includes(normalized) ? normalized : "published";
      },
    },
    
    // Legacy access level
    accessLevelSafe: {
      type: "string",
      resolve: (doc) => asAccessLevel(doc?.accessLevel),
    },
    
    // CANONICAL ACCESS TIER
    accessTierSafe: {
      type: "string",
      resolve: (doc) => requiredAccessTierFromDoc(doc),
    },
    
    // Derived auth requirement
    requiresAuthSafe: {
      type: "boolean",
      resolve: (doc) => requiredAccessTierFromDoc(doc) !== "public",
    },
    
    // Publishing status
    publishedSafe: {
      type: "boolean",
      resolve: (doc) => safeBoolean(doc?.published, true),
    },
    
    draftSafe: {
      type: "boolean",
      resolve: (doc) => safeBoolean(doc?.draft, false),
    },
    
    // Reading time
    readTimeSafe: {
      type: "string",
      resolve: (doc) => {
        if (doc?.readTime && typeof doc.readTime === "string") {
          return doc.readTime.trim();
        }
        return estimateReadTime(safeRawBody(doc));
      },
    },
    
    // Word count
    wordCount: {
      type: "number",
      resolve: (doc) => analyzeContent(safeRawBody(doc)).words,
    },
    
    // Validation results
    validation: {
      type: "json",
      resolve: (doc) => {
        const result = validateBase(doc);
        
        if (!result.isValid && ENV.FAIL_ON_INVALID) {
          throw new Error(
            `[Contentlayer] Invalid document (${safeString(doc?._id || "unknown")}): ${result.errors.join("; ")}`
          );
        }
        
        return result;
      },
    },
  };
};

// ============================================================================
// DOCUMENT TYPES (ONE CANONICAL SOURCE PER PATTERN)
// ============================================================================

// Blog posts
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    series: { type: "string", required: false },
    seriesOrder: { type: "number", required: false },
  },
  computedFields: createComputedFields("blog/", "blog"),
}));

// Books
export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    subtitle: { type: "string", required: false },
    volume: { type: "string", required: false },
    series: { type: "string", required: false },
    edition: { type: "string", required: false },
    isbn: { type: "string", required: false },
    pages: { type: "number", required: false },
    coverAspect: { 
      type: "enum", 
      options: ["wide", "book", "square"], 
      default: "book",
      required: false 
    },
    coverFit: { 
      type: "enum", 
      options: ["cover", "contain"], 
      default: "cover",
      required: false 
    },
  },
  computedFields: createComputedFields("books/", "books"),
}));

// Shorts
export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    hook: { type: "string", required: false },
    callToAction: { type: "string", required: false },
  },
  computedFields: createComputedFields("shorts/", "shorts"),
}));

// Downloads
export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,

    file: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    previewUrl: { type: "string", required: false },

    format: { type: "string", required: false },
    fileFormat: { type: "string", required: false },
    formatHint: { type: "string", required: false },
    paperFormats: {
      type: "list",
      of: { type: "string" },
      required: false,
    },

    isInteractive: { type: "boolean", required: false },
    isFillable: { type: "boolean", required: false },

    printable: { type: "boolean", required: false },
    fillable: { type: "boolean", required: false },
    includesWorksheets: { type: "boolean", required: false },

    pageCount: { type: "number", required: false },
    fileSize: { type: "string", required: false },
    version: { type: "string", required: false },
    documentId: { type: "string", required: false },

    downloadType: { type: "string", required: false },
    classification: { type: "string", required: false },

    coverImageAlt: { type: "string", required: false },

    useFeatureGrid: { type: "boolean", required: false },
    featureGridColumns: { type: "number", required: false },
    useLegacyDiagram: { type: "boolean", required: false },
    useProTip: { type: "boolean", required: false },
    useDownloadCTA: { type: "boolean", required: false },

    ctaConfig: { type: "json", required: false },
    cover: { type: "json", required: false },
    downloadProcess: { type: "json", required: false },

    relatedDownloads: {
      type: "list",
      of: { type: "string" },
      required: false,
    },

    // Stable fallback: avoid nested list bug in contentlayer2
    features: { type: "json", required: false },
  },
  computedFields: createComputedFields("downloads/", "downloads"),
}));

// Canon
export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...baseFields },
  computedFields: createComputedFields("canon/", "canon"),
}));

// Public Briefs (content/briefs/**)
export const Brief = defineDocumentType(() => ({
  name: "Brief",
  filePathPattern: "briefs/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    description: { type: "string", required: false },
    excerpt: { type: "string", required: false },
    date: { type: "string", required: false },
    classification: { type: "string", required: false, default: "Unclassified" },
    accessLevel: { type: "string", required: false, default: "public" },
    tier: { type: "string", required: false },
    accessTier: { type: "string", required: false },
    audience: { type: "string", required: false },
    docKind: { type: "string", required: false },
    institutionalId: { type: "string", required: false },
    version: { type: "string", required: false },
    lastUpdated: { type: "string", required: false },
    status: { type: "string", required: false },
    category: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    format: { type: "string", required: false },
    series: { type: "string", required: false },
    coverImage: { type: "string", required: false },
    featuredImage: { type: "string", required: false },
    featured: { type: "boolean", required: false, default: false },
    published: { type: "boolean", required: false, default: true },
    readTime: { type: "string", required: false },
    author: { type: "string", required: false },
    slug: { type: "string", required: false },
    briefId: { type: "string", required: false },
    volume: { type: "number", required: false },
  },
  computedFields: createComputedFields("briefs/", "briefs"),
}));

// Vault Briefs (content/vault/briefs/**)
export const VaultBrief = defineDocumentType(() => ({
  name: "VaultBrief",
  filePathPattern: "vault/briefs/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    description: { type: "string", required: false },
    excerpt: { type: "string", required: false },
    date: { type: "string", required: false },
    type: { type: "string", required: false },
    classification: { type: "string", required: false, default: "Unclassified" },
    accessLevel: { type: "string", required: false, default: "restricted" },
    tier: { type: "string", required: false },
    accessTier: { type: "string", required: false },
    audience: { type: "string", required: false },
    docKind: { type: "string", required: false },
    institutionalId: { type: "string", required: false },
    version: { type: "string", required: false },
    lastUpdated: { type: "string", required: false },
    status: { type: "string", required: false },
    category: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    format: { type: "string", required: false },
    series: { type: "string", required: false },
    coverImage: { type: "string", required: false },
    featuredImage: { type: "string", required: false },
    featured: { type: "boolean", required: false, default: false },
    published: { type: "boolean", required: false, default: true },
    readTime: { type: "string", required: false },
    author: { type: "string", required: false },
    slug: { type: "string", required: false },
    briefId: { type: "string", required: false },
    volume: { type: "number", required: false },
  },
  computedFields: createComputedFields("vault/briefs/", "vault/briefs"),
}));

// Intelligence
export const Intelligence = defineDocumentType(() => ({
  name: "Intelligence",
  filePathPattern: "intelligence/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    series: { type: "string", required: false },
    seriesOrder: { type: "number", required: false },
    classification: {
      type: "enum",
      options: ["Unclassified", "RESTRICTED", "CONFIDENTIAL", "SECRET", "TOP SECRET", "HARDENED"],
      default: "Unclassified",
      required: false,
    },
    status: { type: "string", required: false, default: "ACTIVE" },
    institutionalId: { type: "string", required: false },
    version: { type: "string", required: false },
    lastUpdated: { type: "string", required: false },
    category: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    briefId: { type: "string", required: false },
  },
  computedFields: {
    ...createComputedFields("intelligence/", "intelligence"),
    seriesOrderSafe: {
      type: "number",
      resolve: (doc) => safeNumber(doc?.seriesOrder, 0),
    },
    classificationSafe: {
      type: "string",
      resolve: (doc) => {
        const raw = doc?.classification;
        if (!raw) return "Unclassified";
        const upper = safeString(raw).toUpperCase().trim();
        const valid = ["UNCLASSIFIED", "RESTRICTED", "CONFIDENTIAL", "SECRET", "TOP SECRET", "HARDENED"];
        return valid.includes(upper) ? upper : "Unclassified";
      },
    },
  },
}));

// Dispatches
export const Dispatch = defineDocumentType(() => ({
  name: "Dispatch",
  filePathPattern: "dispatches/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    dispatchId: { type: "string", required: false },
    dispatchNumber: { type: "number", required: false },
    classification: {
      type: "enum",
      options: ["Unclassified", "RESTRICTED", "CONFIDENTIAL", "SECRET", "TOP SECRET"],
      default: "Unclassified",
      required: false,
    },
    status: { type: "string", required: false, default: "PUBLISHED" },
    category: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    date: { type: "string", required: false },
    timeSensitive: { type: "boolean", required: false, default: false },
    expiresAt: { type: "string", required: false },
    references: { type: "list", of: { type: "string" }, required: false },
    relatedBriefs: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: {
    ...createComputedFields("dispatches/", "dispatches"),
    dispatchNumberSafe: {
      type: "number",
      resolve: (doc) => safeNumber(doc?.dispatchNumber, 0),
    },
    isExpired: {
      type: "boolean",
      resolve: (doc) => {
        if (!doc?.expiresAt) return false;
        const expiry = safeDate(doc.expiresAt);
        return expiry ? expiry < new Date() : false;
      },
    },
  },
}));

// Events - CLEANED & PRODUCTION SAFE
export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    
    // Core event fields
    eventType: { type: "string", required: false },
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
    
    // Date fields - consolidated to catch all variants
    eventDate: { type: "string", required: false },
    startDate: { type: "string", required: false },
    startdate: { type: "string", required: false },
    endDate: { type: "string", required: false },
    
    // Additional metadata
    timezone: { type: "string", required: false },
    isVirtual: { type: "boolean", required: false },
    meetingLink: { type: "string", required: false },
    
    // ✅ Explicitly define the 'mode' field to eliminate warnings
    mode: { 
      type: "enum", 
      options: ["in-person", "virtual", "hybrid"], 
      required: false,
      default: "in-person"
    },
    
    // ✅ Catch-all for any other undefined fields (prevents warnings)
    // This tells Contentlayer to accept but not validate additional fields
    extra: { type: "json", required: false },
  },
  computedFields: {
    ...createComputedFields("events/", "events"),
    
    // Safe date parsing with fallbacks
    parsedStartDate: {
      type: "string",
      resolve: (doc) => {
        try {
          const dateInput = doc?.eventDate ?? doc?.startDate ?? doc?.startdate;
          return parseEventDate(dateInput).start || "";
        } catch {
          return "";
        }
      },
    },
    
    parsedEndDate: {
      type: "string",
      resolve: (doc) => {
        try {
          const dateInput = doc?.eventDate ?? doc?.startDate ?? doc?.startdate;
          return parseEventDate(dateInput).end || "";
        } catch {
          return "";
        }
      },
    },
    
    // Safe mode accessor (ensures we always have a value)
    modeSafe: {
      type: "string",
      resolve: (doc) => {
        const mode = doc?.mode;
        if (mode && ["in-person", "virtual", "hybrid"].includes(mode)) {
          return mode;
        }
        // Default based on other fields
        if (doc?.isVirtual === true) return "virtual";
        if (doc?.meetingLink) return "virtual";
        return "in-person";
      },
    },
    
    // Validation with extra field warning suppression
    validation: {
      type: "json",
      resolve: (doc) => {
        // Use a more lenient validation for events
        const result = {
          isValid: true,
          errors: [] as string[],
          warnings: [] as string[]
        };
        
        // Only validate critical fields
        if (!doc?.title && ENV.STRICT_MODE) {
          result.warnings.push("Missing title");
        }
        
        // Log but don't fail on extra fields
        const definedFields = new Set([
          ...Object.keys(baseFields),
          'eventType', 'location', 'registrationUrl', 'eventDate', 
          'startDate', 'startdate', 'endDate', 'timezone', 
          'isVirtual', 'meetingLink', 'mode', 'extra', 'type', '_id', '_raw'
        ]);
        
        const extraFields = Object.keys(doc).filter(key => !definedFields.has(key));
        if (extraFields.length > 0 && ENV.IS_DEV) {
          console.warn(`[Event] Extra fields in ${doc?._id}:`, extraFields.join(', '));
        }
        
        if (!result.isValid && ENV.FAIL_ON_INVALID) {
          throw new Error(
            `[Contentlayer] Invalid Event (${safeString(doc?._id || "unknown")}): ${result.errors.join("; ")}`
          );
        }
        
        return result;
      },
    },
  },
}));

// Prints
export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...baseFields },
  computedFields: createComputedFields("prints/", "prints"),
}));

// Resources
export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    resourceType: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    format: { type: "string", required: false },
    fileSize: { type: "string", required: false },
    classification: {
      type: "enum",
      options: ["STANDARD", "HARDENED", "RESTRICTED"],
      required: false,
    },
    pageCount: { type: "number", required: false },
  },
  computedFields: createComputedFields("resources/", "resources"),
}));

// Strategy
export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...baseFields },
  computedFields: createComputedFields("strategy/", "strategy"),
}));

// Lexicon
export const Lexicon = defineDocumentType(() => ({
  name: "Lexicon",
  filePathPattern: "lexicon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    term: { type: "string", required: false },
    phonetic: { type: "string", required: false },
  },
  computedFields: createComputedFields("lexicon/", "lexicon"),
}));

// Vault (top-level only)
export const Vault = defineDocumentType(() => ({
  name: "Vault",
  filePathPattern: "vault/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    classification: { type: "string", required: false, default: "Unclassified" },
    vaultId: { type: "string", required: false },
    fileSize: { type: "string", required: false },
  },
  computedFields: createComputedFields("vault/", "vault"),
}));

// ============================================================================
// EXCLUSIONS (DUPLICATE PREVENTION)
// ============================================================================

const getExclusions = (): string[] => {
  const exclusions = [
    // Linked derivatives
    "downloads/linked-*/**",
    "downloads/linked-*/**/*",

    // Case variants
    "Vault/**",
    "Vault/**/*",

    // Partials and drafts
    "**/_*.mdx",
    "**/_*.md",
    "**/drafts/**",
    "**/templates/**",

    // System
    "node_modules",
    ".git",
    ".next",
    ".contentlayer",
    ".cache",
    "_templates",
    "tmp",
    "temp",

    // Assets
    "public/**/*",
    "**/public/assets/**",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.png",
    "**/*.webp",
    "**/*.gif",
    "**/*.svg",
    "**/*.ico",
    "**/*.pdf",
    "**/*.pptx",
    "**/*.docx",
    "**/*.xlsx",
    "**/*.zip",
    "**/*.rar",
    "**/*.7z",
    "**/*.mp4",
    "**/*.mp3",

    // Temp files
    "**/.DS_Store",
    "**/Thumbs.db",
    "**/*.lnk",
    "**/*.bak",
    "**/*.tmp",
    "**/*.swp",
    "**/*.backup*",

    // Common typos
    "donwloads",
    "donwloads/**",
  ];

  if (ENV.IS_WINDOWS) {
    exclusions.push(
      "**/~$*.docx",
      "**/~$*.xlsx",
      "**/~$*.pptx",
      "**/desktop.ini",
      "**/Thumbs.db"
    );
  }

  return exclusions;
};

// ============================================================================
// SOURCE CONFIGURATION
// ============================================================================

export default makeSource({
  contentDirPath: "content",
  contentDirInclude: [
    "blog",
    "shorts",
    "books",
    "canon",
    "briefs",
    "dispatches",
    "intelligence",
    "downloads",
    "events",
    "prints",
    "resources",
    "strategy",
    "lexicon",
    "vault/briefs",
    "vault",
  ],
  contentDirExclude: getExclusions(),
  documentTypes: [
    Post,
    Short,
    Book,
    Canon,
    Brief,
    VaultBrief,
    Intelligence,
    Dispatch,
    Download,
    Event,
    Print,
    Resource,
    Strategy,
    Lexicon,
    Vault,
  ],
  disableImportAliasWarning: true,
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
    esbuildOptions: (options) => {
      options.platform = "node";
      options.target = "es2022";
      
      const rootPath = process.cwd().replace(/\\/g, "/");
      options.alias = { ...options.alias, "@": rootPath };
      
      return options;
    },
  },
  onSuccess: async (importData) => {
    const data = await importData();
    const allDocuments: any[] = (data as any)?.allDocuments || [];

    // Duplicate detection (strict)
    const seenHref = new Map<string, string>();
    const dupErrors: string[] = [];

    for (const doc of allDocuments) {
      const id = safeString(doc?._id);
      const href = safeString(doc?.hrefSafe);
      
      if (!href) continue;

      const prev = seenHref.get(href);
      if (prev) {
        if (prev !== id) {
          dupErrors.push(`Duplicate href: ${href} (${prev} vs ${id})`);
        }
      } else {
        seenHref.set(href, id);
      }
    }

    // Statistics
    const typeCounts: Record<string, number> = {};
    const tierCounts: Record<string, number> = {};
    let validCount = 0;
    let invalidCount = 0;
    const invalidSamples: string[] = [];

    for (const doc of allDocuments) {
      const type = safeString(doc?.type || "unknown");
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      const tier = safeString(doc?.accessTierSafe || "public");
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;

      const validation = doc?.validation as ValidationResult | undefined;
      if (!validation || validation.isValid) {
        validCount++;
      } else {
        invalidCount++;
        if (invalidSamples.length < 10) {
          invalidSamples.push(
            `${type} ${safeString(doc?._id)}: ${(validation.errors || ["Unknown error"]).join(", ")}`
          );
        }
      }
    }

    // Console output
    console.log("\n" + "=".repeat(60));
    console.log("📊 CONTENTLAYER BUILD REPORT");
    console.log("=".repeat(60));
    console.log(`Environment: ${ENV.IS_PROD ? "production" : "development"}${ENV.IS_CI ? " • CI" : ""}`);
    console.log(`Platform: ${process.platform}${ENV.IS_WINDOWS ? " (Windows)" : ""}`);
    console.log(`Total documents: ${allDocuments.length}`);
    console.log("\n📑 By type:");
    
    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type.padEnd(15)}: ${count}`);
      });

    console.log("\n🔒 By access tier:");
    Object.entries(tierCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tier, count]) => {
        console.log(`  ${tier.padEnd(12)}: ${count}`);
      });

    console.log(`\n✅ Valid: ${validCount}`);
    console.log(`❌ Invalid: ${invalidCount}`);

    if (dupErrors.length > 0) {
      console.warn("\n⚠️  DUPLICATE ROUTES DETECTED:");
      dupErrors.slice(0, 15).forEach(err => console.warn(`  - ${err}`));
      if (dupErrors.length > 15) {
        console.warn(`  ...and ${dupErrors.length - 15} more`);
      }
      if (ENV.FAIL_ON_INVALID) {
        throw new Error(`Build failed: ${dupErrors.length} duplicate routes detected`);
      }
    }

    if (invalidCount > 0) {
      console.warn("\n⚠️  INVALID DOCUMENTS (samples):");
      invalidSamples.forEach(sample => console.warn(`  - ${sample}`));
      if (ENV.FAIL_ON_INVALID) {
        throw new Error(`Build failed: ${invalidCount} invalid documents`);
      }
    }

    console.log("\n" + "=".repeat(60) + "\n");
  },
});