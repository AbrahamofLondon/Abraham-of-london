// contentlayer.config.ts — ULTRA PRODUCTION SAFE / WINDOWS-TOLERANT
// -----------------------------------------------------------------------------
// Goals
// - No undefined plugin references
// - Stable route generation
// - Clear validation and reporting
// - Duplicate route detection
// - Broad document coverage without muddy route collisions
// -----------------------------------------------------------------------------

import path from "path";
import { fileURLToPath } from "url";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  defineDocumentType,
  makeSource,
  type ComputedFields,
} from "contentlayer2/source-files";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// ENVIRONMENT
// ============================================================================

const ENV = {
  IS_WINDOWS: process.platform === "win32",
  IS_CI: process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true",
  IS_PROD: process.env.NODE_ENV === "production",
  STRICT_MODE: process.env.CONTENTLAYER_STRICT === "true",
  FAIL_ON_INVALID: process.env.CONTENTLAYER_FAIL_ON_INVALID === "true",
} as const;

// ============================================================================
// TYPES
// ============================================================================

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

type AccessTier = "public" | "member" | "verified" | "restricted" | "top-secret";

// ============================================================================
// DECISION METADATA FIELDS — APPLIES TO ALL DOCUMENT TYPES
// ============================================================================

const decisionMetadataFields = {
  decisionMetadata: {
    type: "json",
    required: false,
    description: "Decision intelligence metadata for asset classification and matching",
  },
} as const;

// ============================================================================
// SAFE UTILITIES
// ============================================================================

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function safeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(s)) return true;
    if (["false", "0", "no", "n"].includes(s)) return false;
  }
  return fallback;
}

function safeDate(value: unknown): Date | null {
  const s = safeString(value).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function cleanSlug(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/\/{2,}/g, "/")
    .toLowerCase();
}

function normalizeRouteSegment(input: unknown): string {
  return cleanSlug(input)
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/index$/i, "");
}

function stripPrefix(input: string, prefix: string): string {
  const normalized = normalizeRouteSegment(input);
  const p = normalizeRouteSegment(prefix);
  if (!normalized) return "";
  if (!p) return normalized;
  return normalized.startsWith(`${p}/`) ? normalized.slice(p.length + 1) : normalized;
}

function defaultSlugFrom(doc: any, prefix: string): string {
  const raw =
    safeString(doc?.slug) ||
    safeString(doc?._raw?.flattenedPath) ||
    safeString(doc?._raw?.sourceFilePath) ||
    safeString(doc?._raw?.sourceFileName);

  return stripPrefix(raw, prefix);
}

function defaultHrefFrom(doc: any, prefix: string, routeBase: string): string {
  const slug = defaultSlugFrom(doc, prefix);
  return slug ? `/${routeBase}/${slug}` : `/${routeBase}`;
}

function safeRawBody(doc: any): string {
  if (typeof doc?.body?.raw === "string") return doc.body.raw;
  if (typeof doc?.raw === "string") return doc.raw;
  if (typeof doc?.content === "string") return doc.content;
  if (typeof doc?.mdx === "string") return doc.mdx;
  return "";
}

