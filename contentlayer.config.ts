// contentlayer.config.ts — STRICT INVARIANTS, REAL-WORLD FIELDS, NO DRIFT
import {
  defineDocumentType,
  defineNestedType,
  makeSource,
  type ComputedFields,
} from "contentlayer2/source-files";

// ------------------------------------------------------------
// ENV / MODE FLAGS
// ------------------------------------------------------------
const IS_WINDOWS = process.platform === "win32";
const IS_CI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const IS_PROD = process.env.NODE_ENV === "production";

// Hard fail only when explicitly enabled or in CI+prod
const FAIL_ON_INVALID =
  process.env.CONTENTLAYER_FAIL_ON_INVALID === "true" || (IS_CI && IS_PROD);

// ------------------------------------------------------------
// SAFE HELPERS
// ------------------------------------------------------------
function safeString(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return String(v);
  return "";
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

function defaultHrefFrom(doc: any, prefix: string, routeBase: string): string {
  const slug = cleanSlug(doc?.slug) || defaultSlugFrom(doc, prefix);
  const normalized = slug.replace(/\/index$/i, "");
  return normalized ? `/${routeBase}/${normalized}` : `/${routeBase}`;
}

type AccessLevel = "public" | "inner-circle" | "private";

function asAccessLevel(v: unknown): AccessLevel {
  const s = safeString(v).toLowerCase().trim();
  if (s === "private") return "private";
  if (s === "inner-circle" || s === "innercircle" || s === "member" || s === "members") return "inner-circle";
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

  const words =
    t
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
  if (!safeString(doc?.title).trim()) errors.push("Missing required field: title");

  const flat = cleanSlug(doc?._raw?.flattenedPath || "");
  const slug = cleanSlug(doc?.slug) || flat;
  if (!slug) errors.push("Missing slug (slug + flattenedPath both empty)");

  return { isValid: errors.length === 0, errors };
}

function parseEventStartISO(raw: unknown): string | null {
  const s = safeString(raw).trim();
  if (!s) return null;
  const left = s.includes(" - ") ? s.split(" - ")[0].trim() : s;
  const d = new Date(left);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseEventEndISO(raw: unknown): string | null {
  const s = safeString(raw).trim();
  if (!s || !s.includes(" - ")) return null;

  const [startPart, endPart] = s.split(" - ").map((x) => x.trim());
  const start = new Date(startPart);
  if (isNaN(start.getTime())) return null;

  const parts = endPart.split(":").map((n) => parseInt(n, 10));
  if (!parts.length || Number.isNaN(parts[0])) return null;

  start.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  if (isNaN(start.getTime())) return null;

  return start.toISOString();
}

function validateEvent(doc: any): ValidationResult {
  const base = validateBase(doc);
  const errors = [...base.errors];
  if (doc?.startDate && !parseEventStartISO(doc?.startDate)) {
    errors.push(`Invalid startDate format: ${safeString(doc.startDate)}`);
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
} as const;

const baseFields = {
  // core identity
  title: { type: "string", required: true },
  subtitle: { type: "string", required: false },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },

  // dates
  date: { type: "date", required: false },
  updated: { type: "date", required: false },

  // publishing flags
  published: { type: "boolean", required: false },
  draft: { type: "boolean", required: false },
  featured: { type: "boolean", required: false },

  // routing
  slug: { type: "string", required: false },
  href: { type: "string", required: false },
  aliases: { type: "list", of: { type: "string" }, required: false },

  // presentation
  docKind: { type: "string", required: false },
  layout: { type: "string", required: false },
  density: { type: "string", required: false },

  // authoring / taxonomy
  author: { type: "string", required: false },
  authorTitle: { type: "string", required: false },
  tags: { type: "list", of: { type: "string" }, required: false },
  category: { type: "string", required: false },

  // visuals
  coverImage: { type: "string", required: false },
  featuredImage: { type: "string", required: false },
  coverAspect: { type: "string", required: false },
  coverFit: { type: "string", required: false },
  coverPosition: { type: "string", required: false },

  // sharing
  socialCaption: { type: "string", required: false },
  readTime: { type: "string", required: false },

  // access control
  accessLevel: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false },
  tier: { type: "string", required: false },
  lockMessage: { type: "string", required: false },

  // structured blobs / attachments (kept permissive)
  resources: { type: "json", required: false },
  downloads: { type: "json", required: false },
  relatedDownloads: { type: "list", of: { type: "string" }, required: false },

  // editorial extras
  keyInsights: { type: "list", of: { type: "string" }, required: false },
  authorNote: { type: "string", required: false },

  // canon ordering (used in your content)
  order: { type: "number", required: false },
  volumeNumber: { type: "string", required: false },
  volume: { type: "string", required: false },
  part: { type: "string", required: false },

  // ... other fields
  contentOnly: { type: "boolean", required: false },

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
  version: { type: "string", required: false },
  language: { type: "string", required: false },
  pageCount: { type: "number", required: false }, // Resolved: Added to capture legacy data

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

  // these were explicitly in your warnings
  ctaConfig: { type: "json", required: false },
  downloadProcess: { type: "json", required: false },
} as const;

const resourceFields = {
  resourceType: { type: "string", required: false },
  downloadUrl: { type: "string", required: false },
  links: { type: "json", required: false },
} as const;

const strategyFields = {
  strategyType: { type: "string", required: false },
  industry: { type: "string", required: false },
  region: { type: "string", required: false },
  timeline: { type: "string", required: false },
  status: { type: "string", required: false },
  resourceType: { type: "string", required: false }, // your sample-strategy
} as const;

// ------------------------------------------------------------
// COMPUTED FIELDS
// ------------------------------------------------------------
function createComputedFields(prefix: string, routeBase: string): ComputedFields {
  return {
    slugSafe: {
      type: "string",
      resolve: (doc) => cleanSlug(doc?.slug) || defaultSlugFrom(doc, prefix) || "",
    },
    hrefSafe: {
      type: "string",
      resolve: (doc) => (cleanSlug(doc?.href) ? safeString(doc.href) : defaultHrefFrom(doc, prefix, routeBase)),
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
    accessLevelSafe: {
      type: "string",
      resolve: (doc) => asAccessLevel(doc?.accessLevel),
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
      resolve: (doc) => safeString(doc?.readTime).trim() || estimateReadTime(safeRawBody(doc)),
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
          throw new Error(`[Contentlayer] Invalid doc (${doc?._id || "unknown"}): ${r.errors.join("; ")}`);
        }
        return r;
      },
    },
  };
}

