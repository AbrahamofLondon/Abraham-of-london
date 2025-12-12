import path from "node:path";
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

// -----------------------------------------------------------------------------
// Enhanced error handling and diagnostics
// -----------------------------------------------------------------------------

// Diagnostic logging
const DEBUG = process.env.CONTENTLAYER_DEBUG === 'true';

function logDebug(...args: any[]) {
  if (DEBUG) {
    console.log('[Contentlayer Debug]', ...args);
  }
}

function escapeForRegExp(input: unknown) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateSlug(flattenedPath: string, prefix: string) {
  if (!flattenedPath) return "untitled";
  try {
    const safePrefix = escapeForRegExp(prefix);
    return (
      String(flattenedPath)
        .replace(new RegExp(`^${safePrefix}/`, "u"), "")
        .replace(/\/index$/u, "") || "untitled"
    );
  } catch {
    return "untitled";
  }
}

function generateUrl(slug: string | undefined, basePath: string) {
  const cleanSlug = String(slug || "").replace(/^\/+|\/+$/gu, "");
  const cleanBase = String(basePath).replace(/^\/+|\/+$/gu, "");
  if (!cleanSlug) return `/${cleanBase}`;
  return `/${cleanBase}/${cleanSlug}`.replace(/\/+/gu, "/");
}

// Enhanced withDefaults with better type handling
function withDefaults<T extends Record<string, any>>(
  fields: T
): T {
  const defaultedFields: any = {};
  
  for (const [key, config] of Object.entries(fields)) {
    if (config.type === "string") {
      defaultedFields[key] = {
        ...config,
        default: config.required ? "" : config.default ?? "",
      };
    } else if (config.type === "list") {
      defaultedFields[key] = {
        ...config,
        default: config.required ? [] : config.default ?? [],
      };
    } else if (config.type === "boolean") {
      defaultedFields[key] = {
        ...config,
        default: config.required ? false : config.default ?? false,
      };
    } else if (config.type === "json") {
      defaultedFields[key] = {
        ...config,
        default: config.required ? null : config.default ?? null,
      };
    } else if (config.type === "date") {
      defaultedFields[key] = {
        ...config,
        default: config.required ? new Date().toISOString().split("T")[0] : config.default ?? new Date().toISOString().split("T")[0],
      };
    } else if (config.type === "number") {
      defaultedFields[key] = {
        ...config,
        default: config.required ? 0 : config.default ?? 0,
      };
    } else {
      defaultedFields[key] = config;
    }
  }
  
  return defaultedFields;
}