function stripMdxNoise(input: string): string {
  return String(input || "")
    .replace(/^import\s.+$/gm, "")
    .replace(/^export\s.+$/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_>#~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadTime(text: string): string {
  const plain = stripMdxNoise(text);
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function parseEventDate(raw: unknown): { start: string | null; end: string | null } {
  const s = safeString(raw).trim();
  if (!s) return { start: null, end: null };

  const direct = safeDate(s);
  if (direct) return { start: direct.toISOString(), end: null };

  const parts = s.split(" - ").map((p) => p.trim());
  const start = safeDate(parts[0]);
  if (!start) return { start: null, end: null };

  if (parts[1]) {
    const end = safeDate(parts[1]);
    if (end) return { start: start.toISOString(), end: end.toISOString() };
  }

  return { start: start.toISOString(), end: null };
}

function normalizeAccessTier(input: unknown): AccessTier {
  const raw = safeString(input).trim().toLowerCase();

  if (!raw) return "public";

  const map: Record<string, AccessTier> = {
    public: "public",
    open: "public",
    free: "public",
    unclassified: "public",

    member: "member",
    members: "member",
    "inner-circle": "member",
    innercircle: "member",

    verified: "verified",
    "verified-member": "verified",

    restricted: "restricted",
    private: "restricted",
    premium: "restricted",
    confidential: "restricted",
    secret: "restricted",

    "top-secret": "top-secret",
    "top secret": "top-secret",
    hardened: "top-secret",
    sovereign: "top-secret",
  };

  return map[raw] ?? "restricted";
}

function validateBase(doc: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const flattened = cleanSlug(doc?._raw?.flattenedPath || "");
  const slug = cleanSlug(doc?.slug || flattened);

  if (!slug) errors.push("Missing slug / flattenedPath");
  if (!doc?.title && ENV.STRICT_MODE) errors.push("Missing title in strict mode");
  if (safeString(doc?.title).length > 200) warnings.push("Title exceeds 200 characters");

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// SHARED FIELDS
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

const baseFields = {
  title: { type: "string", required: false },
  subtitle: { type: "string", required: false },
  summary: { type: "string", required: false },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },
  slug: { type: "string", required: false },
  href: { type: "string", required: false },
  date: { type: "string", required: false },
  updated: { type: "string", required: false },
  published: { type: "boolean", required: false, default: true },
  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },
  status: { type: "string", required: false },
  aliases: { type: "list", of: { type: "string" }, required: false },
  docKind: { type: "string", required: false },
  type: { type: "string", required: false },
  layout: { type: "string", required: false },
  density: { type: "string", required: false },
  section: { type: "string", required: false },
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

  // Access metadata. Keep both legacy and newer frontmatter keys supported.
  access: {
    type: "enum",
    options: ["public", "member", "restricted", "paid"],
    required: false,
  },
  accessLevel: { type: "string", required: false },
  accessTier: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false, default: false },
  tier: { type: "string", required: false },
  lockMessage: { type: "string", required: false },

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
  ...decisionMetadataFields,
} as const;

// ============================================================================
// COMPUTED FIELDS FACTORY
// ============================================================================

function createComputedFields(prefix: string, routeBase: string): ComputedFields {
  return {
    slugSafe: {
      type: "string",
      resolve: (doc) => defaultSlugFrom(doc, prefix),
    },

    hrefSafe: {
      type: "string",
      resolve: (doc) => {
        const rawHref = safeString(doc?.href);
        if (rawHref.startsWith("/")) return rawHref;
        return defaultHrefFrom(doc, prefix, routeBase);
      },
    },

    titleSafe: {
      type: "string",
      resolve: (doc) => {
        const title = safeString(doc?.title).trim();
        if (title) return title;

        const filename = safeString(doc?._raw?.sourceFileName).replace(/\.mdx?$/i, "");
        return filename || "Untitled";
      },
    },

    excerptSafe: {
      type: "string",
      resolve: (doc) => {
        const excerpt = safeString(doc?.excerpt).trim();
        if (excerpt) return excerpt;

        const description = safeString(doc?.description).trim();
        if (description) return description;

        const plain = stripMdxNoise(safeRawBody(doc));
        return plain ? `${plain.slice(0, 160)}${plain.length > 160 ? "..." : ""}` : "";
      },
    },

    accessTierSafe: {
      type: "string",
      resolve: (doc) =>
        normalizeAccessTier(
          doc?.accessTier ?? doc?.accessLevel ?? doc?.tier ?? doc?.classification
        ),
    },

    requiresAuthSafe: {
      type: "boolean",
      resolve: (doc) => {
        const tier = normalizeAccessTier(
          doc?.accessTier ?? doc?.accessLevel ?? doc?.tier ?? doc?.classification
        );
        return tier !== "public" || safeBoolean(doc?.requiresAuth, false);
      },
    },

    publishedSafe: {
      type: "boolean",
      resolve: (doc) => safeBoolean(doc?.published, true) && !safeBoolean(doc?.draft, false),
    },

    readTimeSafe: {
      type: "string",
      resolve: (doc) => {
        const raw = safeString(doc?.readTime).trim();
        return raw || estimateReadTime(safeRawBody(doc));
      },
    },

    validation: {
      type: "json",
      resolve: (doc) => validateBase(doc),
    },
  };
}

