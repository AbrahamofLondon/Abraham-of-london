import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { visit } from "unist-util-visit";

/* ========================================================================== */
/* ENTERPRISE CONTENTLAYER CONFIGURATION                                     */
/* Cross-platform compatible, production-ready content processing            */
/* ========================================================================== */

const IS_WINDOWS = process.platform === 'win32';
const IS_DEV = process.env.NODE_ENV !== 'production';

/* -------------------------------------------------------------------------- */
/* WINDOWS-SPECIFIC WORKAROUNDS                                              */
/* -------------------------------------------------------------------------- */

// Windows-specific workaround for package resolution issues
if (IS_WINDOWS) {
  console.log('🪟 Windows platform detected - applying optimizations...');
  
  // Workaround for ESM package resolution on Windows
  if (typeof require !== 'undefined') {
    const originalResolve = require.resolve;
    const Module = require('module');
    
    Module.prototype.require = new Proxy(Module.prototype.require, {
      apply(target, thisArg, args) {
        const [request] = args;
        
        // Handle problematic mdast-util-gfm-task-list-item import
        if (request && request.includes('mdast-util-gfm-task-list-item')) {
          try {
            // Try to resolve through alternative paths
            const paths = [
              'mdast-util-gfm-task-list-item/lib/index.js',
              'mdast-util-gfm-task-list-item/index.js',
              'mdast-util-gfm-task-list-item'
            ];
            
            for (const path of paths) {
              try {
                return originalResolve.call(thisArg, path);
              } catch {
                // Continue to next path
              }
            }
          } catch (error) {
            console.warn('⚠️ Windows workaround for mdast-util-gfm-task-list-item failed:', error.message);
          }
        }
        
        return Reflect.apply(target, thisArg, args);
      }
    });
  }
}

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
  resourceType: { type: "string" as const, required: false },
  contentType: { type: "string" as const, required: false },
  
  author: { type: "string" as const, required: false },
  authors: { type: "list" as const, of: { type: "string" as const }, required: false },
  authorTitle: { type: "string" as const, required: false },
  
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
  characterCount: { type: "number" as const, required: false },
  views: { type: "number" as const, required: false },
  likes: { type: "number" as const, required: false },
  shares: { type: "number" as const, required: false },
  
  draft: { type: "boolean" as const, required: false, default: false },
  published: { type: "boolean" as const, required: false, default: true },
  featured: { type: "boolean" as const, required: false, default: false },
  archived: { type: "boolean" as const, required: false, default: false },
  available: { type: "boolean" as const, required: false, default: true },
  
  requiredTier: { type: "string" as const, required: false },
  tier: { type: "string" as const, required: false },
  accessLevel: { type: "string" as const, required: false },
  requiresLogin: { type: "boolean" as const, required: false, default: false },
  requiresSubscription: { type: "boolean" as const, required: false, default: false },
  ageRestriction: { type: "number" as const, required: false },
  lockMessage: { type: "string" as const, required: false },
  
  ogTitle: { type: "string" as const, required: false },
  ogDescription: { type: "string" as const, required: false },
  metaDescription: { type: "string" as const, required: false },
  socialCaption: { type: "string" as const, required: false },
  keywords: { type: "list" as const, of: { type: "string" as const }, required: false },
  
  file: { type: "string" as const, required: false },
  downloadFile: { type: "string" as const, required: false },
  pdfPath: { type: "string" as const, required: false },
  downloadUrl: { type: "string" as const, required: false },
  fileUrl: { type: "string" as const, required: false },
  fileSize: { type: "string" as const, required: false },
  
  time: { type: "string" as const, required: false },
  location: { type: "string" as const, required: false },
  registrationUrl: { type: "string" as const, required: false },
  
  volumeNumber: { type: "string" as const, required: false },
  order: { type: "number" as const, required: false },
  priority: { type: "number" as const, required: false },
  series: { type: "string" as const, required: false },
  part: { type: "number" as const, required: false },
  
  related: { type: "list" as const, of: { type: "string" as const }, required: false },
  relatedDownloads: { type: "list" as const, of: { type: "string" as const }, required: false },
  next: { type: "string" as const, required: false },
  prev: { type: "string" as const, required: false },
  
  resources: { type: "json" as const, required: false },
  ctaPrimary: { type: "json" as const, required: false },
  ctaSecondary: { type: "json" as const, required: false },
  meta: { type: "json" as const, required: false },
  customFields: { type: "json" as const, required: false },
  
  toc: { type: "boolean" as const, required: false, default: false },
  showToc: { type: "boolean" as const, required: false, default: false },
  showComments: { type: "boolean" as const, required: false, default: false },
  
  isbn: { type: "string" as const, required: false },
  bibleVerse: { type: "string" as const, required: false },
  version: { type: "string" as const, required: false },
  
  language: { type: "string" as const, required: false },
  format: { type: "string" as const, required: false },
  
  source: { type: "string" as const, required: false },
  originalUrl: { type: "string" as const, required: false },
  license: { type: "string" as const, required: false },
  
  status: { type: "string" as const, required: false },
  stage: { type: "string" as const, required: false },
  milestone: { type: "string" as const, required: false },
  audience: { type: "string" as const, required: false },
});

/* -------------------------------------------------------------------------- */
/* COMPUTED FIELDS FACTORY                                                    */
/* -------------------------------------------------------------------------- */

