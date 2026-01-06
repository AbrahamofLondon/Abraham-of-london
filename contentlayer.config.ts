// contentlayer.config.ts
// Windows compatibility shim - must be at the very top
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Force set working directory for Windows
if (process.platform === 'win32') {
  process.chdir(__dirname);
}

import { defineDocumentType, makeSource } from "contentlayer2/source-files";

type FieldDef =
  | { type: "string"; required?: boolean; default?: string }
  | { type: "boolean"; required?: boolean; default?: boolean }
  | { type: "date"; required?: boolean }
  | { type: "number"; required?: boolean }
  | { type: "list"; of: { type: "string" }; required?: boolean }
  | { type: "json"; required?: boolean };

const SharedFields: Record<string, FieldDef> = {
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

  readTime: { type: "string", required: false },
  draft: { type: "boolean", required: false, default: false },
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

  featured: { type: "boolean", required: false, default: false },
  priority: { type: "number", required: false },

  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },

  tier: { type: "string", required: false },
  requiresAuth: { type: "boolean", required: false, default: false },
  preload: { type: "boolean", required: false, default: false },
  version: { type: "string", required: false },
};

const computedFields = {
  slugComputed: {
    type: "string" as const,
    resolve: (doc: any) => doc.slug?.trim() || doc._raw.sourceFileName.replace(/\.mdx?$/, ""),
  },
  hrefComputed: {
    type: "string" as const,
    resolve: (doc: any) => {
      if (doc.href) return String(doc.href);
      const slug = (doc.slug ?? doc._raw.sourceFileName.replace(/\.mdx?$/, "")).trim();
      const fp = String(doc._raw.flattenedPath || "");
      const prefix = fp.startsWith("blog/")
        ? "/blog/"
        : fp.startsWith("books/")
          ? "/books/"
          : fp.startsWith("canon/")
            ? "/canon/"
            : fp.startsWith("downloads/")
              ? "/downloads/"
              : fp.startsWith("shorts/")
                ? "/shorts/"
                : fp.startsWith("events/")
                  ? "/events/"
                  : fp.startsWith("prints/")
                    ? "/prints/"
                    : fp.startsWith("resources/")
                      ? "/resources/"
                      : fp.startsWith("strategy/")
                        ? "/strategy/"
                        : "/";
      return `${prefix}${slug}`;
    },
  },
};

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    featuredImage: { type: "string", required: false },
    isPartTwo: { type: "boolean", required: false, default: false },
    previousPart: { type: "string", required: false },
    layout: { type: "string", required: false },
    density: { type: "string", required: false },
    resources: { type: "json", required: false },
    downloads: { type: "json", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields,
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    series: { type: "string", required: false },
  },
  computedFields,
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
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
    isInteractive: { type: "boolean", required: false, default: false },
    isFillable: { type: "boolean", required: false, default: false },
    layout: { type: "string", required: false },
    language: { type: "string", required: false },
    ctaPrimary: { type: "json", required: false },
    ctaSecondary: { type: "json", required: false },
    related: { type: "json", required: false },
    useLegacyDiagram: { type: "boolean", required: false, default: false },
    useProTip: { type: "boolean", required: false, default: false },
    useFeatureGrid: { type: "boolean", required: false, default: false },
    useDownloadCTA: { type: "boolean", required: false, default: false },
    proTipType: { type: "string", required: false },
    proTipContent: { type: "string", required: false },
    featureGridColumns: { type: "number", required: false },
    featureGridItems: { type: "json", required: false },
    ctaConfig: { type: "json", required: false },
    downloadProcess: { type: "json", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    contentOnly: { type: "boolean", required: false, default: false },
  },
  computedFields,
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
    readtime: { type: "string", required: false },
    readingTime: { type: "string", required: false },
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
  },
  computedFields,
}));

// Windows-compatible configuration
export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Post, Book, Canon, Download, Short, Event, Print, Resource, Strategy],
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
  // Skip problematic documents instead of failing
  onUnknownDocuments: "skip-warn" as const,
  disableImportAliasWarning: true,
});