// ============================================================================
// DOCUMENT TYPES — ALL INCLUDE decisionMetadata VIA baseFields
// ============================================================================

const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    series: { type: "string", required: false },
    seriesOrder: { type: "number", required: false },
    seriesTitle: { type: "string", required: false },
    seriesDescription: { type: "string", required: false },
  },
  computedFields: createComputedFields("blog/", "blog"),
}));

const EditorialSeriesPart = defineDocumentType(() => ({
  name: "EditorialSeriesPart",
  filePathPattern: "editorial-series/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    series: { type: "string", required: true },
    seriesOrder: { type: "number", required: true },
    seriesTitle: { type: "string", required: false },
    seriesDescription: { type: "string", required: false },
  },
  computedFields: createComputedFields("editorial-series/", "editorials/series"),
}));

const Book = defineDocumentType(() => ({
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
      required: false,
    },
    coverFit: {
      type: "enum",
      options: ["cover", "contain"],
      default: "cover",
      required: false,
    },
  },
  computedFields: createComputedFields("books/", "books"),
}));

const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    hook: { type: "string", required: false },
    callToAction: { type: "string", required: false },
    theme: { type: "string", required: false },
    // Lineage/source fields for derived dispatches (e.g. The Burden Changes Hands shorts)
    collection: { type: "string", required: false },
    sourceSeries: { type: "string", required: false },
    sourceEssay: { type: "string", required: false },
  },
  computedFields: createComputedFields("shorts/", "shorts"),
}));

const Download = defineDocumentType(() => ({
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
    paperFormats: { type: "list", of: { type: "string" }, required: false },
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
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    features: { type: "json", required: false },
    // Cross-reference fields for MDX-only companion editions
    publicPath: { type: "string", required: false },
    canonicalEditorialPath: { type: "string", required: false },
  },
  computedFields: createComputedFields("downloads/", "downloads"),
}));

const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...baseFields },
  computedFields: createComputedFields("canon/", "canon"),
}));

const Brief = defineDocumentType(() => ({
  name: "Brief",
  filePathPattern: "briefs/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    classification: { type: "string", required: false, default: "Unclassified" },
    audience: { type: "string", required: false },
    format: { type: "string", required: false },
    briefId: { type: "string", required: false },
    volume: { type: "number", required: false },
    lastUpdated: { type: "string", required: false },
    series: { type: "string", required: false },
    seriesOrder: { type: "number", required: false },
  },
  computedFields: createComputedFields("briefs/", "briefs"),
}));

const VaultBrief = defineDocumentType(() => ({
  name: "VaultBrief",
  filePathPattern: "vault/briefs/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    type: { type: "string", required: false },
    classification: { type: "string", required: false, default: "Unclassified" },
    accessLevel: { type: "string", required: false, default: "restricted" },
    audience: { type: "string", required: false },
    format: { type: "string", required: false },
    briefId: { type: "string", required: false },
    volume: { type: "number", required: false },
    lastUpdated: { type: "string", required: false },
    series: { type: "string", required: false },
    seriesOrder: { type: "number", required: false },
  },
  computedFields: createComputedFields("vault/briefs/", "vault/briefs"),
}));