// ------------------------------------------------------------
// DOCUMENT TYPES
// ------------------------------------------------------------
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

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    isbn: { type: "string", required: false },
    pages: { type: "number", required: false },
    publisher: { type: "string", required: false },
    edition: { type: "string", required: false },
    format: { type: "string", required: false },
    year: { type: "number", required: false },
  },
  computedFields: createComputedFields("books/", "books"),
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    canonType: { type: "string", required: false },
    edition: { type: "string", required: false },
  },
  computedFields: createComputedFields("canon/", "canon"),
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    ...downloadFields,
  },
  computedFields: createComputedFields("downloads/", "downloads"),
}));

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
    timezone: { type: "string", required: false },
    isVirtual: { type: "boolean", required: false },
    meetingLink: { type: "string", required: false },
  },
  computedFields: {
    ...createComputedFields("events/", "events"),
    parsedStartDate: {
      type: "string",
      resolve: (doc) => parseEventStartISO(doc?.startDate) || "",
    },
    parsedEndDate: {
      type: "string",
      resolve: (doc) => parseEventEndISO(doc?.startDate) || "",
    },
    validation: {
      type: "json",
      resolve: (doc) => {
        const r = validateEvent(doc);
        if (!r.isValid && FAIL_ON_INVALID) {
          throw new Error(`[Contentlayer] Invalid Event (${doc?._id || "unknown"}): ${r.errors.join("; ")}`);
        }
        return r;
      },
    },
  },
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    printType: { type: "string", required: false },
    price: { type: "number", required: false },
    currency: { type: "string", required: false },
    isPhysical: { type: "boolean", required: false },
    dimensions: { type: "string", required: false },
    paperType: { type: "string", required: false },
    orientation: { type: "string", required: false },
    resolution: { type: "string", required: false },
  },
  computedFields: createComputedFields("prints/", "prints"),
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    ...resourceFields,
    fileType: { type: "string", required: false },
    difficulty: { type: "string", required: false },
    prerequisites: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: createComputedFields("resources/", "resources"),
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    ...strategyFields,
  },
  computedFields: createComputedFields("strategy/", "strategy"),
}));

