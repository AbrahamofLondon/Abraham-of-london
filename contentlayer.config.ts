import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

/* ========================================================================== */
/* ENTERPRISE CONTENTLAYER CONFIGURATION                                      */
/* Cross-platform compatible, production-ready content processing             */
/* ========================================================================== */

const IS_WINDOWS = process.platform === 'win32';

/* -------------------------------------------------------------------------- */
/* PATH NORMALIZATION UTILITIES                                               */
/* -------------------------------------------------------------------------- */

const normalizePath = (path: string): string => {
  if (!path) return '';
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
};

const generateSlug = (filePath: string): string => {
  return normalizePath(filePath)
    .split('/')
    .pop()
    ?.replace(/\.mdx?$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled';
};

/* -------------------------------------------------------------------------- */
/* COMPREHENSIVE FIELD SCHEMA                                                 */
/* -------------------------------------------------------------------------- */

const createFieldSchema = () => ({
  title: { type: "string" as const, required: true },
  subtitle: { type: "string" as const, required: false },
  description: { type: "string" as const, required: false },
  excerpt: { type: "string" as const, required: false },
  
  date: { type: "date" as const, required: false },
  updated: { type: "date" as const, required: false },
  publishDate: { type: "date" as const, required: false },
  expireDate: { type: "date" as const, required: false },
  eventDate: { type: "date" as const, required: false },
  
  slug: { type: "string" as const, required: false },
  href: { type: "string" as const, required: false },
  canonicalUrl: { type: "string" as const, required: false },
  
  category: { type: "string" as const, required: false },
  categories: { type: "list" as const, of: { type: "string" as const }, required: false },
  tags: { type: "list" as const, of: { type: "string" as const }, required: false },
  
  author: { type: "string" as const, required: false },
  authors: { type: "list" as const, of: { type: "string" as const }, required: false },
  
  coverImage: { type: "string" as const, required: false },
  coverAspect: { type: "string" as const, required: false },
  coverFit: { type: "string" as const, required: false },
  coverPosition: { type: "string" as const, required: false },
  
  layout: { type: "string" as const, required: false },
  theme: { type: "string" as const, required: false },
  
  readTime: { type: "string" as const, required: false },
  readtime: { type: "string" as const, required: false },
  readingTime: { type: "string" as const, required: false },
  
  wordCount: { type: "number" as const, required: false },
  
  draft: { type: "boolean" as const, required: false, default: false },
  published: { type: "boolean" as const, required: false, default: true },
  featured: { type: "boolean" as const, required: false, default: false },
  archived: { type: "boolean" as const, required: false, default: false },
  
  requiredTier: { type: "string" as const, required: false },
  tier: { type: "string" as const, required: false },
  accessLevel: { type: "string" as const, required: false },
  lockMessage: { type: "string" as const, required: false },
  
  // SEO
  ogTitle: { type: "string" as const, required: false },
  ogDescription: { type: "string" as const, required: false },
  metaDescription: { type: "string" as const, required: false },
  keywords: { type: "list" as const, of: { type: "string" as const }, required: false },
  
  // Asset Links
  file: { type: "string" as const, required: false },
  downloadFile: { type: "string" as const, required: false },
  pdfPath: { type: "string" as const, required: false },
  downloadUrl: { type: "string" as const, required: false },
  fileSize: { type: "string" as const, required: false },
  
  // Event Specific
  time: { type: "string" as const, required: false },
  location: { type: "string" as const, required: false },
  registrationUrl: { type: "string" as const, required: false },
  
  // Canon/Series Specific
  volumeNumber: { type: "string" as const, required: false },
  order: { type: "number" as const, required: false },
  series: { type: "string" as const, required: false },
  part: { type: "number" as const, required: false },
  
  // Relations
  related: { type: "list" as const, of: { type: "string" as const }, required: false },
  
  // Rich Content
  resources: { type: "json" as const, required: false },
  meta: { type: "json" as const, required: false },
  
  // Book Specific
  isbn: { type: "string" as const, required: false },
  publisher: { type: "string" as const, required: false },
  
  // Devotional/Sermon
  bibleVerse: { type: "string" as const, required: false },
  
  // Media
  videoUrl: { type: "string" as const, required: false },
  audioUrl: { type: "string" as const, required: false },
});

/* -------------------------------------------------------------------------- */
/* COMPUTED FIELDS FACTORY                                                    */
/* -------------------------------------------------------------------------- */

const createComputedFields = (basePath: string) => ({
  url: {
    type: "string" as const,
    resolve: (doc: any) => {
      if (doc.canonicalUrl) return doc.canonicalUrl;
      const slug = doc.slug || generateSlug(doc._raw.flattenedPath);
      return normalizePath(`/${basePath}/${slug}`);
    }
  },

  computedSlug: {
    type: "string" as const,
    resolve: (doc: any) => doc.slug || generateSlug(doc._raw.flattenedPath)
  },

  isPublished: {
    type: "boolean" as const,
    resolve: (doc: any) => {
      return (doc.published !== false) && !doc.draft && !doc.archived;
    }
  },

  computedReadingTime: {
    type: "string" as const,
    resolve: (doc: any) => {
      return doc.readingTime || doc.readTime || doc.readtime || "5 min read";
    }
  },

  computedTier: {
    type: "string" as const,
    resolve: (doc: any) => doc.requiredTier || doc.tier || 'free'
  },

  fileInfo: {
    type: "json" as const,
    resolve: (doc: any) => {
      const path = doc.file || doc.downloadFile || doc.downloadUrl || doc.pdfPath || '';
      return {
        path: normalizePath(path),
        size: doc.fileSize || null,
        extension: path ? path.split('.').pop()?.toLowerCase() : null
      };
    }
  }
});

/* -------------------------------------------------------------------------- */
/* DOCUMENT TYPE FACTORY                                                      */
/* -------------------------------------------------------------------------- */

const createDocumentType = (
  name: string,
  pattern: string,
  basePath: string
) => {
  return defineDocumentType(() => ({
    name,
    filePathPattern: pattern,
    contentType: "mdx" as const,
    fields: createFieldSchema(),
    computedFields: createComputedFields(basePath)
  }));
};

/* -------------------------------------------------------------------------- */
/* DOCUMENT TYPE DEFINITIONS (ALL 24 TYPES)                                   */
/* -------------------------------------------------------------------------- */

export const Post = createDocumentType("Post", "blog/**/*.{md,mdx}", "blog");
export const Canon = createDocumentType("Canon", "canon/**/*.{md,mdx}", "canon");
export const Book = createDocumentType("Book", "books/**/*.{md,mdx}", "books");
export const Short = createDocumentType("Short", "shorts/**/*.{md,mdx}", "shorts");
export const Event = createDocumentType("Event", "events/**/*.{md,mdx}", "events");
export const Resource = createDocumentType("Resource", "resources/**/*.{md,mdx}", "resources");
export const Strategy = createDocumentType("Strategy", "strategy/**/*.{md,mdx}", "strategy");
export const Article = createDocumentType("Article", "articles/**/*.{md,mdx}", "articles");
export const Guide = createDocumentType("Guide", "guides/**/*.{md,mdx}", "guides");
export const Tutorial = createDocumentType("Tutorial", "tutorials/**/*.{md,mdx}", "tutorials");
export const CaseStudy = createDocumentType("CaseStudy", "case-studies/**/*.{md,mdx}", "case-studies");
export const Whitepaper = createDocumentType("Whitepaper", "whitepapers/**/*.{md,mdx}", "whitepapers");
export const Report = createDocumentType("Report", "reports/**/*.{md,mdx}", "reports");
export const Newsletter = createDocumentType("Newsletter", "newsletters/**/*.{md,mdx}", "newsletters");
export const Sermon = createDocumentType("Sermon", "sermons/**/*.{md,mdx}", "sermons");
export const Devotional = createDocumentType("Devotional", "devotionals/**/*.{md,mdx}", "devotionals");
export const Prayer = createDocumentType("Prayer", "prayers/**/*.{md,mdx}", "prayers");
export const Testimony = createDocumentType("Testimony", "testimonies/**/*.{md,mdx}", "testimonies");
export const Podcast = createDocumentType("Podcast", "podcasts/**/*.{md,mdx}", "podcasts");
export const Video = createDocumentType("Video", "videos/**/*.{md,mdx}", "videos");
export const Course = createDocumentType("Course", "courses/**/*.{md,mdx}", "courses");
export const Lesson = createDocumentType("Lesson", "lessons/**/*.{md,mdx}", "lessons");
export const Print = createDocumentType("Print", "prints/**/*.{md,mdx}", "prints");
export const Download = createDocumentType("Download", "downloads/**/*.{md,mdx}", "downloads");

/* -------------------------------------------------------------------------- */
/* MAIN CONFIGURATION                                                         */
/* -------------------------------------------------------------------------- */

export default makeSource({
  contentDirPath: "content",
  
  documentTypes: [
    Post, Book, Download, Canon, Short, Event, Resource, Strategy,
    Article, Guide, Tutorial, CaseStudy, Whitepaper, Report, Newsletter,
    Sermon, Devotional, Prayer, Testimony, Podcast, Video, Course, Lesson, Print
  ],
  
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }]
    ],
  },
  
  onUnknownDocuments: "skip-warn",
  onMissingOrIncompatibleData: "skip-warn",
  onExtraFieldData: "skip-warn", // Relaxed to prevent strict mode crashes
  disableImportAliasWarning: true,
  date: { timezone: "UTC" },
});