const Intelligence = defineDocumentType(() => ({
  name: "Intelligence",
  filePathPattern: "intelligence/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,

    // Collection/index metadata used by content/intelligence/index.mdx
    summary: { type: "string", required: false },
    access: {
      type: "enum",
      options: ["public", "member", "restricted", "paid"],
      required: false,
    },
    section: { type: "string", required: false },

    series: { type: "string", required: false },
    seriesOrder: { type: "number", required: false },
    classification: {
      type: "enum",
      options: ["Unclassified", "RESTRICTED", "CONFIDENTIAL", "SECRET", "TOP SECRET", "HARDENED"],
      default: "Unclassified",
      required: false,
    },
    briefId: { type: "string", required: false },
    lastUpdated: { type: "string", required: false },

    // Market Intelligence lifecycle governance frontmatter.
    docId: { type: "string", required: false },
    lifecycleState: { type: "string", required: false },
    coveragePeriod: { type: "string", required: false },
    currentDecisionWindow: { type: "string", required: false },
    replaces: { type: "string", required: false },
    publicVisible: { type: "boolean", required: false },
    purchasable: { type: "boolean", required: false },
    publicationStatus: { type: "string", required: false },
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
        const raw = safeString(doc?.classification).toUpperCase().trim();
        const valid = ["UNCLASSIFIED", "RESTRICTED", "CONFIDENTIAL", "SECRET", "TOP SECRET", "HARDENED"];
        return valid.includes(raw) ? raw : "Unclassified";
      },
    },
  },
}));

const Dispatch = defineDocumentType(() => ({
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
        const expiry = safeDate(doc?.expiresAt);
        return expiry ? expiry < new Date() : false;
      },
    },
  },
}));

const LinkedInOutbound = defineDocumentType(() => ({
  name: "LinkedInOutbound",
  filePathPattern: "outbound/linkedin/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: false },
    description: { type: "string", required: false },
    author: { type: "string", required: false },
    platform: { type: "string", required: false },
    sequence: { type: "number", required: false },
    channel: {
      type: "enum",
      options: ["linkedin"],
      required: false,
    },
    contentType: {
      type: "enum",
      options: ["post", "article", "caption", "script"],
      required: false,
    },
    status: {
      type: "enum",
      options: ["draft", "ready", "published", "posted", "retired"],
      required: false,
    },
    draft: { type: "boolean", required: false },
    published: { type: "boolean", required: false },
    date: { type: "string", required: false },
    category: {
      type: "enum",
      options: ["Outbound"],
      required: false,
    },
    tier: {
      type: "enum",
      options: ["public", "restricted", "internal"],
      required: false,
    },
    campaign: { type: "string", required: false },
    series: { type: "string", required: false },
    productLine: { type: "string", required: false },
    linkedProduct: { type: "string", required: false },
    linkedReportId: { type: "string", required: false },
    publicationGate: { type: "string", required: false },
    notBefore: { type: "string", required: false },
    postedAt: { type: "string", required: false },
    canonicalUrl: { type: "string", required: false },
    linkedinUrl: { type: "string", required: false },
    claimRisk: {
      type: "enum",
      options: ["LOW", "MEDIUM", "HIGH"],
      required: false,
    },
    requiresLifecycleCheck: { type: "boolean", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    hashtags: { type: "list", of: { type: "string" }, required: false },
    // Campaign-specific fields for the-burden-changes-hands outbound dispatches
    id: { type: "string", required: false },
    provider: { type: "string", required: false },
    postType: { type: "string", required: false },
    sourcePart: { type: "number", required: false },
    sourceSeries: { type: "string", required: false },
    sourceMaterial: { type: "string", required: false },
    sourcePath: { type: "string", required: false },
    approvalStatus: { type: "string", required: false },
    seriesWeek: { type: "number", required: false },
    scheduledFor: { type: "string", required: false },
    link: { type: "string", required: false },
    imagePath: { type: "string", required: false },
    requiresFinalApproval: { type: "boolean", required: false },
    syncTargets: { type: "json", required: false },
    tone: { type: "string", required: false },
    themes: { type: "list", of: { type: "string" }, required: false },
    createdBy: { type: "string", required: false },
  },
  computedFields: createComputedFields("outbound/linkedin/", "outbound/linkedin"),
}));

