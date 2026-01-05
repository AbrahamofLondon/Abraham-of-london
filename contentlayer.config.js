import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { pathToFileURL } from "url";

// ----------------------------
// Helpers (safe + minimal)
// ----------------------------
const safeString = (v, fallback = "") =>
  typeof v === "string" ? v.trim() : fallback;

const safeDate = (v) => {
  if (!v) return new Date();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const getSlug = (doc) => {
  if (typeof doc.slug === "string" && doc.slug.trim()) return doc.slug.trim();
  if (doc?._raw?.flattenedPath) {
    return doc._raw.flattenedPath;
  }
  return "untitled";
};

const getUrl = (prefix) => (doc) => {
  if (typeof doc.href === "string" && doc.href.trim()) return doc.href.trim();
  return `/${prefix}/${getSlug(doc)}`;
};

// ----------------------------
// Shared field blocks
// ----------------------------
const CORE_FIELDS = {
  title: { type: "string", required: true },
  date: { type: "date", required: true },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },
  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },
  tags: { type: "list", of: { type: "string" }, required: false },
  author: { type: "string", required: false, default: "Abraham of London" },
  slug: { type: "string", required: false },
  published: { type: "boolean", required: false, default: true },
};

const SHARED_FIELDS = {
  ogTitle: { type: "string", required: false },
  ogDescription: { type: "string", required: false },
  socialCaption: { type: "string", required: false },
  readTime: { type: "string", required: false },
  category: { type: "string", required: false },
  coverImage: { type: "string", required: false },
  coverAspect: {
    type: "enum",
    required: false,
    options: ["wide", "book", "square", "portrait"],
    default: "book",
  },
  coverFit: {
    type: "enum",
    required: false,
    options: ["cover", "contain", "fill", "none"],
    default: "cover",
  },
  coverPosition: { type: "string", required: false, default: "center" },
  authorTitle: { type: "string", required: false },
  resources: { type: "json", required: false },
  relatedDownloads: { type: "list", of: { type: "string" }, required: false },
  subtitle: { type: "string", required: false },
  layout: { type: "string", required: false },
  href: { type: "string", required: false },
};

// ----------------------------
// Factory
// ----------------------------
const createDocumentType = (name, filePathPattern, fields, computedFields = {}) =>
  defineDocumentType(() => ({
    name,
    filePathPattern,
    contentType: "mdx",
    fields: {
      ...CORE_FIELDS,
      ...SHARED_FIELDS,
      ...fields,
    },
    computedFields: {
      url: { type: "string", resolve: getUrl(name.toLowerCase()) },
      slugComputed: { type: "string", resolve: getSlug },
      safeTitle: { type: "string", resolve: (doc) => safeString(doc.title, "Untitled") },
      safeDate: { type: "date", resolve: (doc) => safeDate(doc.date) },
      ...computedFields,
    },
  }));

// ----------------------------
// Types
// ----------------------------
export const Post = createDocumentType("Post", "blog/**/*.{md,mdx}", {
  series: { type: "string", required: false },
  seriesOrder: { type: "number", required: false },
  featuredImage: { type: "string", required: false },
  readingTime: { type: "string", required: false },
  density: { type: "string", required: false },
  downloads: { type: "json", required: false },
  isPartTwo: { type: "boolean", required: false, default: false },
  previousPart: { type: "string", required: false },
});

export const Book = createDocumentType("Book", "books/**/*.{md,mdx}", {
  isbn: { type: "string", required: false },
  accessLevel: {
    type: "enum",
    required: false,
    options: ["public", "inner-circle", "patron"],
    default: "public",
  },
  lockMessage: { type: "string", required: false },
});