// ------------------------------------------------------------
// INSTITUTIONAL EXCLUSIONS (Hardened for Binary Safety)
// ------------------------------------------------------------
function getExclusions(): string[] {
  const exclusions = [
    // Core Infrastructure
    "node_modules",
    ".git",
    ".next",
    ".contentlayer",
    ".cache",
    "_templates",
    "tmp",
    "temp",

    // The "Vault" - Explicitly barring the public folder from being scanned
    "public/**/*",           // 🛡️ CRITICAL: Do not let Contentlayer scan public assets
    "**/public/assets/**",   
    "public/assets/images/**",

    // Binary File Extensions (Expanded to prevent EPERM on images)
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

    // System Artifacts & Temporary Files
    "**/.DS_Store",
    "**/Thumbs.db",
    "**/*.lnk",
    "**/*.bak",
    "**/*.tmp",
    "**/*.swp",
    "**/*.backup*",

    // Typo Neutralization
    "donwloads",
    "donwloads/**",
  ];

  if (IS_WINDOWS) {
    exclusions.push(
      "**/~$*.docx", 
      "**/~$*.xlsx", 
      "**/~$*.pptx", 
      "**/desktop.ini",
      "**/Thumbs.db"
    );
  }

  return exclusions;
}

// ------------------------------------------------------------
// SOURCE
// ------------------------------------------------------------
export default makeSource({
  contentDirPath: "content",
  contentDirInclude: ["blog", "shorts", "books", "canon", "downloads", "events", "prints", "resources", "strategy"],
  contentDirExclude: getExclusions(),
  documentTypes: [Post, Short, Book, Canon, Download, Event, Print, Resource, Strategy],
  disableImportAliasWarning: true,
  mdx: { remarkPlugins: [], rehypePlugins: [] },

  onSuccess: async (importData) => {
    const data = await importData();
    const allDocuments: any[] = (data as any)?.allDocuments || [];

    const counts: Record<string, number> = {};
    let valid = 0;
    let invalid = 0;
    const samples: string[] = [];

    for (const doc of allDocuments) {
      const t = safeString(doc?.type || "unknown");
      counts[t] = (counts[t] || 0) + 1;

      const v = doc?.validation as ValidationResult | undefined;
      if (v?.isValid) valid++;
      else {
        invalid++;
        if (samples.length < 12) {
          samples.push(`${t} ${safeString(doc?._id)} → ${(v?.errors || ["Validation failed"]).join(", ")}`);
        }
      }
    }

    console.log("\n============================================================");
    console.log("📊 CONTENTLAYER BUILD COMPLETE (SCHEMA ALIGNED)");
    console.log("============================================================");
    console.log(`Platform: ${process.platform}${IS_WINDOWS ? " (Windows)" : ""}`);
    console.log(`Docs: ${allDocuments.length}`);
    console.log("By type:", counts);
    console.log(`Validation: valid=${valid} invalid=${invalid}`);

    if (invalid > 0) {
      console.warn("\n⚠️  Invalid document samples:");
      samples.forEach((s) => console.warn("  -", s));
      if (FAIL_ON_INVALID) {
        throw new Error(`Contentlayer invariants failed (${invalid} invalid docs).`);
      }
    }

    console.log("============================================================\n");
  },
});