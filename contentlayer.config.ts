// contentlayer.config.ts — FINAL CANONICAL (AccessTier Policy + No Duplicate Routes)

import {
  defineDocumentType,
  defineNestedType,
  makeSource,
  type ComputedFields,
} from "contentlayer2/source-files";

// ------------------------------------------------------------
// MODE FLAGS (PRODUCTION-GRADE, NO SURPRISE FAILURES)
// ------------------------------------------------------------
const IS_WINDOWS = process.platform === "win32";
const IS_CI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Fail hard ONLY when you explicitly ask for it:
 * CONTENTLAYER_FAIL_ON_INVALID=true
 */
const FAIL_ON_INVALID = process.env.CONTENTLAYER_FAIL_ON_INVALID === "true";

// ------------------------------------------------------------
// SAFE HELPERS
// ------------------------------------------------------------
function safeString(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return String(v);
  return "";
}

function safeNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const parsed = parseInt(v, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

function cleanSlug(v: unknown): string {
  return safeString(v)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(md|mdx)$/i, "");
}

function stripPrefix(s: string, prefix: string): string {
  return s.startsWith(prefix) ? s.slice(prefix.length) : s;
}

function defaultSlugFrom(doc: any, prefix: string): string {
  const flat = cleanSlug(doc?._raw?.flattenedPath || doc?._raw?.sourceFilePath || "");
  return cleanSlug(stripPrefix(flat, prefix));
}

function normalizeSlugForRoute(slug: string, routeBase: string): string {
  const s = cleanSlug(slug);
  const prefix = `${routeBase}/`;
  return s.startsWith(prefix) ? s.slice(prefix.length) : s;
}

function defaultHrefFrom(doc: any, prefix: string, routeBase: string): string {
  const rawSlug = cleanSlug(doc?.slug) || defaultSlugFrom(doc, prefix);
  const slug = normalizeSlugForRoute(rawSlug, routeBase);
  const normalized = slug.replace(/\/index$/i, "");
  return normalized ? `/${routeBase}/${normalized}` : `/${routeBase}`;
}

// ------------------------------------------------------------
// ACCESS POLICY (CANONICAL)
// ------------------------------------------------------------
// We will standardize on AccessTier across the site.
// Contentlayer produces `accessTierSafe` that is ALWAYS one of these.
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
};

// NOTE: This map is the “hybrid” bridge: it absorbs old AoLTier + legacy values.
const ACCESS_TIER_VARIANTS: Record<string, AccessTier> = {
  // --- PUBLIC ---
  public: "public",
  open: "public",
  unclassified: "public",
  free: "public",

  // AoLTier/legacy: sometimes used for public
  "free-tier": "public",
  "basic": "public",

  // --- MEMBER ---
  member: "member",
  members: "member",
  "inner-circle": "member",
  innercircle: "member",

  // AoLTier variants you mentioned / seen in codebases
  "inner-circle-plus": "member", // you can bump this to verified if desired
  "inner-circle-elite": "verified",

  // --- VERIFIED ---
  verified: "verified",
  "verified-member": "verified",

  // --- RESTRICTED ---
  restricted: "restricted",
  private: "restricted",
  premium: "restricted",
  architect: "restricted",
  confidential: "restricted",
  secret: "restricted",

  // --- TOP SECRET ---
  "top-secret": "top-secret",
  "top secret": "top-secret",
  ts: "top-secret",
  hardened: "top-secret",
  sovereign: "top-secret",
};

function normalizeAccessTier(input?: unknown): AccessTier {
  if (input === null || input === undefined) return "public";
  const raw = safeString(input).trim();
  if (!raw) return "public";

  const key = raw.toLowerCase();
  const mapped = ACCESS_TIER_VARIANTS[key] || ACCESS_TIER_VARIANTS[raw];
  if (mapped) return mapped;

  if ((ACCESS_TIER_ORDER as readonly string[]).includes(key)) return key as AccessTier;

  // Secure-by-default: unknown = restricted
  return "restricted";
}