const FacebookOutbound = defineDocumentType(() => ({
  name: "FacebookOutbound",
  filePathPattern: "outbound/facebook/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    type: { type: "string", required: false },
    title: { type: "string", required: false },
    description: { type: "string", required: false },
    date: { type: "string", required: false },
    id: { type: "string", required: false },
    provider: { type: "string", required: false },
    postType: { type: "string", required: false },
    sourceType: { type: "string", required: false },
    sourceSlug: { type: "string", required: false },
    sourcePart: { type: "number", required: false },
    sourceSeries: { type: "string", required: false },
    sourceMaterial: { type: "string", required: false },
    sourcePath: { type: "string", required: false },
    campaign: { type: "string", required: false },
    series: { type: "string", required: false },
    status: { type: "string", required: false },
    approvalStatus: { type: "string", required: false },
    scheduledFor: { type: "date", required: false },
    assetUrl: { type: "string", required: false },
    link: { type: "string", required: false },
    imagePath: { type: "string", required: false },
    tone: { type: "string", required: false },
    theme: { type: "list", of: { type: "string" }, required: false },
    themes: { type: "list", of: { type: "string" }, required: false },
    createdBy: { type: "string", required: false },
    requiresFinalApproval: { type: "boolean", required: false },
    syncTargets: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace(/^outbound\/facebook\//, ""),
    },
  },
}));

const XOutbound = defineDocumentType(() => ({
  name: "XOutbound",
  filePathPattern: "outbound/x/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    type: { type: "string", required: false },
    title: { type: "string", required: false },
    description: { type: "string", required: false },
    date: { type: "string", required: false },
    id: { type: "string", required: false },
    provider: { type: "string", required: false },
    postType: { type: "string", required: false },
    sourceType: { type: "string", required: false },
    sourceSlug: { type: "string", required: false },
    sourcePart: { type: "number", required: false },
    sourceSeries: { type: "string", required: false },
    sourceMaterial: { type: "string", required: false },
    sourcePath: { type: "string", required: false },
    campaign: { type: "string", required: false },
    series: { type: "string", required: false },
    status: { type: "string", required: false },
    approvalStatus: { type: "string", required: false },
    scheduledFor: { type: "date", required: false },
    assetUrl: { type: "string", required: false },
    link: { type: "string", required: false },
    imagePath: { type: "string", required: false },
    tone: { type: "string", required: false },
    theme: { type: "list", of: { type: "string" }, required: false },
    themes: { type: "list", of: { type: "string" }, required: false },
    createdBy: { type: "string", required: false },
    requiresFinalApproval: { type: "boolean", required: false },
    syncTargets: { type: "list", of: { type: "string" }, required: false },
    // X-specific / thread-friendly fields
    threadId: { type: "string", required: false },
    threadOrder: { type: "number", required: false },
    threadIndex: { type: "number", required: false },
    threadPosition: { type: "number", required: false },
    threadTotal: { type: "number", required: false },
    threadLabel: { type: "string", required: false },
    thread: { type: "boolean", required: false },
    xCharCount: { type: "number", required: false },
    characterCount: { type: "number", required: false },
    // Design brief for quote card assets
    designBrief: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace(/^outbound\/x\//, ""),
    },
  },
}));

