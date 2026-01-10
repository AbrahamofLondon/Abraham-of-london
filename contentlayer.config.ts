// contentlayer.config.ts — PRODUCTION SAFE (Cross-Platform)
import path from "path";
import { defineDocumentType, makeSource } from "contentlayer2/source-files";

// ✅ WINDOWS-SAFE: Use path.join instead of path.resolve for better cross-platform
const contentDirPath = path.join(process.cwd(), "content");

// ----------------------------------------------------------------------------
// helpers (deterministic, safe)
// ----------------------------------------------------------------------------
const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asBool = (v: unknown): boolean => v === true;
const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const safeSlug = (s: string) =>
  s
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-._]/g, "")
    .toLowerCase();

const filenameSlug = (doc: any) =>
  safeSlug(asString(doc?._raw?.sourceFileName).replace(/\.(md|mdx)$/i, ""));

// ✅ WINDOWS-SAFE: Normalize backslashes to forward slashes
const inferSection = (flattenedPath: string): string => {
  const normalizedPath = flattenedPath.replace(/\\/g, "/");
  const first = normalizedPath.split("/")[0] || "";
  switch (first) {
    case "blog":
    case "books":
    case "canon":
    case "downloads":
    case "shorts":
    case "events":
    case "prints":
    case "resources":
    case "strategy":
      return first;
    default:
      return "";
  }
};

const calculateReadingTime = (raw: string): number => {
  const text = raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~>|`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
};

const generateExcerpt = (raw: string, max = 160): string => {
  const text = raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~>|`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "Read this document for practical insight and direction.";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
};

// ----------------------------------------------------------------------------
// shared fields
// ----------------------------------------------------------------------------
const SharedFields = {
  title: { type: "string", required: true },
  slug: { type: "string", required: false },
  href: { type: "string", required: false },
  date: { type: "date", required: false },
  updated: { type: "date", required: false },

  author: { type: "string", required: false },
  authorTitle: { type: "string", required: false },

  excerpt: { type: "string", required: false },
  description: { type: "string", required: false },
  subtitle: { type: "string", required: false },

  draft: { type: "boolean", required: false },
  published: { type: "boolean", required: false },

  tags: { type: "list", of: { type: "string" }, required: false },
  category: { type: "string", required: false },

  ogTitle: { type: "string", required: false },
  ogDescription: { type: "string", required: false },
  socialCaption: { type: "string", required: false },
  canonicalUrl: { type: "string", required: false },

  coverImage: { type: "string", required: false },
  coverAspect: { type: "string", required: false },
  coverFit: { type: "string", required: false },
  coverPosition: { type: "string", required: false },

  featured: { type: "boolean", required: false },
  priority: { type: "number", required: false },

  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },
  tier: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false },

  preload: { type: "boolean", required: false },
  version: { type: "string", required: false },

  aliases: { type: "list", of: { type: "string" }, required: false },
} as const;

// ----------------------------------------------------------------------------
// computed fields (deterministic, no side effects)
// ----------------------------------------------------------------------------
const computedFields = {
  sectionComputed: {
    type: "string" as const,
    resolve: (doc: any) => inferSection(asString(doc?._raw?.flattenedPath)),
  },

  slugComputed: {
    type: "string" as const,
    resolve: (doc: any) => {
      const explicit = safeSlug(asString(doc.slug));
      if (explicit) return explicit;

      const fromFile = filenameSlug(doc);
      if (fromFile) return fromFile;

      const fp = asString(doc?._raw?.flattenedPath) || "unknown";
      return safeSlug(fp.split("/").pop() || fp) || "untitled";
    },
  },

  hrefComputed: {
    type: "string" as const,
    resolve: (doc: any) => {
      const explicit = asString(doc.href).trim();
      if (explicit) return explicit;

      const slug = safeSlug(asString(doc.slug)) || filenameSlug(doc);
      const flattenedPath = asString(doc?._raw?.flattenedPath);
      const section = inferSection(flattenedPath);

      const prefix = section ? `/${section}/` : "/";

      return `${prefix}${slug || ""}`;
    },
  },

  dateComputed: {
    type: "date" as const,
    resolve: (doc: any) => {
      if (doc.date) return doc.date;
      if (doc.updated) return doc.updated;

      const file = asString(doc?._raw?.sourceFileName);
      const m = file.match(/(\d{4}-\d{2}-\d{2})/);
      if (m?.[1]) return m[1];

      return "1970-01-01"; // Deterministic fallback
    },
  },

  readTime: {
    type: "number" as const,
    resolve: (doc: any) => {
      const rt = (doc as any).readTime;
      if (typeof rt === "number" && Number.isFinite(rt) && rt > 0) return rt;

      const raw = asString(doc?.body?.raw) || asString(doc?.body?.code) || "";
      return calculateReadingTime(raw);
    },
  },

  excerptComputed: {
    type: "string" as const,
    resolve: (doc: any) => {
      const ex = asString(doc.excerpt).trim();
      if (ex) return ex;

      const desc = asString(doc.description).trim();
      if (desc) return desc;

      const raw = asString(doc?.body?.raw) || asString(doc?.body?.code) || "";
      return generateExcerpt(raw);
    },
  },

  publishedComputed: {
    type: "boolean" as const,
    resolve: (doc: any) => {
      if (asBool(doc.draft)) return false;
      if (typeof doc.published === "boolean") return doc.published;
      return true;
    },
  },

  tagsComputed: {
    type: "list" as const,
    of: { type: "string" as const },
    resolve: (doc: any) => asArray<string>(doc.tags).filter(Boolean),
  },
};

