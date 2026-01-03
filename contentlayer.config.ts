// contentlayer.config.ts - COMPLETE FIXED VERSION
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// ============================================================================
// POST TYPE (with all your missing fields)
// ============================================================================
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `blog/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    excerpt: { type: "string", required: true },
    author: { type: "string", required: false, default: "Abraham of London" },
    category: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    featured: { type: "boolean", required: false, default: false },
    draft: { type: "boolean", required: false, default: false },
    
    // Cover image fields
    coverImage: { type: "string", required: false },
    coverFit: { type: "string", required: false, default: "cover" },
    coverPosition: { type: "string", required: false, default: "center" },
    
    // SEO/Social fields (from your warnings)
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },
    
    // Additional fields from warnings
    authorTitle: { type: "string", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    href: { type: "string", required: false },
    
    // Standard SEO
    metaDescription: { type: "string", required: false },
    keywords: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace("blog/", ""),
    },
    url: {
      type: "string",
      resolve: (doc) => `/blog/${doc._raw.flattenedPath.replace("blog/", "")}`,
    },
  },
}));

// ============================================================================
// BOOK TYPE
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
    author: { type: "string", required: false, default: "Abraham of London" },
    coverImage: { type: "string", required: true },
    draft: { type: "boolean", required: false, default: false },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace("books/", ""),
    },
    url: {
      type: "string",
      resolve: (doc) => `/books/${doc._raw.flattenedPath.replace("books/", "")}`,
    },
  },
}));

// ============================================================================
// CANON TYPE
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
    author: { type: "string", required: false, default: "Abraham of London" },
    coverImage: { type: "string", required: true },
    order: { type: "number", required: false },
    draft: { type: "boolean", required: false, default: false },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace("canon/", ""),
    },
    url: {
      type: "string",
      resolve: (doc) => `/canon/${doc._raw.flattenedPath.replace("canon/", "")}`,
    },
  },
}));

// ============================================================================
// DOWNLOAD TYPE (includes MasterTool)
// ============================================================================
export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: `downloads/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    date: { type: "date", required: true },
    file: { type: "string", required: false }, // Path to file
    fileSize: { type: "string", required: false },
    tier: { type: "string", required: false, default: "free" },
    featured: { type: "boolean", required: false, default: false },
    draft: { type: "boolean", required: false, default: false },
    // MasterTool specific fields
    toolType: { type: "string", required: false },
    dimensions: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace("downloads/", ""),
    },
    url: {
      type: "string",
      resolve: (doc) => `/downloads/${doc._raw.flattenedPath.replace("downloads/", "")}`,
    },
  },
}));

// ============================================================================
// OTHER DOCUMENT TYPES (simplified versions)
// ============================================================================
const createBasicType = (name: string, folder: string) => 
  defineDocumentType(() => ({
    name,
    filePathPattern: `${folder}/*.mdx`,
    contentType: "mdx",
    fields: {
      title: { type: "string", required: true },
      date: { type: "date", required: true },
      excerpt: { type: "string", required: false },
      author: { type: "string", required: false, default: "Abraham of London" },
      coverImage: { type: "string", required: false },
      draft: { type: "boolean", required: false, default: false },
      featured: { type: "boolean", required: false, default: false },
    },
    computedFields: {
      slug: {
        type: "string",
        resolve: (doc) => doc._raw.flattenedPath.replace(`${folder}/`, ""),
      },
      url: {
        type: "string",
        resolve: (doc) => `/${folder}/${doc._raw.flattenedPath.replace(`${folder}/`, "")}`,
      },
    },
  }));

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
// MAIN CONFIGURATION
// ============================================================================
export default makeSource({
  contentDirPath: "content",
  contentDirExclude: [
    "**/.DS_Store",
    "**/.git/**",
    "**/.next/**",
    "**/node_modules/**",
    "**/public/**",
  ],
  documentTypes: [
    Post, Book, Canon, Download, Short, Event, Resource, Strategy,
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
  },
  onExtraFieldData: "warn", // Change from skip-warn to warn
  onMissingOrIncompatibleData: "warn",
  onUnknownDocuments: "skip-warn",
});