// Keep the existing accessLevelSafe for backward compatibility.
// But compute a new accessTierSafe that is the single truth.
type AccessLevel = "public" | "inner-circle" | "private";
function asAccessLevel(v: unknown): AccessLevel {
  const s = safeString(v).toLowerCase().trim();
  if (s === "private") return "private";
  if (s === "inner-circle" || s === "innercircle" || s === "member" || s === "members") {
    return "inner-circle";
  }
  return "public";
}

/**
 * Derive tier for a doc with a strict precedence:
 * 1) accessTier (new)
 * 2) accessLevel (legacy)
 * 3) tier (legacy)
 * 4) classification (legacy)
 * 5) requiresAuth boolean
 *
 * This prevents “Public-looking but gated” drift.
 */
function requiredAccessTierFromDoc(doc: any): AccessTier {
  if (!doc) return "public";

  const raw =
    doc?.accessTier ??
    doc?.accessLevel ??
    doc?.tier ??
    doc?.clearance ??
    doc?.classification;

  // If any string-ish exists, normalize it.
  if (raw !== undefined && raw !== null && safeString(raw).trim() !== "") {
    return normalizeAccessTier(raw);
  }

  // requiresAuth: secure default
  if (doc?.requiresAuth === true) return "restricted";

  return "public";
}

function safeRawBody(doc: any): string {
  try {
    return safeString(doc?.body?.raw ?? doc?.body?.code ?? doc?.body ?? "");
  } catch {
    return "";
  }
}