// Safe date parsing for error handling
function safeParseDate(dateString: unknown): string {
  try {
    if (!dateString) return new Date().toISOString().split("T")[0];
    
    const date = new Date(String(dateString));
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split("T")[0];
    }
    return date.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

// -----------------------------------------------------------------------------
// Document types with href field support
// -----------------------------------------------------------------------------

const commonFields = {
  title: { type: "string", required: true },
  date: {
    type: "date",
    required: true,
    default: () => new Date().toISOString().split("T")[0],
  },
  slug: { type: "string", required: false },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },
  coverImage: { type: "string", required: false },
  tags: { type: "list", of: { type: "string" }, required: false },
  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },
  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },
  // SAFE HREF FIELD - For files that already have href in frontmatter
  href: { type: "string", required: false },
} as const;

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    ...commonFields,
    author: { type: "string", required: false },
    authorTitle: { type: "string", required: false },
    readTime: { type: "string", required: false },
    category: { type: "string", required: false },
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },
    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    coverPosition: { type: "string", required: false },
    relatedDownloads: {
      type: "list",
      of: { type: "string" },
      required: false,
    },
    resources: { type: "json", required: false },
    keyInsights: { type: "json", required: false },
    authorNote: { type: "string", required: false },
    layout: { type: "string", required: false },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => {
        const slug = doc.slug || generateSlug(doc._raw.flattenedPath, "blog");
        logDebug(`Post slug for ${doc._raw.flattenedPath}: ${slug}`);
        return slug;
      },
    },
    url: {
      type: "string",
      resolve: (doc) => {
        // SAFE: Use explicit href if provided and valid
        if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
          const href = doc.href.trim();
          // Ensure href starts with /
          return href.startsWith("/") ? href : `/${href}`;
        }
        
        // Otherwise generate from slug
        return generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "blog"),
          "blog"
        );
      },
    },
    readingTime: {
      type: "number",
      resolve: (doc) => {
        try {
          const wordsPerMinute = 200;
          const wordCount = String(doc.body.raw || "").split(/\s+/u).length;
          return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
        } catch {
          return 1; // Safe default
        }
      },
    },
    safeDate: {
      type: "string",
      resolve: (doc) => safeParseDate(doc.date),
    },
  },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    ...commonFields,
    author: { type: "string", required: false },
    readtime: { type: "string", required: false },
    readTime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    resourceType: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => {
        const slug = doc.slug || generateSlug(doc._raw.flattenedPath, "resources");
        logDebug(`Resource slug for ${doc._raw.flattenedPath}: ${slug}`);
        return slug;
      },
    },
    url: {
      type: "string",
      resolve: (doc) => {
        // SAFE: Use explicit href if provided and valid
        if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
          const href = doc.href.trim();
          // Ensure href starts with /
          return href.startsWith("/") ? href : `/${href}`;
        }
        
        // Otherwise generate from slug
        return generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "resources"),
          "resources"
        );
      },
    },
    safeDate: {
      type: "string",
      resolve: (doc) => safeParseDate(doc.date),
    },
  },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    ...commonFields,
    author: { type: "string", required: false },
    category: { type: "string", required: false },
    layout: { type: "string", required: false },
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    file: { type: "string", required: false },
    pdfPath: { type: "string", required: false },
    fileSize: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    type: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => {
        const slug = doc.slug || generateSlug(doc._raw.flattenedPath, "downloads");
        logDebug(`Download slug for ${doc._raw.flattenedPath}: ${slug}`);
        return slug;
      },
    },
    url: {
      type: "string",
      resolve: (doc) => {
        // SAFE: Use explicit href if provided and valid
        if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
          const href = doc.href.trim();
          return href.startsWith("/") ? href : `/${href}`;
        }
        
        return generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "downloads"),
          "downloads"
        );
      },
    },
    downloadHref: {
      type: "string",
      resolve: (doc) => {
        try {
          if (doc.downloadUrl) return doc.downloadUrl;
          if (doc.fileUrl) return doc.fileUrl;

          const candidate = doc.pdfPath || doc.downloadFile || doc.file || "";
          if (!candidate) return "";

          if (String(candidate).startsWith("/")) return candidate;
          return `/downloads/${candidate}`.replace(/\/+/g, "/");
        } catch {
          return "";
        }
      },
    },
    safeDate: {
      type: "string",
      resolve: (doc) => safeParseDate(doc.date),
    },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    ...commonFields,
    readTime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    publisher: { type: "string", required: false },
    isbn: { type: "string", required: false },
    category: { type: "string", required: false },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => {
        const slug = doc.slug || generateSlug(doc._raw.flattenedPath, "books");
        logDebug(`Book slug for ${doc._raw.flattenedPath}: ${slug}`);
        return slug;
      },
    },
    url: {
      type: "string",
      resolve: (doc) => {
        if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
          const href = doc.href.trim();
          return href.startsWith("/") ? href : `/${href}`;
        }
        
        return generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "books"),
          "books"
        );
      },
    },
    safeDate: {
      type: "string",
      resolve: (doc) => safeParseDate(doc.date),
    },
  },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    ...commonFields,
    time: { type: "string", required: false },
    eventDate: {
      type: "date",
      required: false,
      default: () => new Date().toISOString().split("T")[0],
    },
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => {
        const slug = doc.slug || generateSlug(doc._raw.flattenedPath, "events");
        logDebug(`Event slug for ${doc._raw.flattenedPath}: ${slug}`);
        return slug;
      },
    },
    url: {
      type: "string",
      resolve: (doc) => {
        if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
          const href = doc.href.trim();
          return href.startsWith("/") ? href : `/${href}`;
        }
        
        return generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "events"),
          "events"
        );
      },
    },
    isUpcoming: {
      type: "boolean",
      resolve: (doc) => {
        try {
          const eventDate = new Date(doc.eventDate || doc.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return eventDate >= today;
        } catch {
          return false;
        }
      },
    },
    safeDate: {
      type: "string",
      resolve: (doc) => safeParseDate(doc.date || doc.eventDate),
    },
  },
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    ...commonFields,
    dimensions: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
    price: { type: "string", required: false },
    available: { type: "boolean", required: false, default: true },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => {
        const slug = doc.slug || generateSlug(doc._raw.flattenedPath, "prints");
        logDebug(`Print slug for ${doc._raw.flattenedPath}: ${slug}`);
        return slug;
      },
    },
    url: {
      type: "string",
      resolve: (doc) => {
        if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
          const href = doc.href.trim();
          return href.startsWith("/") ? href : `/${href}`;
        }
        
        return generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "prints"),
          "prints"
        );
      },
    },
    safeDate: {
      type: "string",
      resolve: (doc) => safeParseDate(doc.date),
    },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    ...commonFields,
    author: { type: "string", required: false },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => {
        const slug = doc.slug || generateSlug(doc._raw.flattenedPath, "strategy");
        logDebug(`Strategy slug for ${doc._raw.flattenedPath}: ${slug}`);
        return slug;
      },
    },
    url: {
      type: "string",
      resolve: (doc) => {
        if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
          const href = doc.href.trim();
          return href.startsWith("/") ? href : `/${href}`;
        }
        
        return generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "strategy"),
          "strategy"
        );
      },
    },
    safeDate: {
      type: "string",
      resolve: (doc) => safeParseDate(doc.date),
    },
  },
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    ...commonFields,
    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
    readTime: { type: "string", required: false },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => {
        const slug = doc.slug || generateSlug(doc._raw.flattenedPath, "canon");
        logDebug(`Canon slug for ${doc._raw.flattenedPath}: ${slug}`);
        return slug;
      },
    },
    url: {
      type: "string",
      resolve: (doc) => {
        if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
          const href = doc.href.trim();
          return href.startsWith("/") ? href : `/${href}`;
        }
        
        return generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "canon"),
          "canon"
        );
      },
    },
    safeDate: {
      type: "string",
      resolve: (doc) => safeParseDate(doc.date),
    },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.mdx",
  contentType: "mdx",
  fields: withDefaults({
    ...commonFields,
    theme: { type: "string", required: false },
    audience: { type: "string", required: false },
    readTime: { type: "string", required: false },
    published: { 
      type: "boolean", 
      required: false,
      default: true 
    },
    // Date is optional for shorts
    date: {
      type: "date",
      required: false,
      default: () => new Date().toISOString().split("T")[0],
    },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => {
        const slug = doc.slug || generateSlug(doc._raw.flattenedPath, "shorts");
        logDebug(`Short slug for ${doc._raw.flattenedPath}: ${slug}`);
        return slug;
      },
    },
    url: {
      type: "string",
      resolve: (doc) => {
        if (doc.href && typeof doc.href === "string" && doc.href.trim()) {
          const href = doc.href.trim();
          return href.startsWith("/") ? href : `/${href}`;
        }
        
        return generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "shorts"),
          "shorts"
        );
      },
    },
    safeDate: {
      type: "string",
      resolve: (doc) => safeParseDate(doc.date),
    },
  },
}));

