// contentlayer.config.ts — PRODUCTION-READY CROSS-PLATFORM CONFIG (INVARIANTS-FIRST)
// Contentlayer2 (contentlayer2/source-files)

import {
  defineDocumentType,
  defineNestedType,
  makeSource,
  type ComputedFields,
} from "contentlayer2/source-files";

// ------------------------------------------------------------
// ENVIRONMENT & PLATFORM DETECTION
// ------------------------------------------------------------
const IS_WINDOWS = process.platform === "win32";
const IS_PROD = process.env.NODE_ENV === "production";
const IS_CI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

// ------------------------------------------------------------
// STRING / PATH SAFETY
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
  if (!slug) return `/${routeBase}`;
  return `/${routeBase}/${slug.replace(/\/index$/i, "")}`;
}

// ------------------------------------------------------------
// READ TIME ESTIMATION
// ------------------------------------------------------------
function safeRawBody(doc: any): string {
  try {
    return safeString(doc?.body?.raw ?? doc?.body?.code ?? doc?.body ?? "");
  } catch {
    return "";
  }
}

function analyzeContent(text: string): { images: number; codeBlocks: number } {
  const t = safeString(text);
  const images = (t.match(/\!\[.*?\]\(.*?\)/g) || []).length;
  const codeBlocks = (t.match(/```[\s\S]*?```/g) || []).length;
  return { images, codeBlocks };
}