export const Download = createDocumentType(
  "Download",
  "downloads/**/*.{md,mdx}",
  {
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
    pdfPath: { type: "string", required: false },
    file: { type: "string", required: false },
    fileSize: { type: "string", required: false },
    fileType: {
      type: "enum",
      required: false,
      options: ["pdf", "docx", "xlsx", "zip", "image", "other"],
      default: "pdf",
    },
    version: { type: "string", required: false, default: "1.0" },
    accessLevel: {
      type: "enum",
      required: false,
      options: ["public", "registered", "inner-circle"],
      default: "public",
    },
    fileFormat: { type: "string", required: false },
    format: { type: "string", required: false },
    useLegacyDiagram: { type: "boolean", required: false, default: false },
    useProTip: { type: "boolean", required: false, default: false },
    useFeatureGrid: { type: "boolean", required: false, default: false },
    useDownloadCTA: { type: "boolean", required: false, default: false },
    ctaConfig: { type: "json", required: false },
    ctaPrimary: { type: "json", required: false },
    ctaSecondary: { type: "json", required: false },
    related: { type: "list", of: { type: "string" }, required: false },
    canonicalUrl: { type: "string", required: false },
    updated: { type: "date", required: false },
    language: { type: "string", required: false, default: "en-GB" },
    readingTime: { type: "string", required: false },
    proTipType: { type: "string", required: false },
    proTipContent: { type: "string", required: false },
    featureGridColumns: { type: "number", required: false, default: 3 },
    featureGridItems: { type: "json", required: false },
    downloadProcess: { type: "json", required: false },
    tier: { type: "string", required: false },
  },
  {
    hasFile: {
      type: "boolean",
      resolve: (doc) => !!(doc.fileUrl || doc.downloadUrl || doc.pdfPath || doc.file),
    },
  }
);

export const Canon = createDocumentType("Canon", "canon/**/*.{md,mdx}", {
  volumeNumber: { type: "string", required: false },
  order: { type: "number", required: false },
  lockMessage: { type: "string", required: false },
  accessLevel: {
    type: "enum",
    required: false,
    options: ["public", "inner-circle", "patron"],
    default: "inner-circle",
  },
});

export const Short = createDocumentType("Short", "shorts/**/*.{md,mdx}", {
  audience: { type: "string", required: false },
  theme: {
    type: "enum",
    required: false,
    options: ["gentle", "hard-truths", "hopeful", "urgent", "instructional", "reflective"],
  },
});

export const Print = createDocumentType("Print", "prints/**/*.{md,mdx}", {
  printType: {
    type: "enum",
    required: false,
    options: ["card", "playbook", "kit", "brief", "pack", "template", "worksheet"],
  },
  dimensions: { type: "string", required: false },
  orientation: {
    type: "enum",
    required: false,
    options: ["portrait", "landscape"],
    default: "portrait",
  },
});

export const Resource = createDocumentType(
  "Resource",
  "resources/**/*.{md,mdx}",
  {
    resourceType: {
      type: "enum",
      required: false,
      options: [
        "kit",
        "worksheet",
        "checklist",
        "blueprint",
        "scorecard",
        "framework",
        "charter",
        "agenda",
        "plan",
        "template",
        "guide",
      ],
    },
    downloadUrl: { type: "string", required: false },
    version: { type: "string", required: false, default: "1.0" },
    lastUpdated: { type: "date", required: false },
    readtime: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
  },
  {
    isUpdated: {
      type: "boolean",
      resolve: (doc) => {
        if (!doc.lastUpdated || !doc.date) return false;
        try {
          return new Date(doc.lastUpdated) > new Date(doc.date);
        } catch {
          return false;
        }
      },
    },
  }
);

export const Event = createDocumentType(
  "Event",
  "events/**/*.{md,mdx}",
  {
    eventDate: { type: "date", required: false },
    endDate: { type: "date", required: false },
    time: { type: "string", required: false },
    location: { type: "string", required: false },
    virtualLink: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
    registrationRequired: { type: "boolean", required: false, default: false },
    capacity: { type: "number", required: false },
    accessLevel: {
      type: "enum",
      required: false,
      options: ["public", "private", "invite-only"],
      default: "public",
    },
  },
  {
    isUpcoming: {
      type: "boolean",
      resolve: (doc) => (doc.eventDate ? new Date(doc.eventDate) > new Date() : false),
    },
    isPast: {
      type: "boolean",
      resolve: (doc) => (doc.eventDate ? new Date(doc.eventDate) <= new Date() : false),
    },
  }
);

// ----------------------------
// makeSource with Windows-compatible onSuccess
// ----------------------------
export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Book, Download, Canon, Short, Print, Resource, Event],
  contentDirExclude: [
    "node_modules",
    ".git",
    ".DS_Store",
    "Thumbs.db",
    ".next",
    ".contentlayer",
  ],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: { className: ["heading-anchor"], "aria-hidden": "true" },
        },
      ],
    ],
  },
  onSuccess: async (importData) => {
    try {
      const { allDocuments } = await importData();
      console.log(`✅ Contentlayer processed ${allDocuments.length} documents`);
    } catch (error) {
      console.error("⚠️ Error in onSuccess callback:", error.message);
    }
  },
});