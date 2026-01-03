// contentlayer.config.ts - UPDATED WITH COMPONENT SUPPORT
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { spawn } from "child_process";

// ============================================================================
// POST TYPE (Updated with component fields)
// ============================================================================
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `blog/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    excerpt: { type: "string", required: false },
    description: { type: "string", required: false },
    author: { type: "string", required: false, default: "Abraham of London" },
    authorTitle: { type: "string", required: false },
    category: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    featured: { type: "boolean", required: false, default: false },
    draft: { type: "boolean", required: false, default: false },
    slug: { type: "string", required: false },
    
    // NEW: Component toggle fields
    useLegacyDiagram: { type: "boolean", required: false, default: false },
    useProTip: { type: "boolean", required: false, default: false },
    useFeatureGrid: { type: "boolean", required: false, default: false },
    useDownloadCTA: { type: "boolean", required: false, default: false },
    
    // Cover & Image fields
    coverImage: { type: "string", required: false },
    coverFit: { type: "string", required: false, default: "cover" },
    coverPosition: { type: "string", required: false, default: "center" },
    coverAspect: { type: "string", required: false, default: "wide" },
    
    // SEO/Social fields
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },
    metaDescription: { type: "string", required: false },
    keywords: { type: "list", of: { type: "string" }, required: false },
    
    // Reading & Content
    readTime: { type: "string", required: false },
    wordCount: { type: "number", required: false },
    
    // Links & Navigation
    href: { type: "string", required: false },
    canonicalUrl: { type: "string", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    resources: { type: "json", required: false },
    
    // Access & Tier
    tier: { type: "string", required: false, default: "free" },
    accessLevel: { type: "string", required: false, default: "public" },
    layout: { type: "string", required: false },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => `/blog/${doc.slug || doc._raw.flattenedPath.replace("blog/", "")}`,
    },
    slugComputed: {
      type: "string",
      resolve: (doc) => doc.slug || doc._raw.flattenedPath.replace("blog/", ""),
    },
  },
}));

// ============================================================================
// DOWNLOAD TYPE (Enhanced with component support)
// ============================================================================
export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: `downloads/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    excerpt: { type: "string", required: false },
    date: { type: "date", required: true },
    author: { type: "string", required: false, default: "Abraham of London" },
    slug: { type: "string", required: false },
    
    // NEW: Component toggle fields (DownloadCTA enabled by default for downloads)
    useLegacyDiagram: { type: "boolean", required: false, default: false },
    useProTip: { type: "boolean", required: false, default: false },
    useFeatureGrid: { type: "boolean", required: false, default: false },
    useDownloadCTA: { type: "boolean", required: false, default: true },
    
    // NEW: DownloadCTA configuration
    ctaConfig: { 
      type: "json", 
      required: false,
      default: {}
    },
    
    // File Information
    file: { type: "string", required: false },
    fileSize: { type: "string", required: false },
    fileFormat: { type: "string", required: false },
    
    // Tool-specific fields
    toolType: { type: "string", required: false },
    dimensions: { type: "string", required: false },
    isFillable: { type: "boolean", required: false, default: false },
    isInteractive: { type: "boolean", required: false, default: false },
    
    // Visual
    coverImage: { type: "string", required: false },
    
    // Access & Tier
    tier: { type: "string", required: false, default: "free" },
    featured: { type: "boolean", required: false, default: false },
    draft: { 
      type: "string", 
      required: false,
      resolve: (doc: any) => {
        const draftValue = doc.draft;
        if (typeof draftValue === 'string') {
          const cleaned = draftValue.trim().toLowerCase();
          if (cleaned === 'false' || cleaned === '') return false;
          if (cleaned === 'true') return true;
        }
        return Boolean(draftValue);
      }
    },
    requiresAuth: { type: "boolean", required: false, default: false },
    
    // Organization
    category: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    version: { type: "string", required: false },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => `/downloads/${doc.slug || doc._raw.flattenedPath.replace("downloads/", "")}`,
    },
    slugComputed: {
      type: "string",
      resolve: (doc) => doc.slug || doc._raw.flattenedPath.replace("downloads/", ""),
    },
    downloadUrl: {
      type: "string",
      resolve: (doc) => doc.file || `/assets/downloads/${doc.slug || doc._raw.flattenedPath.replace("downloads/", "").replace('.mdx', '.pdf')}`,
    },
    // NEW: Computed field to check if DownloadCTA should be shown
    shouldShowCTA: {
      type: "boolean",
      resolve: (doc) => {
        // Show CTA if explicitly enabled OR if document is featured
        return doc.useDownloadCTA === true || doc.featured === true;
      }
    }
  },
}));