// -----------------------------------------------------------------------------
// makeSource with robust error handling and diagnostics
// -----------------------------------------------------------------------------

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [
    Post,
    Download,
    Book,
    Event,
    Print,
    Strategy,
    Resource,
    Canon,
    Short,
  ],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    esbuildOptions: (options) => {
      options.loader = {
        ...(options.loader || {}),
        ".mdx": "tsx",
      };
      options.alias = {
        ...(options.alias || {}),
        "@": process.cwd(),
      };
      // Add error boundaries
      options.logOverride = {
        ...(options.logOverride || {}),
        "cannot-resolve": "silent",
      };
      return options;
    },
  },
  // Enhanced error handling
  onUnknownDocuments: 'skip-warn',
  disableImportAliasWarning: true,
  
  // File filtering
  contentDirExclude: [
    "**/.DS_Store",
    "**/Thumbs.db",
    "**/node_modules/**",
    "**/.git/**",
  ],
  
  contentDirInclude: ["**/*.md", "**/*.mdx"],
  
  // Add diagnostic hooks - FIXED: Remove onSuccess callback that causes the error
  // onSuccess callback removed due to Windows bug in Contentlayer
  
  // Enhanced content preprocessing for Windows compatibility
  onContent: (content, filePath) => {
    try {
      const originalLength = content.length;
      
      // Fix Windows-specific issues
      const cleaned = content
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Fix duplicate YAML keys (common issue)
        .replace(/(\w+):\s*([^\n]+)\n\1:/g, '$1: $2')
        // Fix boolean strings
        .replace(/draft:\s*"false"/g, 'draft: false')
        .replace(/draft:\s*"true"/g, 'draft: true')
        .replace(/draft:\s*"false\\r"/g, 'draft: false')
        .replace(/draft:\s*"true\\r"/g, 'draft: true')
        // Fix type field with quotes
        .replace(/type:\s*'(\w+)'/g, 'type: "$1"')
        .replace(/type:\s*"(\w+)"/g, 'type: "$1"')
        // Handle type without quotes
        .replace(/type:\s*(\w+)(?=\s|$)/g, 'type: "$1"')
        // Remove Windows BOM if present
        .replace(/^\uFEFF/, '')
        // Fix trailing whitespace in YAML
        .replace(/: \s+$/gm, ': ')
        // Fix multi-line strings
        .replace(/\|\s*\n(\s+)/g, '|\n$1');
      
      if (DEBUG && cleaned.length !== originalLength) {
        console.log(`🔄 Preprocessed: ${path.basename(filePath)} (${originalLength} → ${cleaned.length} chars)`);
      }
      
      return cleaned;
    } catch (error) {
      console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
      return content; // Return original content on error
    }
  },
  
  // Add file validation
  onValidationError: (error) => {
    if (DEBUG) {
      console.warn(`⚠️ Validation error: ${error.message}`);
      console.warn(`   File: ${error.documentPath}`);
      console.warn(`   Details:`, error.details);
    }
    // Don't throw - continue processing other files
    return 'skip';
  },
});