// ----------------------------------------------------------------------------
// document types
// ----------------------------------------------------------------------------
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    series: { type: "string", required: false },
    isSeriesPart: { type: "boolean", required: false },
    seriesOrder: { type: "number", required: false },
  },
  computedFields: {
    ...computedFields,
    readTimeString: {
      type: "string" as const,
      resolve: (doc: any) => `${computedFields.readTime.resolve(doc)} min read`,
    },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    isbn: { type: "string", required: false },
    pages: { type: "number", required: false },
    publisher: { type: "string", required: false },
    publishedDate: { type: "date", required: false },
    edition: { type: "string", required: false },
    format: { type: "string", required: false },
  },
  computedFields,
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    canonType: { type: "string", required: false },
    volume: { type: "string", required: false },
    part: { type: "string", required: false },
  },
  computedFields,
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,

    downloadType: { type: "string", required: false },
    format: { type: "string", required: false },
    fileFormat: { type: "string", required: false },
    paperFormats: { type: "list", of: { type: "string" }, required: false },

    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
    pdfPath: { type: "string", required: false },
    file: { type: "string", required: false },

    fileSize: { type: "string", required: false },
    checksumMd5: { type: "string", required: false },

    isInteractive: { type: "boolean", required: false },
    isFillable: { type: "boolean", required: false },

    language: { type: "string", required: false },

    ctaPrimary: { type: "json", required: false },
    ctaSecondary: { type: "json", required: false },
    related: { type: "json", required: false },
    ctaConfig: { type: "json", required: false },
    downloadProcess: { type: "json", required: false },
    featureGridItems: { type: "json", required: false },

    useLegacyDiagram: { type: "boolean", required: false },
    useProTip: { type: "boolean", required: false },
    useFeatureGrid: { type: "boolean", required: false },
    useDownloadCTA: { type: "boolean", required: false },

    proTipType: { type: "string", required: false },
    proTipContent: { type: "string", required: false },

    featureGridColumns: { type: "number", required: false },

    contentOnly: { type: "boolean", required: false },
    requiresEmail: { type: "boolean", required: false },
    emailFieldLabel: { type: "string", required: false },
    emailSuccessMessage: { type: "string", required: false },
  },
  computedFields: {
    ...computedFields,
    downloadUrlComputed: {
      type: "string" as const,
      resolve: (doc: any) => {
        const url =
          asString(doc.downloadUrl).trim() ||
          asString(doc.fileUrl).trim() ||
          asString(doc.downloadFile).trim() ||
          asString(doc.pdfPath).trim() ||
          asString(doc.file).trim();

        return url || "";
      },
    },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    shortType: { type: "string", required: false },
    audience: { type: "string", required: false },
    theme: { type: "string", required: false },
    hook: { type: "string", required: false },
    callToAction: { type: "string", required: false },
  },
  computedFields,
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    eventType: { type: "string", required: false },
    location: { type: "string", required: false },
    startDate: { type: "string", required: false },
    endDate: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
    eventDate: { type: "string", required: false },
    time: { type: "string", required: false },
    timezone: { type: "string", required: false },
    isVirtual: { type: "boolean", required: false },
    meetingLink: { type: "string", required: false },
  },
  computedFields,
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    printType: { type: "string", required: false },
    format: { type: "string", required: false },
    paperFormats: { type: "list", of: { type: "string" }, required: false },
    fileSize: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    isPhysical: { type: "boolean", required: false },
    price: { type: "number", required: false },
    currency: { type: "string", required: false },
  },
  computedFields,
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    resourceType: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    links: { type: "json", required: false },
    resources: { type: "json", required: false },
  },
  computedFields,
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    strategyType: { type: "string", required: false },
    stage: { type: "string", required: false },
    industry: { type: "string", required: false },
    region: { type: "string", required: false },
    complexity: { type: "string", required: false },
    timeframe: { type: "string", required: false },
    deliverables: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields,
}));

// ----------------------------------------------------------------------------
// source (safe configuration)
// ----------------------------------------------------------------------------
export default makeSource({
  contentDirPath,
  documentTypes: [Post, Book, Canon, Download, Short, Event, Print, Resource, Strategy],

  // Safe error handling
  onExtraFieldData: "ignore",
  onUnknownDocuments: "skip",
  disableImportAliasWarning: true,

  // ✅ QUIET mode for production
  onSuccess: async () => {
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Contentlayer: Content generated");
    }
  },
  
  // ✅ ERROR handling without crashes
  onError: (error) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Contentlayer warning:", error.message);
    }
    // Don't crash the build
  },
});

export const allDocumentTypes = {
  Post,
  Book,
  Canon,
  Download,
  Short,
  Event,
  Print,
  Resource,
  Strategy,
};

export { computedFields };