// ============================================================================
// CANON TYPE (Updated with component fields)
// ============================================================================
export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: `canon/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    subtitle: { type: "string", required: false },
    date: { type: "date", required: true },
    excerpt: { type: "string", required: false },
    description: { type: "string", required: false },
    author: { type: "string", required: false, default: "Abraham of London" },
    coverImage: { type: "string", required: true },
    slug: { type: "string", required: false },
    
    // NEW: Component toggle fields
    useLegacyDiagram: { type: "boolean", required: false, default: false },
    useProTip: { type: "boolean", required: false, default: false },
    useFeatureGrid: { type: "boolean", required: false, default: false },
    useDownloadCTA: { type: "boolean", required: false, default: false },
    
    // Canon-specific fields
    order: { type: "number", required: false },
    volumeNumber: { type: "string", required: false },
    featured: { type: "boolean", required: false, default: false },
    draft: { type: "boolean", required: false, default: false },
    
    // Content fields
    readTime: { type: "string", required: false },
    coverAspect: { type: "string", required: false, default: "book" },
    coverFit: { type: "string", required: false, default: "cover" },
    
    // Access & Organization
    accessLevel: { type: "string", required: false, default: "inner-circle" },
    lockMessage: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    tier: { type: "string", required: false, default: "architect" },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => `/canon/${doc.slug || doc._raw.flattenedPath.replace("canon/", "")}`,
    },
    slugComputed: {
      type: "string",
      resolve: (doc) => doc.slug || doc._raw.flattenedPath.replace("canon/", ""),
    },
    volume: {
      type: "string",
      resolve: (doc) => {
        if (doc.volumeNumber) return `Volume ${doc.volumeNumber}`;
        const match = doc.title.match(/Volume\s+([IVXLC]+)/i);
        return match ? `Volume ${match[1]}` : null;
      },
    },
  },
}));

// ============================================================================
// BOOK TYPE (Updated with component fields)
// ============================================================================
export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: `books/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    subtitle: { type: "string", required: false },
    date: { type: "date", required: true },
    excerpt: { type: "string", required: false },
    description: { type: "string", required: false },
    author: { type: "string", required: false, default: "Abraham of London" },
    coverImage: { type: "string", required: true },
    slug: { type: "string", required: false },
    readTime: { type: "string", required: false },
    
    // NEW: Component toggle fields
    useLegacyDiagram: { type: "boolean", required: false, default: false },
    useProTip: { type: "boolean", required: false, default: false },
    useFeatureGrid: { type: "boolean", required: false, default: false },
    useDownloadCTA: { type: "boolean", required: false, default: false },
    
    // Book-specific fields
    isbn: { type: "string", required: false },
    pages: { type: "number", required: false },
    edition: { type: "string", required: false },
    
    // Status & Access
    draft: { type: "boolean", required: false, default: false },
    featured: { type: "boolean", required: false, default: false },
    lockMessage: { type: "string", required: false },
    
    // Metadata
    tags: { type: "list", of: { type: "string" }, required: false },
    category: { type: "string", required: false },
    tier: { type: "string", required: false, default: "member" },
    accessLevel: { type: "string", required: false, default: "public" },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => `/books/${doc.slug || doc._raw.flattenedPath.replace("books/", "")}`,
    },
    slugComputed: {
      type: "string",
      resolve: (doc) => doc.slug || doc._raw.flattenedPath.replace("books/", ""),
    },
  },
}));