const createComputedFields = (basePath: string) => ({
  url: {
    type: "string" as const,
    resolve: (doc: any) => {
      if (doc.canonicalUrl && doc.canonicalUrl !== '#') return doc.canonicalUrl;
      if (doc.href && doc.href !== '#') return doc.href;
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
      const isDraft = doc.draft === true;
      const isArchived = doc.archived === true;
      const isPublished = doc.published !== false;
      const isAvailable = doc.available !== false;
      return isPublished && !isDraft && !isArchived && isAvailable;
    }
  },

  computedReadingTime: {
    type: "string" as const,
    resolve: (doc: any) => {
      return doc.readingTime || doc.readTime || doc.readtime || "5 min read";
    }
  },

  effectiveDate: {
    type: "date" as const,
    resolve: (doc: any) => {
      return doc.publishDate || doc.date || doc.updated || new Date().toISOString();
    }
  },

  lastModified: {
    type: "date" as const,
    resolve: (doc: any) => {
      return doc.updated || doc.date || new Date().toISOString();
    }
  },

  computedTier: {
    type: "string" as const,
    resolve: (doc: any) => doc.requiredTier || doc.tier || 'free'
  },

  sourcePath: {
    type: "string" as const,
    resolve: (doc: any) => normalizePath(doc._raw.flattenedPath)
  },

  sourceFileName: {
    type: "string" as const,
    resolve: (doc: any) => {
      const path = doc._raw.sourceFileName || doc._raw.flattenedPath;
      return path.replace(/\.mdx?$/, '');
    }
  },

  fileType: {
    type: "string" as const,
    resolve: (doc: any) => {
      const fileName = doc._raw.sourceFileName || '';
      return fileName.endsWith('.mdx') ? 'mdx' : 'md';
    }
  },

  seoDescription: {
    type: "string" as const,
    resolve: (doc: any) => {
      return doc.metaDescription || doc.ogDescription || doc.description || doc.excerpt || '';
    }
  },

  authorList: {
    type: "list" as const,
    of: { type: "string" as const },
    resolve: (doc: any) => {
      if (doc.authors && Array.isArray(doc.authors)) return doc.authors;
      if (doc.author) return [doc.author];
      return [];
    }
  },

  allTaxonomies: {
    type: "list" as const,
    of: { type: "string" as const },
    resolve: (doc: any) => {
      const taxonomies = new Set<string>();
      if (doc.tags) doc.tags.forEach((t: string) => taxonomies.add(t));
      if (doc.categories) doc.categories.forEach((c: string) => taxonomies.add(c));
      if (doc.category) taxonomies.add(doc.category);
      return Array.from(taxonomies);
    }
  },

  downloadPath: {
    type: "string" as const,
    resolve: (doc: any) => {
      const path = doc.file || doc.downloadFile || doc.downloadUrl || 
                   doc.pdfPath || doc.fileUrl || '';
      return normalizePath(path);
    }
  },

  fileInfo: {
    type: "json" as const,
    resolve: (doc: any) => {
      const path = doc.file || doc.downloadFile || doc.downloadUrl || 
                   doc.pdfPath || doc.fileUrl || '';
      const extension = path ? path.split('.').pop()?.toLowerCase() : 'unknown';
      
      return {
        path: normalizePath(path),
        size: doc.fileSize || null,
        type: extension,
        name: path ? path.split('/').pop() : null
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
  basePath: string,
  extraFields: Record<string, any> = {}
) => {
  return defineDocumentType(() => ({
    name,
    filePathPattern: pattern,
    contentType: "mdx" as const,
    fields: {
      ...createFieldSchema(),
      ...extraFields
    },
    computedFields: createComputedFields(basePath)
  }));
};

/* -------------------------------------------------------------------------- */
/* DOCUMENT TYPE DEFINITIONS                                                  */
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
/* MDX PROCESSING CONFIGURATION                                               */
/* -------------------------------------------------------------------------- */

const rehypeHeadings = () => {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) {
        if (!node.properties) node.properties = {};
        if (!node.properties.id) {
          const text = node.children
            .filter((child: any) => child.type === 'text')
            .map((child: any) => child.value)
            .join('');
          node.properties.id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }
      }
    });
  };
};

const mdxOptions = {
  remarkPlugins: [
    remarkGfm
  ],
  rehypePlugins: [
    rehypeSlug,
    rehypeHeadings(),
    [rehypeAutolinkHeadings, { behavior: 'wrap' }]
  ],
  ...(IS_WINDOWS && {
    esbuildOptions: (options: any) => {
      options.platform = 'node';
      options.target = 'es2020';
      options.minify = false;
      options.sourcemap = false;
      options.loader = {
        ...options.loader,
        '.js': 'jsx'
      };
      options.mainFields = ['module', 'main'];
      options.resolveExtensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
      return options;
    }
  })
} as any;

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
  
  mdx: mdxOptions,
  
  onUnknownDocuments: "skip-warn",
  onMissingOrIncompatibleData: "skip-warn",
  onExtraFieldData: "warn",
  
  disableImportAliasWarning: true,
  
  contentDirExclude: [
    '.*',
    '*.tmp',
    '*.bak',
    '_*',
    'node_modules',
    '.git'
  ],
  
  date: {
    timezone: "UTC"
  },
  
  ...(IS_WINDOWS && {
    contentDirInclude: ['**/*.md', '**/*.mdx'],
    disableImportAliasWarning: true,
  }),
  
  onSuccess: async (importData) => {
    const { allDocuments } = await importData();
    console.log(`✅ Successfully generated ${allDocuments.length} documents`);
    
    const typeCount: Record<string, number> = {};
    allDocuments.forEach((doc: any) => {
      const type = doc.type || 'Unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    console.log('\n📊 Document breakdown:');
    Object.entries(typeCount)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    
    if (IS_WINDOWS) {
      console.log('\n🪟 Windows platform - optimizations applied');
    }
  }
});