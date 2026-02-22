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

type AccessLevel = "public" | "inner-circle" | "private";
function asAccessLevel(v: unknown): AccessLevel {
  const s = safeString(v).toLowerCase().trim();
  if (s === "private") return "private";
  if (s === "inner-circle" || s === "innercircle" || s === "member" || s === "members")
    return "inner-circle";
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

// ✅ Moved validateEvent BEFORE it's used in Event document type
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
  accessLevel: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false, default: false },
  tier: { type: "string", required: false },
  lockMessage: { type: "string", required: false },
  resources: { type: "json", required: false },
  downloads: { type: "json", required: false },
  relatedDownloads: { type: "list", of: { type: "string" }, required: false },
  keyInsights: { type: "list", of: { type: "string" }, required: false },
  order: { type: "number", required: false },
  volumeNumber: { type: "string", required: false },
  volume: { type: "number", required: false },
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
// COMPUTED FIELDS - FIXED
// ------------------------------------------------------------
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
      resolve: (doc) =>
        cleanSlug(doc?.href) ? safeString(doc.href) : defaultHrefFrom(doc, prefix, routeBase),
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
      resolve: (doc) => {
        // FIX: Check if readTime exists and is valid
        if (doc?.readTime && typeof doc.readTime === 'string') {
          return doc.readTime.trim();
        }
        // FIX: Only call safeRawBody if doc exists
        if (doc) {
          return estimateReadTime(safeRawBody(doc));
        }
        return "";
      },
    },
    wordCount: {
      type: "number",
      resolve: (doc) => {
        // FIX: Only analyze if doc exists
        if (doc) {
          return analyzeContent(safeRawBody(doc)).words;
        }
        return 0;
      },
    },
    validation: {
      type: "json",
      resolve: (doc) => {
        const r = validateBase(doc);
        if (!r.isValid && FAIL_ON_INVALID) {
          // FIX: Better error message
          console.error(`[Contentlayer] Invalid doc (${doc?._id || "unknown"}):`, r.errors);
          // Option 1: Throw but with more context
          throw new Error(
            `[Contentlayer] Invalid doc (${doc?._id || "unknown"}): ${r.errors.join("; ")}`
          );
          // Option 2: Return validation but don't throw (uncomment to use)
          // return { ...r, isValid: false, errors: r.errors };
        }
        return r;
      },
    },
  };
}

// Helper function to safely get raw body
function safeRawBody(doc: any): string {
  if (!doc) return "";
  if (typeof doc.body === "string") return doc.body;
  if (doc.body?.raw) return doc.body.raw;
  if (doc.content) return doc.content;
  return "";
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

export const Brief = defineDocumentType(() => ({
  name: "Brief",
  filePathPattern: "briefs/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    briefId: { type: "string", required: false },
    series: { type: "string", required: false },
    lastUpdated: { type: "string", required: false },
    format: { type: "string", required: false },
    audience: { type: "string", required: false },
    classification: {
      type: "enum",
      options: ["Unclassified", "Restricted", "Confidential", "Secret", "Top Secret"],
      default: "Unclassified",
      required: false,
    },
  },
  computedFields: createComputedFields("briefs/", "briefs"),
}));

export const Intelligence = defineDocumentType(() => ({
  name: "Intelligence",
  filePathPattern: "intelligence/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    classification: { type: "string", required: false },
  },
  computedFields: createComputedFields("intelligence/", "intelligence"),
}));

export const Dispatch = defineDocumentType(() => ({
  name: "Dispatch",
  filePathPattern: "dispatches/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    dispatchId: { type: "string", required: false },
  },
  computedFields: createComputedFields("dispatches/", "dispatches"),
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    ...downloadFields,
    volumeIndex: { type: "number", required: false },
    lastUpdated: { type: "string", required: false },
    audience: { type: "string", required: false },
    classification: {
      type: "enum",
      options: ["Unclassified", "Restricted", "Confidential", "Secret", "Top Secret"],
      default: "Unclassified",
      required: false,
    },
    series: { type: "string", required: false },
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
            `[Contentlayer] Invalid Event (${doc?._id || "unknown"}): ${r.errors.join("; ")}`
          );
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
    resourceType: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    links: { type: "json", required: false },
    format: { type: "string", required: false },
    jurisdiction: { type: "string", required: false },
    classification: { type: "string", required: false },
  },
  computedFields: createComputedFields("resources/", "resources"),
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    strategyType: { type: "string", required: false },
    industry: { type: "string", required: false },
    region: { type: "string", required: false },
    timeline: { type: "string", required: false },
    resourceType: { type: "string", required: false },
  },
  computedFields: createComputedFields("strategy/", "strategy"),
}));

