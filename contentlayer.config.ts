// contentlayer.config.ts
import {
  defineDocumentType,
  defineNestedType,
  makeSource,
} from "contentlayer2/source-files";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function estimateReadTime(text: string): string {
  const words = text
    .replace(/[`*_>#~\[\]\(\)\{\}.,;:!?'"“”‘’\\\/|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

// ------------------------------------------------------------
// Nested types (Contentlayer2-safe)
// RULE:
// - list:   of: NestedType
// - nested: { type: "nested", of: NestedType }
// ------------------------------------------------------------
const DownloadLink = defineNestedType(() => ({
  name: "DownloadLink",
  fields: {
    title: { type: "string", required: true },
    url: { type: "string", required: true },
    format: { type: "string", required: false },
    size: { type: "string", required: false },
  },
}));

const CTADetail = defineNestedType(() => ({
  name: "CTADetail",
  fields: {
    label: { type: "string", required: true },
    value: { type: "string", required: true },
    icon: { type: "string", required: false },
    detail: { type: "string", required: false },
  },
}));

const CTAFeature = defineNestedType(() => ({
  name: "CTAFeature",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    icon: { type: "string", required: false },
  },
}));

const CTAConfig = defineNestedType(() => ({
  name: "CTAConfig",
  fields: {
    badge: { type: "string", required: false },
    tier: { type: "string", required: false },

    details: { type: "list", of: CTADetail, required: false },

    // some files store as strings, some as objects
    featuresText: { type: "list", of: { type: "string" }, required: false },
    features: { type: "list", of: CTAFeature, required: false },
  },
}));

const ProcessStep = defineNestedType(() => ({
  name: "ProcessStep",
  fields: {
    step: { type: "number", required: false },
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    icon: { type: "string", required: false },
  },
}));

const DownloadProcess = defineNestedType(() => ({
  name: "DownloadProcess",
  fields: {
    steps: { type: "list", of: ProcessStep, required: false },
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
  },
}));

const CTAButton = defineNestedType(() => ({
  name: "CTAButton",
  fields: {
    label: { type: "string", required: true },
    href: { type: "string", required: true },
  },
}));

// ------------------------------------------------------------
// Shared field fragments
// ------------------------------------------------------------
const seoFields = {
  ogTitle: { type: "string", required: false },
  ogDescription: { type: "string", required: false },
  ogImage: { type: "string", required: false },
  twitterTitle: { type: "string", required: false },
  twitterDescription: { type: "string", required: false },
  twitterImage: { type: "string", required: false },
} as const;

const coreFields = {
  type: { type: "string", required: false },

  title: { type: "string", required: true },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },

  date: { type: "date", required: false },
  updated: { type: "date", required: false },

  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },

  slug: { type: "string", required: false },
  href: { type: "string", required: false },

  author: { type: "string", required: false },
  authorTitle: { type: "string", required: false },

  tags: { type: "list", of: { type: "string" }, required: false },
  theme: { type: "string", required: false },
  category: { type: "string", required: false },

  socialCaption: { type: "string", required: false },

  layout: { type: "string", required: false },
  subtitle: { type: "string", required: false },

  canonicalUrl: { type: "string", required: false },
  density: { type: "string", required: false },

  coverImage: { type: "string", required: false },
  featuredImage: { type: "string", required: false },
  coverAspect: { type: "string", required: false },
  coverFit: { type: "string", required: false },
  coverPosition: { type: "string", required: false },

  // access controls used across content
  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },
  tier: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false },
  priority: { type: "number", required: false },
  preload: { type: "boolean", required: false },

  // fields you showed as "extra"
  audience: { type: "string", required: false },      // shorts
  resourceType: { type: "string", required: false },  // resources

  // allow object or list variants without schema fights
  resources: { type: "json", required: false },

  contentOnly: { type: "boolean", required: false },

  readTime: { type: "string", required: false },

  published: { type: "boolean", required: false, default: true },
  shortType: { type: "string", required: false },


  ...seoFields,
} as const;

// ------------------------------------------------------------
// Document Types
// ------------------------------------------------------------
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `blog/**/*.mdx`,
  contentType: "mdx",
  fields: {
    ...coreFields,
    downloads: { type: "list", of: DownloadLink, required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug ?? doc._raw.flattenedPath.replace(/^blog\//, ""),
    },
    href: {
      type: "string",
      resolve: (doc) =>
        doc.href ?? `/blog/${doc._raw.flattenedPath.replace(/^blog\//, "")}`,
    },
    readingTime: {
      type: "string",
      resolve: (doc) => estimateReadTime(doc.body.raw),
    },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: `shorts/**/*.mdx`,
  contentType: "mdx",
  fields: { ...coreFields },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug ?? doc._raw.flattenedPath.replace(/^shorts\//, ""),
    },
    href: {
      type: "string",
      resolve: (doc) =>
        doc.href ??
        `/shorts/${doc._raw.flattenedPath.replace(/^shorts\//, "")}`,
    },
    readingTime: {
      type: "string",
      resolve: (doc) => estimateReadTime(doc.body.raw),
    },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: `books/**/*.mdx`,
  contentType: "mdx",
  fields: {
    ...coreFields,
    aliases: { type: "list", of: { type: "string" }, required: false },
    order: { type: "number", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug ?? doc._raw.flattenedPath.replace(/^books\//, ""),
    },
    href: {
      type: "string",
      resolve: (doc) =>
        doc.href ?? `/books/${doc._raw.flattenedPath.replace(/^books\//, "")}`,
    },
  },
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: `canon/**/*.mdx`,
  contentType: "mdx",
  fields: {
    ...coreFields,
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug ?? doc._raw.flattenedPath.replace(/^canon\//, ""),
    },
    href: {
      type: "string",
      resolve: (doc) =>
        doc.href ?? `/canon/${doc._raw.flattenedPath.replace(/^canon\//, "")}`,
    },
  },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: `downloads/**/*.mdx`,
  contentType: "mdx",
  fields: {
    ...coreFields,

    file: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    fileSize: { type: "string", required: false },

    format: { type: "string", required: false },
    downloadType: { type: "string", required: false },
    paperFormats: { type: "list", of: { type: "string" }, required: false },
    isInteractive: { type: "boolean", required: false },
    isFillable: { type: "boolean", required: false },

    fileFormat: { type: "string", required: false },
    version: { type: "string", required: false },
    language: { type: "string", required: false },
    aliases: { type: "list", of: { type: "string" }, required: false },

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

    // ✅ THIS kills your one remaining mismatch:
    // legacy-canvas.mdx has `features: "Interactive fillable fields"`
    // Other files may use list/object -> we accept all safely.
    features: { type: "json", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug ?? doc._raw.flattenedPath.replace(/^downloads\//, ""),
    },
    href: {
      type: "string",
      resolve: (doc) =>
        doc.href ??
        `/downloads/${doc._raw.flattenedPath.replace(/^downloads\//, "")}`,
    },
  },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: `events/**/*.mdx`,
  contentType: "mdx",
  fields: {
    ...coreFields,
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },

    // your content shows a non-ISO combined string; keep it as string
    startDate: { type: "string", required: false },
  },
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: `prints/**/*.mdx`,
  contentType: "mdx",
  fields: { ...coreFields },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: `resources/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    ...coreFields,
    downloadUrl: { type: "string", required: false },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: `strategy/**/*.mdx`,
  contentType: "mdx",
  fields: {
    ...coreFields,
    version: { type: "string", required: false },
    strategyType: { type: "string", required: false },
    industry: { type: "string", required: false },
    region: { type: "string", required: false },
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Short, Book, Canon, Download, Event, Print, Resource, Strategy],

  // IMPORTANT: ignore templates & backups & generated json
  ignore: [
  "**/_*/**",
  "**/*BACKUP*/**",
  "**/.*/**",
  "downloads/_generated.downloads.json",
  "_templates/**",
  "**/_templates/**",
  "content/_templates/**",
  "**/content/_templates/**",
],

  disableImportAliasWarning: true,
});