const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    eventType: { type: "string", required: false },
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
    eventDate: { type: "string", required: false },
    startDate: { type: "string", required: false },
    startdate: { type: "string", required: false },
    endDate: { type: "string", required: false },
    timezone: { type: "string", required: false },
    isVirtual: { type: "boolean", required: false },
    meetingLink: { type: "string", required: false },
    mode: {
      type: "enum",
      options: ["in-person", "virtual", "hybrid"],
      required: false,
      default: "in-person",
    },
    extra: { type: "json", required: false },
  },
  computedFields: {
    ...createComputedFields("events/", "events"),
    parsedStartDate: {
      type: "string",
      resolve: (doc) => {
        const dateInput = doc?.eventDate ?? doc?.startDate ?? doc?.startdate;
        return parseEventDate(dateInput).start || "";
      },
    },
    parsedEndDate: {
      type: "string",
      resolve: (doc) => {
        const dateInput = doc?.eventDate ?? doc?.startDate ?? doc?.startdate;
        return parseEventDate(dateInput).end || "";
      },
    },
    modeSafe: {
      type: "string",
      resolve: (doc) => {
        const mode = safeString(doc?.mode);
        if (["in-person", "virtual", "hybrid"].includes(mode)) return mode;
        if (doc?.isVirtual === true) return "virtual";
        if (doc?.meetingLink) return "virtual";
        return "in-person";
      },
    },
  },
}));

const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...baseFields },
  computedFields: createComputedFields("prints/", "prints"),
}));

const Resource = defineDocumentType(() => ({
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
    summary: { type: "string", required: false },
    canonical: { type: "list", of: { type: "string" }, required: false },
    products: { type: "list", of: { type: "string" }, required: false },
    linkedToolkit: { type: "string", required: false },
    linkedProducts: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: createComputedFields("resources/", "resources"),
}));

const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...baseFields },
  computedFields: createComputedFields("strategy/", "strategy"),
}));

const Lexicon = defineDocumentType(() => ({
  name: "Lexicon",
  filePathPattern: "lexicon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    // Core required fields
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    summary: { type: "string", required: false },
    
    // Classification
    category: { type: "string", required: false },
    type: { type: "string", required: false },
    docKind: { type: "string", required: false },
    
    // Access control
    accessLevel: { type: "string", required: false },
    tier: { type: "string", required: false },
    
    // Metadata
    author: { type: "string", required: false },
    date: { type: "date", required: false },
    slug: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    
    // Status
    draft: { type: "boolean", required: false, default: false },
    status: {
      type: "enum",
      options: ["draft", "published", "archived"],
      required: false,
    },
  },
  computedFields: createComputedFields("lexicon/", "lexicon"),
}));

