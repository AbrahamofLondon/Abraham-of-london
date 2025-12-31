import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/* -------------------------------------------------------------------------- */
/* 1. COMPREHENSIVE FIELD DEFINITIONS WITH FUTURE-PROOFING                   */
/* -------------------------------------------------------------------------- */

const commonFields = {
  // === CORE METADATA ===
  title: { type: "string" as const, required: true },
  subtitle: { type: "string" as const, required: false },
  date: { type: "date" as const, required: false },
  slug: { type: "string" as const, required: false },
  href: { type: "string" as const, required: false },
  description: { type: "string" as const, required: false },
  excerpt: { type: "string" as const, required: false },
  category: { type: "string" as const, required: false },
  author: { type: "string" as const, required: false },
  authorTitle: { type: "string" as const, required: false },
  readTime: { type: "string" as const, required: false },
  readtime: { type: "string" as const, required: false }, // lowercase variant
  
  // === VISUAL & LAYOUT ===
  coverImage: { type: "string" as const, required: false },
  coverAspect: { type: "string" as const, required: false },
  coverFit: { type: "string" as const, required: false },
  coverPosition: { type: "string" as const, required: false },
  layout: { type: "string" as const, required: false },
  theme: { type: "string" as const, required: false },
  
  // === SEO & SOCIAL ===
  ogTitle: { type: "string" as const, required: false },
  ogDescription: { type: "string" as const, required: false },
  socialCaption: { type: "string" as const, required: false },
  
  // === CONTENT MANAGEMENT ===
  draft: { type: "boolean" as const, required: false, default: false },
  featured: { type: "boolean" as const, required: false, default: false },
  archived: { type: "boolean" as const, required: false, default: false },
  published: { type: "boolean" as const, required: false, default: true },
  lockMessage: { type: "string" as const, required: false },
  accessLevel: { type: "string" as const, required: false },
  available: { type: "boolean" as const, required: false, default: true },
  
  // === ACCESS CONTROL ===
  requiredTier: { type: "string" as const, required: false },
  tier: { type: "string" as const, required: false }, // Alias for requiredTier
  
  // === TAXONOMY ===
  tags: { type: "list" as const, of: { type: "string" as const }, required: false },
  audience: { type: "string" as const, required: false },
  resourceType: { type: "string" as const, required: false },
  
  // === DOCUMENT-SPECIFIC IDENTIFIERS ===
  volumeNumber: { type: "string" as const, required: false },
  order: { type: "number" as const, required: false },
  isbn: { type: "string" as const, required: false },
  bibleVerse: { type: "string" as const, required: false },
  
  // === FILE & DOWNLOAD HANDLING ===
  file: { type: "string" as const, required: false },
  downloadFile: { type: "string" as const, required: false },
  pdfPath: { type: "string" as const, required: false },
  downloadUrl: { type: "string" as const, required: false },
  fileUrl: { type: "string" as const, required: false },
  fileSize: { type: "string" as const, required: false },
  
  // === EVENT MANAGEMENT ===
  eventDate: { type: "date" as const, required: false },
  time: { type: "string" as const, required: false },
  registrationUrl: { type: "string" as const, required: false },
  location: { type: "string" as const, required: false },
  
  // === CONTENT RELATIONSHIPS ===
  // CHANGED: resources is now json (was string), to fix the ctaPrimary error
  resources: { type: "json" as const, required: false },
  relatedDownloads: { type: "list" as const, of: { type: "string" as const }, required: false },
  
  // === FUTURE-PROOFING: COMMON FIELD PATTERNS ===
  // Generic string fields for unexpected frontmatter
  metaDescription: { type: "string" as const, required: false },
  keywords: { type: "list" as const, of: { type: "string" as const }, required: false },
  status: { type: "string" as const, required: false },
  priority: { type: "number" as const, required: false },
  
  // Generic JSON for any structured data
  meta: { type: "json" as const, required: false },
  customFields: { type: "json" as const, required: false },
  
  // Generic lists
  categories: { type: "list" as const, of: { type: "string" as const }, required: false },
  authors: { type: "list" as const, of: { type: "string" as const }, required: false },
  
  // === NEW: ADDED MISSING FIELDS FROM YOUR AUDIT ===
  canonicalUrl: { type: "string" as const, required: false },
  updated: { type: "date" as const, required: false },
  version: { type: "string" as const, required: false },
  language: { type: "string" as const, required: false },
  format: { type: "string" as const, required: false },
  readingTime: { type: "string" as const, required: false },
  
  // FIXED: Changed from "string" to "json" to accept objects like {"label":"Download PDF","href":"/path"}
  ctaPrimary: { type: "json" as const, required: false },
  ctaSecondary: { type: "json" as const, required: false },
  
  related: { type: "list" as const, of: { type: "string" as const }, required: false },
  
  // === ADDITIONAL COMMON FIELDS FOR COMPREHENSIVE COVERAGE ===
  // Content structure
  toc: { type: "boolean" as const, required: false, default: false },
  showToc: { type: "boolean" as const, required: false, default: false },
  showComments: { type: "boolean" as const, required: false, default: false },
  
  // Content relationships
  series: { type: "string" as const, required: false },
  part: { type: "number" as const, required: false },
  next: { type: "string" as const, required: false },
  prev: { type: "string" as const, required: false },
  
  // Content restrictions
  ageRestriction: { type: "number" as const, required: false },
  requiresLogin: { type: "boolean" as const, required: false, default: false },
  requiresSubscription: { type: "boolean" as const, required: false, default: false },
  
  // Content statistics
  views: { type: "number" as const, required: false },
  likes: { type: "number" as const, required: false },
  shares: { type: "number" as const, required: false },
  
  // Content scheduling
  publishDate: { type: "date" as const, required: false },
  expireDate: { type: "date" as const, required: false },
  
  // Content format
  contentType: { type: "string" as const, required: false },
  wordCount: { type: "number" as const, required: false },
  characterCount: { type: "number" as const, required: false },
  
  // Content source
  source: { type: "string" as const, required: false },
  originalUrl: { type: "string" as const, required: false },
  license: { type: "string" as const, required: false },
  
  // Content status
  stage: { type: "string" as const, required: false },
  milestone: { type: "string" as const, required: false },
} as const;