function analyzeContent(text: string): { images: number; codeBlocks: number; words: number } {
  const t = safeString(text);
  const images = (t.match(/\!\[.*?\]\(.*?\)/g) || []).length;
  const codeBlocks = (t.match(/```[\s\S]*?```/g) || []).length;
  const words = t
    .replace(/[`*_>#~\[\]\(\)\{\}.,;:!?'"\\\/|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
  return { images, codeBlocks, words };
}

function estimateReadTime(text: string): string {
  const { images, codeBlocks, words } = analyzeContent(text);
  const adjustedWords = words + codeBlocks * 50 + images * 12;
  const minutes = Math.max(1, Math.ceil(adjustedWords / 200));
  return minutes === 1 ? "1 min read" : `${minutes} min read`;
}

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------
type ValidationResult = { isValid: boolean; errors: string[] };

function validateBase(doc: any): ValidationResult {
  const errors: string[] = [];
  const flat = cleanSlug(doc?._raw?.flattenedPath || "");
  const slug = cleanSlug(doc?.slug) || flat;
  if (!slug) errors.push("Missing slug (slug + flattenedPath both empty)");
  return { isValid: errors.length === 0, errors };
}

function parseEventStartISO(raw: unknown): string | null {
  const s = safeString(raw).trim();
  if (!s) return null;
  try {
    const parts = s.split(" - ");
    const dateStr = parts[0]?.trim() ?? s;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

function parseEventEndISO(raw: unknown): string | null {
  const s = safeString(raw).trim();
  if (!s || !s.includes(" - ")) return null;

  try {
    const parts = s.split(" - ");
    const startPart = parts[0]?.trim();
    const endPart = parts[1]?.trim();
    if (!startPart || !endPart) return null;

    const start = new Date(startPart);
    if (isNaN(start.getTime())) return null;

    const timeParts = endPart.split(":").map((n) => parseInt(n, 10));
    const [hours = 0, minutes = 0, seconds = 0] = timeParts;

    start.setHours(hours, minutes, seconds, 0);
    if (isNaN(start.getTime())) return null;
    return start.toISOString();
  } catch {
    return null;
  }
}

function validateEvent(doc: any): ValidationResult {
  const base = validateBase(doc);
  const errors = [...base.errors];
  const startRaw = doc?.startDate ?? doc?.startdate;
  if (startRaw && !parseEventStartISO(startRaw)) {
    errors.push(`Invalid startDate format: ${safeString(startRaw)}`);
  }
  return { isValid: errors.length === 0, errors };
}

// ------------------------------------------------------------
// NESTED TYPES
// ------------------------------------------------------------
const FeatureGridItem = defineNestedType(() => ({
  name: "FeatureGridItem",
  fields: {
    title: { type: "string", required: true },
    icon: { type: "string", required: false },
    content: { type: "string", required: false },
    color: { type: "string", required: false },
    badge: { type: "string", required: false },
    link: { type: "string", required: false },
  },
}));

const CTAButton = defineNestedType(() => ({
  name: "CTAButton",
  fields: {
    label: { type: "string", required: true },
    href: { type: "string", required: true },
    variant: { type: "string", required: false },
    icon: { type: "string", required: false },
    external: { type: "boolean", required: false },
  },
}));

// ------------------------------------------------------------
// FIELD SETS
// ------------------------------------------------------------
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
  status: { type: "string", required: false },
  kind: { type: "string", required: false },
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

  // Legacy access fields (keep)
  accessLevel: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false, default: false },
  tier: { type: "string", required: false },
  lockMessage: { type: "string", required: false },

  // ✅ NEW CANONICAL access field
  // (still just a string in frontmatter, normalized by computed field)
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

const downloadFields = {
  file: { type: "string", required: false },
  downloadUrl: { type: "string", required: false },
  fileSize: { type: "string", required: false },
  fileFormat: { type: "string", required: false },
  format: { type: "string", required: false },
  downloadType: { type: "string", required: false },
  paperFormats: { type: "list", of: { type: "string" }, required: false },
  isInteractive: { type: "boolean", required: false },
  isFillable: { type: "boolean", required: false },
  language: { type: "string", required: false },
  pageCount: { type: "number", required: false },
  useLegacyDiagram: { type: "boolean", required: false },
  useProTip: { type: "boolean", required: false },
  useFeatureGrid: { type: "boolean", required: false },
  useDownloadCTA: { type: "boolean", required: false },
  proTipType: { type: "string", required: false },
  proTipContent: { type: "string", required: false },
  featureGridColumns: { type: "number", required: false },
  featureGridItems: { type: "list", of: FeatureGridItem, required: false },
  ctaPrimary: { type: "nested", of: CTAButton, required: false },
  ctaSecondary: { type: "nested", of: CTAButton, required: false },
  related: { type: "list", of: { type: "string" }, required: false },
  ctaConfig: { type: "json", required: false },
  downloadProcess: { type: "json", required: false },
} as const;

// ------------------------------------------------------------
// COMPUTED FIELDS
// ------------------------------------------------------------
// CRITICAL RULE: "hrefSafe" only honors doc.href for canonical sources.
// Linked mirrors (downloads/linked-*) are excluded entirely at source level.
function createComputedFields(prefix: string, routeBase: string): ComputedFields {
  return {
    slugSafe: {
      type: "string",
      resolve: (doc) => {
        const raw = cleanSlug(doc?.slug) || defaultSlugFrom(doc, prefix) || "";
        return normalizeSlugForRoute(raw, routeBase);
      },
    },
    hrefSafe: {
      type: "string",
      resolve: (doc) => {
        const rawFlat = safeString(doc?._raw?.flattenedPath || "");

        // Guardrail: never allow linked mirrors to hijack routes
        if (/^downloads\/linked-/i.test(rawFlat)) {
          const s = cleanSlug(rawFlat).replace(/^downloads\/linked-[^/]+\//i, "");
          return s ? `/downloads/linked/${s}` : "/downloads/linked";
        }

        // Canonical behaviour
        return cleanSlug(doc?.href) ? safeString(doc.href) : defaultHrefFrom(doc, prefix, routeBase);
      },
    },
    titleSafe: {
      type: "string",
      resolve: (doc) => safeString(doc?.title).trim() || "Untitled",
    },
    excerptSafe: {
      type: "string",
      resolve: (doc) => {
        const e = safeString(doc?.excerpt).trim();
        if (e) return e;
        const d = safeString(doc?.description).trim();
        return d || "";
      },
    },

    // Legacy: keep
    accessLevelSafe: {
      type: "string",
      resolve: (doc) => asAccessLevel(doc?.accessLevel),
    },

    // ✅ Canonical: always normalized AccessTier
    accessTierSafe: {
      type: "string",
      resolve: (doc) => requiredAccessTierFromDoc(doc),
    },

    // ✅ Derived: a consistent boolean you can use everywhere
    requiresAuthSafe: {
      type: "boolean",
      resolve: (doc) => requiredAccessTierFromDoc(doc) !== "public",
    },

    publishedSafe: {
      type: "boolean",
      resolve: (doc) => (doc?.published === undefined ? true : Boolean(doc?.published)),
    },
    draftSafe: {
      type: "boolean",
      resolve: (doc) => Boolean(doc?.draft),
    },
    readTimeSafe: {
      type: "string",
      resolve: (doc) => {
        if (doc?.readTime && typeof doc.readTime === "string") return doc.readTime.trim();
        return estimateReadTime(safeRawBody(doc));
      },
    },
    wordCount: {
      type: "number",
      resolve: (doc) => analyzeContent(safeRawBody(doc)).words,
    },
    validation: {
      type: "json",
      resolve: (doc) => {
        const r = validateBase(doc);
        if (!r.isValid && FAIL_ON_INVALID) {
          throw new Error(
            `[Contentlayer] Invalid doc (${safeString(doc?._id || "unknown")}): ${r.errors.join("; ")}`
          );
        }
        return r;
      },
    },
  };
}

// ------------------------------------------------------------
// DOCUMENT TYPES (ONE CANONICAL SOURCE EACH)
// GUARANTEE:
// - Public Briefs live in:   content/briefs/**
// - Vault content lives in:  content/vault/*.{md,mdx} (top-level only)
// - Vault Briefs live in:    content/vault/briefs/**
//   and are a SEPARATE doc type so Vault never “owns” them.
// ------------------------------------------------------------

// ✅ BLOG
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

// ✅ BOOKS
export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    
    // Book-specific fields
    subtitle: { type: "string", required: false },
    volume: { type: "string", required: false },
    series: { type: "string", required: false },
    edition: { type: "string", required: false },
    isbn: { type: "string", required: false },
    pages: { type: "number", required: false },
    
    // Cover presentation
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
    coverPosition: { 
      type: "enum", 
      options: ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"], 
      default: "center",
      required: false 
    },
    
    // Social/OG
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },
    
    // Classification
    docKind: { type: "string", required: false },
  },
  computedFields: createComputedFields("books/", "books"),
}));

// ✅ SHORTS
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

// ✅ DOWNLOADS
export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    
    // File fields
    file: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    format: { type: "string", required: false },
    fileFormat: { type: "string", required: false },
    formatHint: { type: "string", required: false },
    
    // Display fields
    paperFormats: { type: "list", of: { type: "string" }, required: false },
    isInteractive: { type: "boolean", required: false },
    isFillable: { type: "boolean", required: false },
    
    // Metadata
    pageCount: { type: "number", required: false },
    fileSize: { type: "string", required: false },
    version: { type: "string", required: false },
    downloadType: { type: "string", required: false },
    
    // Classification field (add this)
    classification: { type: "string", required: false },
    
    // Feature flags
    useFeatureGrid: { type: "boolean", required: false },
    featureGridColumns: { type: "number", required: false },
    useLegacyDiagram: { type: "boolean", required: false },
    useProTip: { type: "boolean", required: false },
    useDownloadCTA: { type: "boolean", required: false },
    
    // Complex fields
    ctaConfig: { type: "json", required: false },
    cover: { type: "json", required: false },
    
    // Any other download-specific fields
    downloadProcess: { type: "json", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: createComputedFields("downloads/", "downloads"),
}));

// ✅ CANON
export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...baseFields },
  computedFields: createComputedFields("canon/", "canon"),
}));

// ✅ BRIEFS (PUBLIC / NON-VAULT) — CANONICAL SOURCE: content/briefs/**
export const Brief = defineDocumentType(() => ({
  name: "Brief",
  filePathPattern: "briefs/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    // Core content
    title: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    description: { type: "string", required: false },
    excerpt: { type: "string", required: false },
    date: { type: "string", required: false },

    // Classification & access (legacy supported)
    classification: { type: "string", required: false, default: "Unclassified" },
    accessLevel: { type: "string", required: false, default: "public" },
    tier: { type: "string", required: false },
    accessTier: { type: "string", required: false }, // ✅ canonical

    audience: { type: "string", required: false },

    // Document metadata
    docKind: { type: "string", required: false },
    institutionalId: { type: "string", required: false },
    version: { type: "string", required: false },
    lastUpdated: { type: "string", required: false },
    status: { type: "string", required: false },

    // Content organization
    category: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    format: { type: "string", required: false },
    series: { type: "string", required: false },

    // Presentation
    coverImage: { type: "string", required: false },
    featuredImage: { type: "string", required: false },
    featured: { type: "boolean", required: false, default: false },
    published: { type: "boolean", required: false, default: true },

    // Reading
    readTime: { type: "string", required: false },
    author: { type: "string", required: false },

    // Routing
    slug: { type: "string", required: false },

    // Legacy fields
    briefId: { type: "string", required: false },
    volume: { type: "number", required: false },
  },
  computedFields: {
    ...createComputedFields("briefs/", "briefs"),

    validation: {
      type: "json",
      resolve: (doc) => {
        const r = validateBase(doc);
        if (!r.isValid && FAIL_ON_INVALID) {
          throw new Error(
            `[Contentlayer] Invalid Brief (${safeString(doc?._id || "unknown")}): ${r.errors.join("; ")}`
          );
        }
        return r;
      },
    },
  },
}));

// ✅ VAULT BRIEFS (PRIVATE / VAULT) — CANONICAL SOURCE: content/vault/briefs/**
export const VaultBrief = defineDocumentType(() => ({
  name: "VaultBrief",
  filePathPattern: "vault/briefs/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    // Core content
    title: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    description: { type: "string", required: false },
    excerpt: { type: "string", required: false },
    date: { type: "string", required: false },

    // Classification & access
    classification: { type: "string", required: false, default: "Unclassified" },
    accessLevel: { type: "string", required: false, default: "restricted" },
    tier: { type: "string", required: false },
    accessTier: { type: "string", required: false }, // ✅ canonical

    audience: { type: "string", required: false },

    // Document metadata
    docKind: { type: "string", required: false },
    institutionalId: { type: "string", required: false },
    version: { type: "string", required: false },
    lastUpdated: { type: "string", required: false },
    status: { type: "string", required: false },

    // Content organization
    category: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    format: { type: "string", required: false },
    series: { type: "string", required: false },

    // Presentation
    coverImage: { type: "string", required: false },
    featuredImage: { type: "string", required: false },
    featured: { type: "boolean", required: false, default: false },
    published: { type: "boolean", required: false, default: true },

    // Reading
    readTime: { type: "string", required: false },
    author: { type: "string", required: false },

    // Routing
    slug: { type: "string", required: false },

    // Legacy fields
    briefId: { type: "string", required: false },
    volume: { type: "number", required: false },
  },
  computedFields: {
    ...createComputedFields("vault/briefs/", "vault/briefs"),

    validation: {
      type: "json",
      resolve: (doc) => {
        const r = validateBase(doc);
        if (!r.isValid && FAIL_ON_INVALID) {
          throw new Error(
            `[Contentlayer] Invalid VaultBrief (${safeString(doc?._id || "unknown")}): ${r.errors.join("; ")}`
          );
        }
        return r;
      },
    },
  },
}));

// ✅ INTELLIGENCE
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
      resolve: (doc) => {
        const order = doc?.seriesOrder;
        return typeof order === "number" ? order : typeof order === "string" ? parseInt(order, 10) : 0;
      },
    },

    classificationSafe: {
      type: "string",
      resolve: (doc) => {
        const raw = doc?.classification;
        if (!raw) return "Unclassified";
        const upper = String(raw).toUpperCase().trim();
        const valid = ["UNCLASSIFIED", "RESTRICTED", "CONFIDENTIAL", "SECRET", "TOP SECRET", "HARDENED"];
        return valid.includes(upper) ? upper : "Unclassified";
      },
    },

    statusSafe: {
      type: "string",
      resolve: (doc) => {
        const status = doc?.status;
        return status ? String(status).toUpperCase() : "ACTIVE";
      },
    },

    validation: {
      type: "json",
      resolve: (doc) => {
        const r = validateBase(doc);
        if (!doc?.title) r.errors.push("Missing title");
        if (!r.isValid && FAIL_ON_INVALID) {
          throw new Error(
            `[Contentlayer] Invalid Intelligence (${safeString(doc?._id || "unknown")}): ${r.errors.join("; ")}`
          );
        }
        return r;
      },
    },
  },
}));

// ✅ DISPATCHES
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
      resolve: (doc) => {
        const num = doc?.dispatchNumber;
        return typeof num === "number" ? num : typeof num === "string" ? parseInt(num, 10) : 0;
      },
    },

    isExpired: {
      type: "boolean",
      resolve: (doc) => {
        if (!doc?.expiresAt) return false;
        try {
          const expiry = new Date(String(doc.expiresAt));
          const now = new Date();
          return expiry < now;
        } catch {
          return false;
        }
      },
    },

    validation: {
      type: "json",
      resolve: (doc) => {
        const r = validateBase(doc);
        if (!doc?.title) r.errors.push("Missing title");
        if (!r.isValid && FAIL_ON_INVALID) {
          throw new Error(
            `[Contentlayer] Invalid Dispatch (${safeString(doc?._id || "unknown")}): ${r.errors.join("; ")}`
          );
        }
        return r;
      },
    },
  },
}));

// ✅ EVENTS
export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    eventType: { type: "string", required: false },
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
    startDate: { type: "string", required: false },
    endDate: { type: "string", required: false },
    startdate: { type: "string", required: false },
    timezone: { type: "string", required: false },
    isVirtual: { type: "boolean", required: false },
    meetingLink: { type: "string", required: false },
  },
  computedFields: {
    ...createComputedFields("events/", "events"),
    parsedStartDate: {
      type: "string",
      resolve: (doc) => parseEventStartISO(doc?.startDate ?? doc?.startdate) || "",
    },
    parsedEndDate: {
      type: "string",
      resolve: (doc) => parseEventEndISO(doc?.startDate ?? doc?.startdate) || "",
    },
    validation: {
      type: "json",
      resolve: (doc) => {
        const r = validateEvent(doc);
        if (!r.isValid && FAIL_ON_INVALID) {
          throw new Error(
            `[Contentlayer] Invalid Event (${safeString(doc?._id || "unknown")}): ${r.errors.join("; ")}`
          );
        }
        return r;
      },
    },
  },
}));

// ✅ PRINTS
export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...baseFields },
  computedFields: createComputedFields("prints/", "prints"),
}));

// ✅ RESOURCES
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

// ✅ STRATEGY
export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    slug: { type: "string", required: false },
  },
  computedFields: createComputedFields("strategy/", "strategy"),
}));

// ✅ LEXICON
export const Lexicon = defineDocumentType(() => ({
  name: "Lexicon",
  filePathPattern: "lexicon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    term: { type: "string", required: false },
    phonetic: { type: "string", required: false },
  },
  computedFields: {
    ...createComputedFields("lexicon/", "lexicon"),
    actualType: { type: "string", resolve: () => "Lexicon" },
  },
}));

// ✅ VAULT — CANONICAL SOURCE: content/vault/*.{md,mdx} (TOP-LEVEL ONLY)
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

// ------------------------------------------------------------
// EXCLUSIONS (DUPLICATE-KILLER)
// ------------------------------------------------------------
function getExclusions(): string[] {
  const exclusions = [
    // linked derivatives should not be separately indexed (prevents duplication)
    "downloads/linked-*/**",
    "downloads/linked-*/**/*",

    // Case variants people accidentally create
    "Vault/**",
    "Vault/**/*",

    // partials / hidden patterns
    "**/_*.mdx",
    "**/_*.md",
    "**/drafts/**",
    "**/templates/**",

    // system dirs
    "node_modules",
    ".git",
    ".next",
    ".contentlayer",
    ".cache",

    "_templates",
    "tmp",
    "temp",

    // never ingest public assets/binaries
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

    // typo folder
    "donwloads",
    "donwloads/**",
  ];

  if (IS_WINDOWS) {
    exclusions.push("**/~$*.docx", "**/~$*.xlsx", "**/~$*.pptx", "**/desktop.ini", "**/Thumbs.db");
  }

  return exclusions;
}

// ------------------------------------------------------------
// SOURCE CONFIGURATION
// CRITICAL:
// - Do NOT import { Post, Short, ... } from anywhere.
// - Do NOT redeclare helpers/constants below this block.
// - There must be EXACTLY ONE `export default makeSource(...)` in the file.
// ------------------------------------------------------------
export default makeSource({
  contentDirPath: "content",
  contentDirInclude: [
    "blog",
    "shorts",
    "books",
    "canon",

    "briefs", // ✅ clean public briefs folder
    "dispatches",
    "intelligence",
    "downloads",
    "events",
    "prints",
    "resources",
    "strategy",
    "lexicon",

    "vault", // ✅ vault folder (Vault type is top-level only; VaultBrief handles vault/briefs)
  ],
  contentDirExclude: getExclusions(),
  documentTypes: [
    Post,
    Short,
    Book,
    Canon,

    Brief,      // content/briefs/**
    VaultBrief, // content/vault/briefs/**

    Intelligence,
    Dispatch,
    Download,
    Event,
    Print,
    Resource,
    Strategy,
    Lexicon,

    Vault, // content/vault/*.{md,mdx} only
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

    // Duplicate detection
    const seenHref = new Map<string, string>();
    const dupErrors: string[] = [];

    for (const doc of allDocuments) {
      const id = safeString(doc?._id);
      const href = safeString(doc?.hrefSafe);
      if (!href) continue;

      const prev = seenHref.get(href);
      if (prev && prev !== id) dupErrors.push(`Duplicate hrefSafe: ${href} (${prev}) vs (${id})`);
      else seenHref.set(href, id);
    }

    // stats
    const counts: Record<string, number> = {};
    let valid = 0;
    let invalid = 0;
    const samples: string[] = [];

    for (const doc of allDocuments) {
      const t = safeString(doc?.type || "unknown");
      counts[t] = (counts[t] || 0) + 1;

      const v = doc?.validation as ValidationResult | undefined;
      if (!v) {
        valid++;
        continue;
      }

      if (v.isValid) valid++;
      else {
        invalid++;
        if (samples.length < 12) {
          samples.push(`${t} ${safeString(doc?._id)} → ${(v.errors || ["Validation failed"]).join(", ")}`);
        }
      }
    }

    // AccessTier distribution
    const tierCounts: Record<string, number> = {};
    for (const doc of allDocuments) {
      const tier = safeString(doc?.accessTierSafe || "public");
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    }

    console.log("\n============================================================");
    console.log("📊 CONTENTLAYER BUILD COMPLETE");
    console.log("============================================================");
    console.log(`Platform: ${process.platform}${IS_WINDOWS ? " (Windows)" : ""}`);
    console.log(`Mode: ${IS_PROD ? "production" : "dev"}${IS_CI ? " • CI" : ""}`);
    console.log(`Docs: ${allDocuments.length}`);
    console.log("By type:", counts);
    console.log("By accessTierSafe:", tierCounts);
    console.log(`Validation: valid=${valid} invalid=${invalid}`);

    if (dupErrors.length) {
      console.warn("\n⚠️  Duplicate routing/source signals detected:");
      dupErrors.slice(0, 20).forEach((e) => console.warn("  -", e));
      if (dupErrors.length > 20) console.warn(`  ...and ${dupErrors.length - 20} more`);
      if (FAIL_ON_INVALID) throw new Error(`Duplicate doc signals detected: ${dupErrors.length}`);
    }

    if (invalid > 0) {
      console.warn("\n⚠️  Invalid document samples:");
      samples.forEach((s) => console.warn("  -", s));
      if (FAIL_ON_INVALID) throw new Error(`Contentlayer invariants failed (${invalid} invalid docs).`);
    }

    console.log("============================================================\n");
  },
});