const Vault = defineDocumentType(() => ({
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

const Playbook = defineDocumentType(() => ({
  name: "Playbook",
  filePathPattern: "playbooks/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    playbookType: {
      type: "enum",
      options: ["diagnostic", "execution", "correction", "strategic", "operational", "leadership"],
      required: false,
      default: "strategic",
    },
    framework: { type: "string", required: false },
    phases: { type: "list", of: { type: "string" }, required: false },
    signals: { type: "list", of: { type: "string" }, required: false },
    outputs: { type: "list", of: { type: "string" }, required: false },
    estimatedTime: { type: "string", required: false },
    difficulty: {
      type: "enum",
      options: ["beginner", "intermediate", "advanced", "executive"],
      required: false,
      default: "intermediate",
    },
    prerequisites: { type: "list", of: { type: "string" }, required: false },
    contentClass: { type: "string", required: false },
    accessModel: { type: "string", required: false },
    checkpointEligible: { type: "boolean", required: false },
    continuationPath: { type: "json", required: false },
  },
  computedFields: {
    ...createComputedFields("playbooks/", "playbooks"),
    playbookSlug: {
      type: "string",
      resolve: (doc) => stripPrefix(doc?._raw?.flattenedPath || "", "playbooks/"),
    },
    phaseCount: {
      type: "number",
      resolve: (doc) => Array.isArray(doc?.phases) ? doc.phases.length : 0,
    },
    signalCount: {
      type: "number",
      resolve: (doc) => Array.isArray(doc?.signals) ? doc.signals.length : 0,
    },
    outputCount: {
      type: "number",
      resolve: (doc) => Array.isArray(doc?.outputs) ? doc.outputs.length : 0,
    },
  },
}));

// ============================================================================
// EXCLUSIONS
// ============================================================================

function getExclusions(): string[] {
  const exclusions = [
    "downloads/linked-*/**",
    "Vault/**",
    "**/_*.mdx",
    "**/_*.md",
    "**/drafts/**",
    "**/templates/**",
    "node_modules",
    ".git",
    ".next",
    ".contentlayer",
    ".cache",
    "_templates",
    "tmp",
    "temp",
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
    "**/.DS_Store",
    "**/Thumbs.db",
    "**/*.lnk",
    "**/*.bak",
    "**/*.tmp",
    "**/*.swp",
    "**/*.backup*",
    "donwloads",
    "donwloads/**",
  ];

  if (ENV.IS_WINDOWS) {
    exclusions.push("**/~$*.docx", "**/~$*.xlsx", "**/~$*.pptx", "**/desktop.ini");
  }

  return exclusions;
}

// ============================================================================
// EDITORIAL BODY
// ============================================================================
// Canonical body for flagship editorials.
// Metadata lives in lib/editorial/catalogue.ts (the authoritative registry).
// This document type carries only the body + slug identity.
// ============================================================================

const Editorial = defineDocumentType(() => ({
  name: "Editorial",
  filePathPattern: "editorials/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,

    // Editorial-specific identifiers
    contentId: { type: "string", required: false },
    documentCode: { type: "string", required: false },

    // Publication lifecycle
    publicationStatus: { type: "string", required: false },

    // Editorial classification
    flagship: { type: "boolean", required: false, default: false },
    canonical: { type: "boolean", required: false, default: false },
    convergenceText: { type: "boolean", required: false, default: false },
    canonRelation: { type: "string", required: false },

    // Series ordering
    series: { type: "string", required: false },
    seriesOrder: { type: "number", required: false },

    // Reading time (legacy variant)
    readingTime: { type: "string", required: false },

    // Citation metadata
    citationTitle: { type: "string", required: false },
    citation: { type: "string", required: false },
    doi: { type: "string", required: false },

    // Asset paths
    pdfPath: { type: "string", required: false },
    downloadPath: { type: "string", required: false },
    schematicEditionPath: { type: "string", required: false },
    epubPath: { type: "string", required: false },
    citationJsonPath: { type: "string", required: false },
    previewPath: { type: "string", required: false },

    // Convergence note (editorial-specific long-form note)
    convergenceNote: { type: "string", required: false },
  },
  computedFields: {
    ...createComputedFields("editorials/", "editorials"),
    _id: {
      type: "string",
      resolve: (doc) => doc._id,
    },
  },
}));

// ============================================================================
// SOURCE CONFIGURATION
// ============================================================================

