import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const safeString = (v: unknown, fallback = "") =>
  typeof v === "string" ? v.trim() : fallback;

const safeDate = (v: unknown) => {
  if (!v) return new Date();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const getSlug = (doc: any) => {
  const direct = safeString(doc?.slug, "");
  if (direct) return direct;
  const raw = safeString(doc?._raw?.flattenedPath, "");
  return raw || "untitled";
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
  date: { type: "date", required: true as const },
  description: { type: "string", required: false as const },
  excerpt: { type: "string", required: false as const },
  draft: { type: "boolean", required: false as const, default: false },
  featured: { type: "boolean", required: false as const, default: false },
  tags: { type: "list", of: { type: "string" }, required: false as const },
  author: {
    type: "string",
    required: false as const,
    default: "Abraham of London",
  },
  slug: { type: "string", required: false as const },
  published: { type: "boolean", required: false as const, default: true },
};

const SHARED_FIELDS = {
  ogTitle: { type: "string", required: false as const },
  ogDescription: { type: "string", required: false as const },
  socialCaption: { type: "string", required: false as const },
  readTime: { type: "string", required: false as const },
  category: { type: "string", required: false as const },
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
  authorTitle: { type: "string", required: false as const },
  resources: { type: "json", required: false as const },
  relatedDownloads: { type: "list", of: { type: "string" }, required: false as const },
  subtitle: { type: "string", required: false as const },
  layout: { type: "string", required: false as const },
  href: { type: "string", required: false as const },
};

const createDocumentType = (
  name: string,
  filePathPattern: string,
  fields: Record<string, any>,
  computedFields: Record<string, any> = {}
) =>
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
      safeTitle: { type: "string", resolve: (doc: any) => safeString(doc?.title, "Untitled") },
      safeDate: { type: "date", resolve: (doc: any) => safeDate(doc?.date) },
      ...computedFields,
    },
  }));

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
    tier: { type: "string", required: false },
  },
  {
    hasFile: {
      type: "boolean",
      resolve: (doc: any) => Boolean(doc?.fileUrl || doc?.downloadUrl || doc?.pdfPath || doc?.file),
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
      resolve: (doc: any) => {
        const lu = doc?.lastUpdated ? new Date(doc.lastUpdated) : null;
        const d = doc?.date ? new Date(doc.date) : null;
        if (!lu || !d) return false;
        return lu > d;
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
      resolve: (doc: any) => (doc?.eventDate ? new Date(doc.eventDate) > new Date() : false),
    },
    isPast: {
      type: "boolean",
      resolve: (doc: any) => (doc?.eventDate ? new Date(doc.eventDate) <= new Date() : false),
    },
  }
);

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Book, Download, Canon, Short, Print, Resource, Event],
  contentDirExclude: ["node_modules", ".git", ".DS_Store", "Thumbs.db", ".next", ".contentlayer"],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["heading-anchor"], "aria-hidden": "true" } }],
    ],
  },
  onSuccess: async (importData) => {
    try {
      const { allDocuments } = await importData();
      console.log(`✅ Contentlayer processed ${allDocuments.length} documents`);
    } catch (err: any) {
      console.error("⚠️ Contentlayer onSuccess error:", err?.message || err);
    }
  },
});