/* -------------------------------------------------------------------------- */
/* 2. DEFENSIVE COMPUTED FIELDS WITH FALLBACKS                               */
/* -------------------------------------------------------------------------- */

const computedCommon = (base: string) => ({
  url: { 
    type: "string" as const, 
    resolve: (doc: any) => {
      // Priority: canonicalUrl > href > slug > file path
      if (doc.canonicalUrl && doc.canonicalUrl !== "#") return doc.canonicalUrl;
      if (doc.href && doc.href !== "#") return doc.href;
      const slug = doc.slug || doc._raw.flattenedPath.split("/").pop();
      return `/${base}/${slug}`.replace(/\/+/g, '/'); // Clean double slashes
    }
  },
  // Defensive: Add file path for debugging
  sourcePath: {
    type: "string" as const,
    resolve: (doc: any) => doc._raw.flattenedPath
  },
  // Defensive: Publication status check
  isPublished: {
    type: "boolean" as const,
    resolve: (doc: any) => {
      const isDraft = doc.draft === true || doc.draft === "true";
      const isArchived = doc.archived === true || doc.archived === "true";
      const isPublished = doc.published === true || doc.published === "true" || doc.published === undefined;
      return !isDraft && !isArchived && isPublished;
    }
  },
  // Defensive: Reading time calculation
  effectiveReadingTime: {
    type: "string" as const,
    resolve: (doc: any) => {
      return doc.readingTime || doc.readTime || doc.readtime || "5 min read";
    }
  },
  // Defensive: Updated date fallback
  effectiveUpdatedDate: {
    type: "date" as const,
    resolve: (doc: any) => {
      return doc.updated || doc.date || new Date().toISOString();
    }
  },
  // Tier computation
  computedTier: {
    type: "string" as const,
    resolve: (doc: any) => {
      return doc.requiredTier || doc.tier || 'free';
    }
  }
});

/* -------------------------------------------------------------------------- */
/* 3. DOCUMENT TYPES WITH SPECIFIC OVERRIDES                                 */
/* -------------------------------------------------------------------------- */

// Helper for consistent type definitions
const createDocumentType = (name: string, pattern: string, basePath: string, extraFields = {}) => 
  defineDocumentType(() => ({
    name,
    filePathPattern: pattern,
    contentType: "mdx" as const,
    fields: { ...commonFields, ...extraFields },
    computedFields: computedCommon(basePath),
  }));

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

// Add downloadPath computation to Download type
export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx" as const,
  fields: commonFields,
  computedFields: {
    ...computedCommon("downloads"),
    downloadPath: {
      type: "string" as const,
      resolve: (doc: any) => {
        // Unified download path resolver with priority
        return doc.file || doc.downloadFile || doc.downloadUrl || doc.pdfPath || doc.fileUrl || "";
      }
    },
    fileInfo: {
      type: "json" as const,
      resolve: (doc: any) => ({
        path: doc.file || doc.downloadFile || doc.downloadUrl || doc.pdfPath || doc.fileUrl,
        size: doc.fileSize,
        type: doc.file?.split('.').pop() || doc.downloadFile?.split('.').pop() || 'unknown'
      })
    }
  },
}));

/* -------------------------------------------------------------------------- */
/* 4. ROBUST SOURCE CONFIGURATION                                            */
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
    rehypePlugins: [rehypeSlug],
  },
  // Defensive error handling
  onUnknownDocuments: "skip-warn",
  onMissingOrIncompatibleData: "skip-warn",
  onExtraFieldData: "warn",
  disableImportAliasWarning: true,
  
  // Future-proofing: Content directory exclusions
  contentDirExclude: ['.*', '*.tmp', '*.bak', '_*'],
  
  // Windows compatibility
  date: {
    timezone: "UTC",
  },
});