export default makeSource({
  contentDirPath: "content",
  contentDirInclude: [
    "blog",
    "editorials",
    "editorial-series",
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
    "outbound/linkedin",
    "outbound/facebook",
    "outbound/x",
    "vault/briefs",
    "vault",
    "playbooks",
  ],
  contentDirExclude: getExclusions(),
  documentTypes: [
    Post,
    Editorial,
    EditorialSeriesPart,
    Short,
    Book,
    Canon,
    Brief,
    VaultBrief,
    Intelligence,
    Dispatch,
    LinkedInOutbound,
    FacebookOutbound,
    XOutbound,
    Download,
    Event,
    Print,
    Resource,
    Strategy,
    Lexicon,
    Vault,
    Playbook,
  ],
  disableImportAliasWarning: true,

  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
    esbuildOptions: (options) => {
      options.platform = "node";
      options.target = "es2020";
      options.format = "esm";
      options.jsx = "automatic";
      options.jsxDev = process.env.NODE_ENV !== "production";

      options.alias = {
        ...options.alias,
        "@": path.resolve(process.cwd()),
      };

      options.define = {
        ...options.define,
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
      };

      return options;
    },
  },

  onError: (error, filePath) => {
    const message = error instanceof Error ? error.message : safeString(error);
    console.error(`[MDX ERROR] ${filePath}:`, message);
    if (ENV.STRICT_MODE) throw error;
  },

  onSuccess: async (importData) => {
    let data: Record<string, unknown> = {};
    try {
      data = (await importData()) as Record<string, unknown>;
    } catch (error) {
      if (ENV.IS_WINDOWS) {
        console.warn(
          "[CONTENTLAYER] Generated barrel unavailable during onSuccess on Windows; continuing with generated JSON indexes.",
        );
      } else {
        throw error;
      }
    }

    const buckets = [
      (data as any)?.allDocuments,
      (data as any)?.allPosts,
      (data as any)?.allEditorialSeriesParts,
      (data as any)?.allShorts,
      (data as any)?.allBooks,
      (data as any)?.allCanon,
      (data as any)?.allBriefs,
      (data as any)?.allVaultBriefs,
      (data as any)?.allIntelligence,
      (data as any)?.allDispatches,
      (data as any)?.allDownloads,
      (data as any)?.allEvents,
      (data as any)?.allPrints,
      (data as any)?.allResources,
      (data as any)?.allStrategy,
      (data as any)?.allLexicon,
      (data as any)?.allVaults,
      (data as any)?.allPlaybooks,
    ];

    const allDocuments: any[] = [];
    const seenIds = new Set<string>();

    for (const bucket of buckets) {
      if (!Array.isArray(bucket)) continue;

      for (const doc of bucket) {
        const key =
          safeString(doc?._id) ||
          safeString(doc?._raw?.flattenedPath) ||
          JSON.stringify(doc);

        if (seenIds.has(key)) continue;
        seenIds.add(key);
        allDocuments.push(doc);
      }
    }

    const seenHref = new Map<string, string>();
    const dupErrors: string[] = [];
    const typeCounts: Record<string, number> = {};
    const tierCounts: Record<string, number> = {};
    let validCount = 0;
    let invalidCount = 0;
    const invalidSamples: string[] = [];

    for (const doc of allDocuments) {
      const id = safeString(doc?._id);
      const href = safeString(doc?.hrefSafe);
      const type =
        safeString(doc?.type) ||
        safeString(doc?.docType) ||
        safeString(doc?._raw?.sourceFilePath).split("/")[0] ||
        "unknown";

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
            `${type} ${id}: ${(validation.errors || ["Unknown error"]).join(", ")}`
          );
        }
      }

      if (!href) continue;

      const prev = seenHref.get(href);
      if (prev && prev !== id) {
        dupErrors.push(`Duplicate href: ${href} (${prev} vs ${id})`);
      } else if (!prev) {
        seenHref.set(href, id);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 CONTENTLAYER BUILD REPORT");
    console.log("=".repeat(60));
    console.log(
      `Environment: ${ENV.IS_PROD ? "production" : "development"}${ENV.IS_CI ? " • CI" : ""}`
    );
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
      dupErrors.slice(0, 15).forEach((err) => console.warn(`  - ${err}`));
      if (dupErrors.length > 15) {
        console.warn(`  ...and ${dupErrors.length - 15} more`);
      }
      if (ENV.FAIL_ON_INVALID) {
        throw new Error(`Build failed: ${dupErrors.length} duplicate routes detected`);
      }
    }

    if (invalidCount > 0) {
      console.warn("\n⚠️  INVALID DOCUMENTS (samples):");
      invalidSamples.forEach((sample) => console.warn(`  - ${sample}`));
      if (ENV.FAIL_ON_INVALID) {
        throw new Error(`Build failed: ${invalidCount} invalid documents`);
      }
    }

    console.log("\n" + "=".repeat(60) + "\n");
  },
});