function estimateReadTime(text: string, options?: { images?: number; codeBlocks?: number }): string {
  const images = options?.images || 0;
  const codeBlocks = options?.codeBlocks || 0;

  const words = safeString(text)
    .replace(/[`*_>#~\[\]\(\)\{\}.,;:!?'"\\\/|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  const adjustedWords = words + codeBlocks * 50 + images * 12;
  const minutes = Math.max(1, Math.ceil(adjustedWords / 200));
  return minutes === 1 ? "1 min read" : `${minutes} min read`;
}

// ------------------------------------------------------------
// ACCESS / ENUM NORMALIZATION (INVARIANTS)
// ------------------------------------------------------------
type AccessLevel = "public" | "inner-circle" | "private";

function asAccessLevel(v: unknown): AccessLevel {
  const s = safeString(v).toLowerCase().trim();
  if (s === "private") return "private";
  if (s === "inner-circle" || s === "innercircle" || s === "member" || s === "members") return "inner-circle";
  return "public";
}

function asDifficulty(v: unknown): "beginner" | "intermediate" | "advanced" {
  const s = safeString(v).toLowerCase().trim();
  if (s === "advanced") return "advanced";
  if (s === "intermediate") return "intermediate";
  return "beginner";
}

// ------------------------------------------------------------
// DATE HANDLING (EVENTS)
// Accepts ISO or range format: "2026-11-11T19:00 - 22:00"
// We store raw as string, and expose parsedStart/parsedEnd as computed ISO strings.
// ------------------------------------------------------------
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
  if (!startPart || !endPart) return null;

  const start = new Date(startPart);
  if (isNaN(start.getTime())) return null;

  // endPart is "22:00" (or "22:00:00")
  const parts = endPart.split(":").map((n) => parseInt(n, 10));
  if (!parts.length || Number.isNaN(parts[0])) return null;

  start.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  if (isNaN(start.getTime())) return null;

  return start.toISOString();
}

// ------------------------------------------------------------
// VALIDATION RESULT SHAPE (non-blocking by default)
// If you want CI-hard-fail, flip FAIL_ON_INVALID in env.
// ------------------------------------------------------------
const FAIL_ON_INVALID = process.env.CONTENTLAYER_FAIL_ON_INVALID === "true" || (IS_CI && IS_PROD);

type ValidationResult = { isValid: boolean; errors: string[] };

function validateBase(doc: any): ValidationResult {
  const errors: string[] = [];
  const title = safeString(doc?.title).trim();

  if (!title) errors.push("Missing required field: title");

  // slug invariant is enforced via computedFields.slugSafe; here we only warn if everything fails
  const flat = cleanSlug(doc?._raw?.flattenedPath || "");
  const slug = cleanSlug(doc?.slug) || flat;
  if (!slug) errors.push("Missing slug (slug + flattenedPath both empty)");

  return { isValid: errors.length === 0, errors };
}

function validateEvent(doc: any): ValidationResult {
  const base = validateBase(doc);
  const errors = [...base.errors];

  const startISO = parseEventStartISO(doc?.startDate);
  if (doc?.startDate && !startISO) errors.push(`Invalid startDate format: ${safeString(doc.startDate)}`);

  return { isValid: errors.length === 0, errors };
}

// ------------------------------------------------------------
// NESTED TYPES (FIXED DEFAULTS)
// NOTE: contentlayer fields don't reliably support "default" across all setups.
// We avoid defaults here and enforce via computedFields where needed.
// ------------------------------------------------------------
const DownloadMeta = defineNestedType(() => ({
  name: "DownloadMeta",
  fields: {
    file: { type: "string", required: true },
    label: { type: "string", required: false },
    isFillable: { type: "boolean", required: false },
    isInteractive: { type: "boolean", required: false },
    version: { type: "string", required: false },
    size: { type: "string", required: false },
  },
}));

const DownloadLink = defineNestedType(() => ({
  name: "DownloadLink",
  fields: {
    title: { type: "string", required: true },
    url: { type: "string", required: true },
    label: { type: "string", required: false },
    format: { type: "string", required: false },
    size: { type: "string", required: false },
    description: { type: "string", required: false },
  },
}));

const CTADetail = defineNestedType(() => ({
  name: "CTADetail",
  fields: {
    label: { type: "string", required: true },
    value: { type: "string", required: true },
    icon: { type: "string", required: false },
    detail: { type: "string", required: false },
    tooltip: { type: "string", required: false },
  },
}));

const CTAFeature = defineNestedType(() => ({
  name: "CTAFeature",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    icon: { type: "string", required: false },
    color: { type: "string", required: false },
  },
}));

const CTAConfig = defineNestedType(() => ({
  name: "CTAConfig",
  fields: {
    badge: { type: "string", required: false },
    tier: { type: "string", required: false },
    details: { type: "list", of: CTADetail, required: false },
    featuresText: { type: "list", of: { type: "string" }, required: false },
    features: { type: "list", of: CTAFeature, required: false },
    priority: { type: "number", required: false },
  },
}));

const ProcessStep = defineNestedType(() => ({
  name: "ProcessStep",
  fields: {
    step: { type: "number", required: false },
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    icon: { type: "string", required: false },
    duration: { type: "string", required: false },
  },
}));

const DownloadProcess = defineNestedType(() => ({
  name: "DownloadProcess",
  fields: {
    steps: { type: "list", of: ProcessStep, required: false },
    estimatedTime: { type: "string", required: false },
    difficulty: { type: "string", required: false },
  },
}));

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
// SHARED FIELDS
// IMPORTANT: Keep "title" required here.
// Everything else optional; invariants enforced via computedFields.
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

const coreFields = {
  // identity
  title: { type: "string", required: true },
  subtitle: { type: "string", required: false },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },

  // Content classification / display helpers (used across repo)
  docKind: { type: "string", required: false },
  density: { type: "string", required: false },
  order: { type: "number", required: false },
  volumeNumber: { type: "string", required: false },
  resourceType: { type: "string", required: false },

  // dates / publish flags
  date: { type: "date", required: false },
  updated: { type: "date", required: false },
  published: { type: "boolean", required: false },
  draft: { type: "boolean", required: false },

  // routing
  slug: { type: "string", required: false },
  href: { type: "string", required: false },

  // organisation
  layout: { type: "string", required: false },
  theme: { type: "string", required: false },
  category: { type: "string", required: false },
  tags: { type: "list", of: { type: "string" }, required: false },

  // author
  author: { type: "string", required: false },
  authorTitle: { type: "string", required: false },
  authorNote: { type: "string", required: false },

  // visuals
  coverImage: { type: "string", required: false },
  featuredImage: { type: "string", required: false },
  coverAspect: { type: "string", required: false },
  coverFit: { type: "string", required: false },
  coverPosition: { type: "string", required: false },

  // features
  featured: { type: "boolean", required: false },
  keyInsights: { type: "list", of: { type: "string" }, required: false },
  readTime: { type: "string", required: false },
  contentOnly: { type: "boolean", required: false },

  // Social / distribution metadata
  socialCaption: { type: "string", required: false },

  // Flexible "resources" field: can be array OR object across old content
  // JSON is the only safe way to support both shapes without refactoring content.
  resources: { type: "json", required: false },

  // access control
  accessLevel: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false },
  tier: { type: "string", required: false },
  lockMessage: { type: "string", required: false },

  // misc + warning fix
  label: { type: "string", required: false },

  // SEO
  ...seoFields,
} as const;

// ------------------------------------------------------------
// COMPUTED FIELD FACTORY (INVARIANTS-FIRST)
// These are the fields your UI should depend on, not raw frontmatter.
// ------------------------------------------------------------
function createComputedFields(prefix: string, routeBase: string): ComputedFields {
  return {
    // ✅ INVARIANT: slugSafe always non-empty OR build fails validation
    slugSafe: {
      type: "string",
      resolve: (doc) => cleanSlug(doc?.slug) || defaultSlugFrom(doc, prefix) || "",
    },

    // ✅ INVARIANT: hrefSafe always exists
    hrefSafe: {
      type: "string",
      resolve: (doc) => cleanSlug(doc?.href) ? safeString(doc.href) : defaultHrefFrom(doc, prefix, routeBase),
    },

    // ✅ INVARIANT: titleSafe always string non-empty
    titleSafe: {
      type: "string",
      resolve: (doc) => {
        const t = safeString(doc?.title).trim();
        return t || "Untitled";
      },
    },

    // ✅ INVARIANT: excerptSafe always string (may be empty)
    excerptSafe: {
      type: "string",
      resolve: (doc) => {
        const e = safeString(doc?.excerpt).trim();
        if (e) return e;
        const d = safeString(doc?.description).trim();
        return d || "";
      },
    },

    // ✅ INVARIANT: accessLevelSafe always one of three
    accessLevelSafe: {
      type: "string",
      resolve: (doc) => asAccessLevel(doc?.accessLevel),
    },

    // ✅ INVARIANT: draftSafe/publishedSafe always boolean
    draftSafe: {
      type: "boolean",
      resolve: (doc) => Boolean(doc?.draft),
    },
    publishedSafe: {
      type: "boolean",
      resolve: (doc) => (doc?.published === undefined ? true : Boolean(doc?.published)),
    },

    // ✅ INVARIANT: readTimeSafe always string
    readTimeSafe: {
      type: "string",
      resolve: (doc) => {
        const rt = safeString(doc?.readTime).trim();
        if (rt) return rt;
        const raw = safeRawBody(doc);
        const a = analyzeContent(raw);
        return estimateReadTime(raw, a);
      },
    },

    // ✅ INVARIANT: coverAspectSafe with whitelist normalization
    coverAspectSafe: {
      type: "string",
      resolve: (doc) => {
        const aspect = safeString(doc?.coverAspect).toLowerCase().trim();
        const allowed = ["book", "16/9", "4/3", "1/1", "3/2", "2/3", "21/9"];
        if (allowed.includes(aspect)) return aspect;
        // Default based on content type
        return "16/9";
      },
    },

    // ✅ Useful: wordCount
    wordCount: {
      type: "number",
      resolve: (doc) => {
        const raw = safeRawBody(doc);
        if (!raw) return 0;
        return raw.split(/\s+/).filter(Boolean).length;
      },
    },

    // ✅ Validation summary (and optional fail)
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
    ...coreFields,
    downloads: { type: "list", of: DownloadLink, required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    series: { type: "string", required: false },
    part: { type: "number", required: false },
  },
  computedFields: createComputedFields("blog/", "blog"),
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...coreFields,
    mood: { type: "string", required: false },
    inspiration: { type: "string", required: false },
  },
  computedFields: createComputedFields("shorts/", "shorts"),
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...coreFields,
    aliases: { type: "list", of: { type: "string" }, required: false },
    isbn: { type: "string", required: false },
    pages: { type: "number", required: false },
    publisher: { type: "string", required: false },
    year: { type: "number", required: false },
  },
  computedFields: createComputedFields("books/", "books"),
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...coreFields,
    edition: { type: "string", required: false },
    isStandard: { type: "boolean", required: false },

    // Optional UX props (if you use them in CanonHero)
    difficulty: { type: "string", required: false },
    estimatedHours: { type: "number", required: false },
  },
  computedFields: {
    ...createComputedFields("canon/", "canon"),
    difficultySafe: {
      type: "string",
      resolve: (doc) => asDifficulty(doc?.difficulty),
    },
    estimatedHoursSafe: {
      type: "number",
      resolve: (doc) => {
        const n = Number(doc?.estimatedHours);
        return Number.isFinite(n) && n > 0 ? n : 0;
      },
    },
  },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...coreFields,

    // file info
    file: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    fileSize: { type: "string", required: false },
    fileFormat: { type: "string", required: false },

    // toggles
    isInteractive: { type: "boolean", required: false },
    isFillable: { type: "boolean", required: false },

    // metadata
    format: { type: "string", required: false },
    downloadType: { type: "string", required: false },
    paperFormats: { type: "list", of: { type: "string" }, required: false },

    // versioning
    version: { type: "string", required: false },
    language: { type: "string", required: false },
    aliases: { type: "list", of: { type: "string" }, required: false },

    // UI blocks
    useLegacyDiagram: { type: "boolean", required: false },
    useProTip: { type: "boolean", required: false },
    useFeatureGrid: { type: "boolean", required: false },
    useDownloadCTA: { type: "boolean", required: false },

    proTipType: { type: "string", required: false },
    proTipContent: { type: "string", required: false },

    featureGridColumns: { type: "number", required: false },
    featureGridItems: { type: "list", of: FeatureGridItem, required: false },

    ctaConfig: { type: "nested", of: CTAConfig, required: false },
    downloadProcess: { type: "nested", of: DownloadProcess, required: false },
    ctaPrimary: { type: "nested", of: CTAButton, required: false },
    ctaSecondary: { type: "nested", of: CTAButton, required: false },

    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    related: { type: "list", of: { type: "string" }, required: false },

    download: { type: "nested", of: DownloadMeta, required: false },
  },
  computedFields: createComputedFields("downloads/", "downloads"),
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...coreFields,
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },

    // ✅ raw startDate can be ISO or range-format string
    startDate: { type: "string", required: false },
    endDate: { type: "string", required: false },
    timezone: { type: "string", required: false },

    isVirtual: { type: "boolean", required: false },
    maxAttendees: { type: "number", required: false },
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
    ...coreFields,
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
    ...coreFields,
    downloadUrl: { type: "string", required: false },
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
    ...coreFields,
    version: { type: "string", required: false },
    strategyType: { type: "string", required: false },
    industry: { type: "string", required: false },
    region: { type: "string", required: false },
    timeline: { type: "string", required: false },
    status: { type: "string", required: false },
  },
  computedFields: createComputedFields("strategy/", "strategy"),
}));

// ------------------------------------------------------------
// EXCLUSIONS (KEEP SIMPLE; RELY ON contentDirInclude)
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
    "public/**",
    "assets/**",
    "static/**",
    "uploads/**",
    "media/**",
    "**/.DS_Store",
    "**/Thumbs.db",
    "**/desktop.ini",
    "**/*.lnk",
    "**/*.bak",
    "**/*.tmp",
    "**/*.swp",
    "**/*.backup*",
    // binaries
    "**/*.pdf",
    "**/*.pptx",
    "**/*.docx",
    "**/*.xlsx",
    "**/*.zip",
    "**/*.rar",
    "**/*.7z",
    "**/*.mp4",
    "**/*.mp3",
  ];

  if (IS_WINDOWS) {
    exclusions.push("**/~$*.docx", "**/~$*.xlsx", "**/~$*.pptx");
  }

  return exclusions;
}

// ------------------------------------------------------------
// MAIN CONFIG
// ------------------------------------------------------------
export default makeSource({
  contentDirPath: "content",
  contentDirInclude: ["blog", "shorts", "books", "canon", "downloads", "events", "prints", "resources", "strategy"],
  contentDirExclude: getExclusions(),
  documentTypes: [Post, Short, Book, Canon, Download, Event, Print, Resource, Strategy],
  disableImportAliasWarning: true,
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },

  onSuccess: async (importData) => {
    const data = await importData();
    const allDocs: any[] = (data as any)?.allDocuments || [];

    const counts: Record<string, number> = {};
    let valid = 0;
    let invalid = 0;
    const samples: string[] = [];

    for (const doc of allDocs) {
      const t = safeString(doc?.type || "unknown");
      counts[t] = (counts[t] || 0) + 1;

      const v = doc?.validation as ValidationResult | undefined;
      if (v?.isValid) valid++;
      else {
        invalid++;
        if (samples.length < 8) {
          samples.push(`${t} ${safeString(doc?._id)} → ${(v?.errors || ["Validation failed"]).join(", ")}`);
        }
      }
    }

    console.log("\n============================================================");
    console.log("📊 CONTENTLAYER BUILD COMPLETE (INVARIANTS-FIRST)");
    console.log("============================================================");
    console.log(`Platform: ${process.platform}${IS_WINDOWS ? " (Windows)" : ""}`);
    console.log(`Docs: ${allDocs.length}`);
    console.log("By type:", counts);
    console.log(`Validation: valid=${valid} invalid=${invalid}`);

    if (invalid > 0) {
      console.warn("\n⚠️  Invalid document samples:");
      samples.forEach((s) => console.warn("  -", s));
      if (FAIL_ON_INVALID) {
        throw new Error(`Contentlayer invariants failed (${invalid} invalid docs). Fix frontmatter or set CONTENTLAYER_FAIL_ON_INVALID=false.`);
      }
    }

    console.log("============================================================\n");
  },
});