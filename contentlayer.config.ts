// contentlayer.config.ts — Robust, backward compatible, Windows-safe
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const safeString = (v: unknown, fallback = "") =>
  typeof v === "string" ? v.trim() : fallback;

const getSlug = (doc: any) => {
  const direct = safeString(doc?.slug, "");
  if (direct) return direct;

  const flattened = safeString(doc?._raw?.flattenedPath, "");
  if (flattened) return flattened;

  const file = safeString(doc?._raw?.sourceFileName, "");
  return file.replace(/\.mdx?$/, "") || "untitled";
};

const getUrl =
  (prefix: string) =>
  (doc: any): string => {
    const href = safeString(doc?.href, "");
    if (href) return href;
    return `/${prefix}/${getSlug(doc)}`;
  };

const CORE_FIELDS = {
  title: { type: "string", required: true as const },
  date: { type: "date", required: false as const },
  description: { type: "string", required: false as const },
  excerpt: { type: "string", required: false as const },
  draft: { type: "boolean", required: false as const, default: false },
  featured: { type: "boolean", required: false as const, default: false },
  tags: { type: "list", of: { type: "string" }, required: false as const },
  author: { type: "string", required: false as const, default: "Abraham of London" },

  slug: { type: "string", required: false as const },
  href: { type: "string", required: false as const },

  coverImage: { type: "string", required: false as const },
  coverAspect: {
    type: "enum",
    required: false as const,
    options: ["wide", "book", "square", "portrait"],
    default: "book",
  },
  coverFit: {
    type: "enum",
    required: false as const,
    options: ["cover", "contain", "fill", "none"],
    default: "cover",
  },
  coverPosition: { type: "string", required: false as const, default: "center" },

  // Legacy time fields
  readTime: { type: "string", required: false as const },
  readingTime: { type: "string", required: false as const },

  // Social
  ogTitle: { type: "string", required: false as const },
  ogDescription: { type: "string", required: false as const },
  socialCaption: { type: "string", required: false as const },
  subtitle: { type: "string", required: false as const },
  category: { type: "string", required: false as const },
  resources: { type: "json", required: false as const },
  relatedDownloads: { type: "list", of: { type: "string" }, required: false as const },
  layout: { type: "string", required: false as const },
};

const createType = (
  name: string,
  filePathPattern: string,
  extraFields: Record<string, any> = {},
  extraComputed: Record<string, any> = {}
) =>
  defineDocumentType(() => ({
    name,
    filePathPattern,
    contentType: "mdx",
    fields: {
      ...CORE_FIELDS,
      ...extraFields,
    },
    computedFields: {
      slugComputed: { type: "string", resolve: (doc) => getSlug(doc) },
      url: { type: "string", resolve: getUrl(name.toLowerCase()) },
      safeTitle: { type: "string", resolve: (doc) => safeString(doc.title, "Untitled") },
      effectiveReadingTime: {
        type: "string",
        resolve: (doc) => safeString(doc.readingTime, safeString(doc.readTime, "")),
      },
      ...extraComputed,
    },
  }));

export const Post = createType("Post", "blog/**/*.{md,mdx}", {
  series: { type: "string", required: false },
  seriesOrder: { type: "number", required: false },
  featuredImage: { type: "string", required: false },
  downloads: { type: "json", required: false },
  density: { type: "string", required: false },
  isPartTwo: { type: "boolean", required: false, default: false },
  previousPart: { type: "string", required: false },
});

export const Book = createType("Book", "books/**/*.{md,mdx}", {
  isbn: { type: "string", required: false },
  accessLevel: {
    type: "enum",
    required: false,
    options: ["public", "inner-circle", "patron"],
    default: "public",
  },
  lockMessage: { type: "string", required: false },
});

export const Canon = createType("Canon", "canon/**/*.{md,mdx}", {
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

export const Download = createType(
  "Download",
  "downloads/**/*.{md,mdx}",
  {
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
    pdfPath: { type: "string", required: false },
    file: { type: "string", required: false },
    fileSize: { type: "string", required: false },

    // The exact “extra fields” your logs complained about:
    fileFormat: { type: "string", required: false }, // "PDF"
    format: { type: "string", required: false }, // legacy
    canonicalUrl: { type: "string", required: false },
    updated: { type: "date", required: false },
    language: { type: "string", required: false, default: "en-GB" },

    useLegacyDiagram: { type: "boolean", required: false, default: false },
    useProTip: { type: "boolean", required: false, default: false },
    useFeatureGrid: { type: "boolean", required: false, default: false },
    useDownloadCTA: { type: "boolean", required: false, default: false },

    proTipType: { type: "string", required: false },
    proTipContent: { type: "string", required: false },

    featureGridColumns: { type: "number", required: false, default: 3 },
    featureGridItems: { type: "json", required: false },

    ctaConfig: { type: "json", required: false },
    ctaPrimary: { type: "json", required: false },
    ctaSecondary: { type: "json", required: false },

    downloadProcess: { type: "json", required: false },
    related: { type: "list", of: { type: "string" }, required: false },

    // Keep these for tiering evolution
    tier: { type: "string", required: false },
    accessLevel: {
      type: "enum",
      required: false,
      options: ["public", "registered", "inner-circle"],
      default: "public",
    },

    fileType: {
      type: "enum",
      required: false,
      options: ["pdf", "docx", "xlsx", "zip", "image", "other"],
      default: "pdf",
    },
    version: { type: "string", required: false, default: "1.0" },
  },
  {
    hasFile: {
      type: "boolean",
      resolve: (doc) => !!(doc.fileUrl || doc.downloadUrl || doc.pdfPath || doc.file),
    },
  }
);

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Book, Canon, Download],
  contentDirExclude: ["node_modules", ".git", ".DS_Store", "Thumbs.db", ".next", ".contentlayer"],

  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["heading-anchor"] } }],
    ],
  },

  // Be tolerant to legacy growth without nuking builds
  onUnknownDocuments: "skip-warn",
  disableImportAliasWarning: true,

  // Windows-safe: no dynamic import here
  onSuccess: async () => {
    console.log("✅ Contentlayer generated successfully");
  },
});