// ============================================================================
// BASIC TYPE FACTORY (for other content types - all with explicit slug field)
// ============================================================================
const createBasicType = (name: string, folder: string, defaultAuthor: string = "Abraham of London") => 
  defineDocumentType(() => ({
    name,
    filePathPattern: `${folder}/*.mdx`,
    contentType: "mdx",
    fields: {
      title: { type: "string", required: true },
      date: { type: "date", required: true },
      excerpt: { type: "string", required: false },
      description: { type: "string", required: false },
      author: { type: "string", required: false, default: defaultAuthor },
      coverImage: { type: "string", required: false },
      draft: { type: "boolean", required: false, default: false },
      featured: { type: "boolean", required: false, default: false },
      slug: { type: "string", required: false },
      
      // Common optional fields
      readTime: { type: "string", required: false },
      category: { type: "string", required: false },
      tags: { type: "list", of: { type: "string" }, required: false },
      tier: { type: "string", required: false, default: "free" },
      accessLevel: { type: "string", required: false, default: "public" },
    },
    computedFields: {
      url: {
        type: "string",
        resolve: (doc) => `/${folder}/${doc.slug || doc._raw.flattenedPath.replace(`${folder}/`, "")}`,
      },
      slugComputed: {
        type: "string",
        resolve: (doc) => doc.slug || doc._raw.flattenedPath.replace(`${folder}/`, ""),
      },
    },
  }));

// ============================================================================
// ALL DOCUMENT TYPES (Removed MasterTool to avoid conflict)
// ============================================================================
export const Short = createBasicType("Short", "shorts");
export const Event = createBasicType("Event", "events");
export const Resource = createBasicType("Resource", "resources");
export const Strategy = createBasicType("Strategy", "strategy");
export const Article = createBasicType("Article", "articles");
export const Guide = createBasicType("Guide", "guides");
export const Tutorial = createBasicType("Tutorial", "tutorials");
export const CaseStudy = createBasicType("CaseStudy", "case-studies");
export const Whitepaper = createBasicType("Whitepaper", "whitepapers");
export const Report = createBasicType("Report", "reports");
export const Newsletter = createBasicType("Newsletter", "newsletters");
export const Sermon = createBasicType("Sermon", "sermons");
export const Devotional = createBasicType("Devotional", "devotionals");
export const Prayer = createBasicType("Prayer", "prayers");
export const Testimony = createBasicType("Testimony", "testimonies");
export const Podcast = createBasicType("Podcast", "podcasts");
export const Video = createBasicType("Video", "videos");
export const Course = createBasicType("Course", "courses");
export const Lesson = createBasicType("Lesson", "lessons");
export const Print = createBasicType("Print", "prints");

// ============================================================================
// MAIN CONFIGURATION (with CSS import fix)
// ============================================================================
export default makeSource({
  contentDirPath: "content",
  contentDirExclude: [
    "**/.DS_Store",
    "**/.git/**",
    "**/.next/**",
    "**/node_modules/**",
    "**/public/**",
    "downloads/legacy-*.mdx", // Exclude legacy files to avoid conflicts
  ],
  documentTypes: [
    Post, Canon, Book, Download, Short, Event, Resource, Strategy,
    Article, Guide, Tutorial, CaseStudy, Whitepaper, Report, Newsletter,
    Sermon, Devotional, Prayer, Testimony, Podcast, Video, Course, Lesson, Print
  ],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { 
        behavior: "wrap",
        properties: {
          className: ["heading-anchor"],
          "aria-hidden": "true",
        },
      }],
    ],
    esbuildOptions: (options) => {
      // Fix for CSS imports in MDX components
      options.loader = {
        ...options.loader,
        '.css': 'empty', // Treat CSS imports as empty modules
      };
      return options;
    },
  },
  onExtraFieldData: "skip",
  onMissingOrIncompatibleData: "skip-warn",
  onUnknownDocuments: "skip-warn",
  disableImportAliasWarning: true,
  
  // Handle Windows line endings issue
  date: {
    timezone: "UTC",
  },
  
  // Custom validation to handle the draft field with \r
  onSuccess: async () => {
    console.log('Contentlayer build completed successfully');
  },
});