export const Lexicon = defineDocumentType(() => ({
  name: "Lexicon",
  filePathPattern: "lexicon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...baseFields,
    // Claim 'type' as data to prevent Contentlayer from
    // trying to move these files into the 'Resource' bucket.
    type: { type: "string", required: false },
    docKind: { type: "string", required: false },
    term: { type: "string", required: false },
    phonetic: { type: "string", required: false },
    category: { type: "string", required: false },
  },
  computedFields: {
    ...createComputedFields("lexicon/", "lexicon"),
    // Force the internal identity for the manifest
    actualType: {
      type: "string",
      resolve: () => "Lexicon",
    },
  },
}));

// ------------------------------------------------------------
// EXCLUSIONS
// ------------------------------------------------------------
function getExclusions(): string[] {
  const exclusions = [
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
    "downloads/linked-shorts/**",
    "downloads/linked-shorts/**/*",
    "downloads/linked-briefs/**",
    "downloads/linked-briefs/**/*",
    "downloads/linked-*/**",
    "downloads/linked-*/**/*",
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
  contentDirInclude: [
    "blog",
    "shorts",
    "books",
    "canon",
    "briefs", // Intelligence Portfolio
    "dispatches", // Communication Logs
    "intelligence", // Classified Intelligence
    "downloads",
    "events",
    "prints",
    "resources",
    "strategy",
    "lexicon", // Institutional Glossary
  ],
  contentDirExclude: getExclusions(),
  documentTypes: [
    Post,
    Short,
    Book,
    Canon,
    Brief, // Integrated
    Dispatch, // Integrated
    Intelligence, // Integrated
    Download,
    Event,
    Print,
    Resource,
    Strategy,
    Lexicon, // Integrated
  ],
  disableImportAliasWarning: true,
  mdx: { remarkPlugins: [], rehypePlugins: [] },

  // ✅ onSuccess – Full duplicate detection and validation reporting
  onSuccess: async (importData) => {
    const data = await importData();
    const allDocuments: any[] = (data as any)?.allDocuments || [];

    const seenFlat = new Map<string, string>();
    const seenHref = new Map<string, string>();
    const dupErrors: string[] = [];

    for (const doc of allDocuments) {
      const id = safeString(doc?._id);
      const flat = safeString(doc?._raw?.flattenedPath);
      const href = safeString(doc?.hrefSafe);

      if (flat) {
        const prev = seenFlat.get(flat);
        if (prev && prev !== id) {
          dupErrors.push(`Duplicate flattenedPath: ${flat} (${prev}) vs (${id})`);
        } else {
          seenFlat.set(flat, id);
        }
      }
      if (href) {
        const prev = seenHref.get(href);
        if (prev && prev !== id) {
          dupErrors.push(`Duplicate hrefSafe: ${href} (${prev}) vs (${id})`);
        } else {
          seenHref.set(href, id);
        }
      }
    }

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
          samples.push(
            `${t} ${safeString(doc?._id)} → ${(v?.errors || ["Validation failed"]).join(", ")}`
          );
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

    if (dupErrors.length) {
      console.warn("\n⚠️  Duplicate routing/source signals detected:");
      dupErrors.slice(0, 20).forEach((e) => console.warn("  -", e));
      if (dupErrors.length > 20) console.warn(`  ...and ${dupErrors.length - 20} more`);
      if (FAIL_ON_INVALID) throw new Error(`Duplicate doc signals detected: ${dupErrors.length}`);
    }

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