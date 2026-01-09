// contentlayer.config.ts - PRODUCTION-READY FIXED VERSION
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import path from 'path';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString } from 'mdast-util-to-string';

// Windows workaround: Use absolute paths
const contentDirPath = path.resolve(process.cwd(), 'content');

// ============================================================================
// FALLBACK COMPATIBILITY FUNCTION
// ============================================================================

// Fallback function for compatibility with old imports
export const getContentlayerData = () => {
  console.warn('[ContentLayer] getContentlayerData() is a stub - use direct imports instead');
  return {
    allDocuments: [],
    allPosts: [],
    allBooks: [],
    allCanons: [],
    allDownloads: [],
    allShorts: [],
    allEvents: [],
    allPrints: [],
    allResources: [],
    allStrategies: [],
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Calculate reading time
const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Generate excerpt from markdown
const generateExcerpt = (content: string, maxLength: number = 160): string => {
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/[#*_~>|`-]/g, '') // Remove markdown formatting
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
  
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + '...';
};

// ============================================================================
// FIELD DEFINITIONS
// ============================================================================

// Update SharedFields to include ALL fields found in your warnings
const SharedFields = {
  title: { 
    type: "string", 
    required: true,
    default: "Untitled Document"
  },
  slug: { 
    type: "string", 
    required: false 
  },
  href: { 
    type: "string", 
    required: false 
  },
  date: { 
    type: "date", 
    required: false,
    default: () => new Date().toISOString().split('T')[0]
  },
  updated: { 
    type: "date", 
    required: false 
  },
  author: { 
    type: "string", 
    required: false,
    default: "Abraham of London"
  },
  authorTitle: { 
    type: "string", 
    required: false 
  },
  excerpt: { 
    type: "string", 
    required: false 
  },
  description: { 
    type: "string", 
    required: false 
  },
  subtitle: { 
    type: "string", 
    required: false 
  },
  draft: { 
    type: "boolean", 
    required: false, 
    default: false 
  },
  published: { 
    type: "boolean", 
    required: false,
    default: true
  },
  tags: { 
    type: "list", 
    of: { type: "string" }, 
    required: false,
    default: []
  },
  category: { 
    type: "string", 
    required: false,
    default: "General"
  },
  ogTitle: { 
    type: "string", 
    required: false 
  },
  ogDescription: { 
    type: "string", 
    required: false 
  },
  socialCaption: { 
    type: "string", 
    required: false 
  },
  canonicalUrl: { 
    type: "string", 
    required: false 
  },
  coverImage: { 
    type: "string", 
    required: false 
  },
  coverAspect: { 
    type: "string", 
    required: false 
  },
  coverFit: { 
    type: "string", 
    required: false 
  },
  coverPosition: { 
    type: "string", 
    required: false 
  },
  featured: { 
    type: "boolean", 
    required: false, 
    default: false 
  },
  priority: { 
    type: "number", 
    required: false 
  },
  accessLevel: { 
    type: "string", 
    required: false,
    default: "public"
  },
  lockMessage: { 
    type: "string", 
    required: false 
  },
  tier: { 
    type: "string", 
    required: false 
  },
  requiresAuth: { 
    type: "boolean", 
    required: false, 
    default: false 
  },
  preload: { 
    type: "boolean", 
    required: false, 
    default: false 
  },
  version: { 
    type: "string", 
    required: false 
  },
  
  // Add fields from warnings:
  layout: { 
    type: "string", 
    required: false,
    default: "default"
  },
  density: { 
    type: "string", 
    required: false 
  },
  featuredImage: { 
    type: "string", 
    required: false 
  },
  resources: { 
    type: "json", 
    required: false 
  },
  downloads: { 
    type: "json", 
    required: false 
  },
  relatedDownloads: { 
    type: "list", 
    of: { type: "string" }, 
    required: false,
    default: []
  },
  isPartTwo: { 
    type: "boolean", 
    required: false, 
    default: false 
  },
  previousPart: { 
    type: "string", 
    required: false 
  },
  volumeNumber: { 
    type: "string", 
    required: false 
  },
  order: { 
    type: "number", 
    required: false 
  },
};

// ============================================================================
// COMPUTED FIELDS (UNIVERSAL)
// ============================================================================

const computedFields = {
  slugComputed: {
    type: "string" as const,
    resolve: (doc: any) => {
      // Priority: 1. slug field, 2. filename, 3. fallback
      if (doc.slug && doc.slug.trim()) return doc.slug.trim();
      const fileName = doc._raw.sourceFileName.replace(/\.(md|mdx)$/, '');
      if (fileName && fileName.trim()) return fileName.trim();
      return `document-${Date.now()}`;
    },
  },
  hrefComputed: {
    type: "string" as const,
    resolve: (doc: any) => {
      if (doc.href) return String(doc.href).trim();
      
      const slug = computedFields.slugComputed.resolve(doc);
      const flattenedPath = String(doc._raw.flattenedPath || '');
      
      // Determine prefix from folder structure
      let prefix = '/';
      if (flattenedPath.includes('blog/')) prefix = '/blog/';
      else if (flattenedPath.includes('books/')) prefix = '/books/';
      else if (flattenedPath.includes('canon/')) prefix = '/canon/';
      else if (flattenedPath.includes('downloads/')) prefix = '/downloads/';
      else if (flattenedPath.includes('shorts/')) prefix = '/shorts/';
      else if (flattenedPath.includes('events/')) prefix = '/events/';
      else if (flattenedPath.includes('prints/')) prefix = '/prints/';
      else if (flattenedPath.includes('resources/')) prefix = '/resources/';
      else if (flattenedPath.includes('strategy/')) prefix = '/strategy/';
      
      return `${prefix}${slug}`;
    },
  },
  readTime: {
    type: "number" as const,
    resolve: (doc: any) => {
      if (doc.readTime && typeof doc.readTime === 'number') return doc.readTime;
      if (doc.readingTime && typeof doc.readingTime === 'number') return doc.readingTime;
      if (doc.readtime && typeof doc.readtime === 'number') return doc.readtime;
      
      // Calculate from content
      try {
        const content = doc.body?.raw || doc.body?.code || '';
        const plainText = content
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`[^`]*`/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[#*_~>|`-]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        return calculateReadingTime(plainText);
      } catch {
        return 5; // Default fallback
      }
    },
  },
  excerptComputed: {
    type: "string" as const,
    resolve: (doc: any) => {
      if (doc.excerpt && doc.excerpt.trim()) return doc.excerpt.trim();
      if (doc.description && doc.description.trim()) return doc.description.trim();
      
      // Generate from content
      try {
        const content = doc.body?.raw || doc.body?.code || '';
        return generateExcerpt(content);
      } catch {
        return "Read this document for valuable insights and practical guidance.";
      }
    },
  },
  dateComputed: {
    type: "date" as const,
    resolve: (doc: any) => {
      if (doc.date) return doc.date;
      if (doc.updated) return doc.updated;
      
      // Try to extract from filename (YYYY-MM-DD-pattern)
      const fileName = doc._raw.sourceFileName;
      const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) return dateMatch[1];
      
      // Use file creation/modified date as last resort
      return new Date().toISOString().split('T')[0];
    },
  },
};

// ============================================================================
// DOCUMENT TYPE DEFINITIONS
// ============================================================================

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    // Blog-specific fields
    series: { type: "string", required: false },
    isSeriesPart: { type: "boolean", required: false, default: false },
    seriesOrder: { type: "number", required: false },
  },
  computedFields: {
    ...computedFields,
    readTimeString: {
      type: "string" as const,
      resolve: (doc: any) => `${doc.readTime || 5} min read`,
    },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    // Book-specific fields
    isbn: { type: "string", required: false },
    pages: { type: "number", required: false },
    publisher: { type: "string", required: false },
    publishedDate: { type: "date", required: false },
    edition: { type: "string", required: false },
    format: { type: "string", required: false },
  },
  computedFields,
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...SharedFields,
    // Canon-specific fields
    canonType: { type: "string", required: false },
    volume: { type: "string", required: false },
    part: { type: "string", required: false },
    isDraft: { type: "boolean", required: false, default: false },
  },
  computedFields,
}));

// Download needs additional fields from your content
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
    contentOnly: { type: "boolean", required: false, default: false },
    requiresEmail: { type: "boolean", required: false, default: false },
    emailFieldLabel: { type: "string", required: false },
    emailSuccessMessage: { type: "string", required: false },
  },
  computedFields: {
    ...computedFields,
    downloadUrlComputed: {
      type: "string" as const,
      resolve: (doc: any) => {
        if (doc.downloadUrl) return doc.downloadUrl;
        if (doc.fileUrl) return doc.fileUrl;
        if (doc.downloadFile) return doc.downloadFile;
        if (doc.pdfPath) return doc.pdfPath;
        if (doc.file) return doc.file;
        return null;
      },
    },
  },
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
    timezone: { type: "string", required: false },
    isVirtual: { type: "boolean", required: false, default: false },
    meetingLink: { type: "string", required: false },
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
    isPhysical: { type: "boolean", required: false, default: false },
    price: { type: "number", required: false },
    currency: { type: "string", required: false },
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
    complexity: { type: "string", required: false },
    timeframe: { type: "string", required: false },
    deliverables: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields,
}));

// ============================================================================
// EXPORT CONFIGURATION (PRODUCTION SAFE)
// ============================================================================

export default makeSource({
  // CRITICAL FIX: YAML parsing to handle duplicate keys gracefully
  yaml: {
    onDuplicateKey: (key, value1, value2, context) => {
      console.warn(`⚠️ Duplicate YAML key "${key}" found in ${context.filename}. Using first value.`);
      return value1;
    },
    strict: false,
  },
  contentDirPath,
  documentTypes: [Post, Book, Canon, Download, Short, Event, Print, Resource, Strategy],
  disableImportAliasWarning: true,
  
  // CRITICAL: These settings prevent "0 content" issues
  onExtraFieldData: "ignore", // Don't fail on extra fields
  onUnknownDocuments: "skip", // Don't fail on unknown docs
  onMissingOrIncompatibleData: "skip-fix", // Fix missing data
  
  // IMPORTANT: Add mdx options for better parsing
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
  
  // Export all document types for direct import
  exportAllTypes: true,
  exportFlattenedPathMap: true,
  
  // Add debug logging in development only
  onSuccess: async (importData) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Contentlayer generated successfully');
      console.log(`📄 Documents processed:`);
      console.log(`   - Posts: ${importData.allPosts.length}`);
      console.log(`   - Downloads: ${importData.allDownloads.length}`);
      console.log(`   - Books: ${importData.allBooks.length}`);
      console.log(`   - Canon: ${importData.allCanons.length}`);
      console.log(`   - Total: ${importData.allDocuments.length}`);
      
      // Log any documents with issues
      importData.allDocuments.forEach((doc: any) => {
        if (!doc.slugComputed || doc.slugComputed.includes('document-')) {
          console.warn(`⚠️  Document without proper slug: ${doc._raw.sourceFilePath}`);
        }
      });
    }
  },
});

// ============================================================================
// COMPATIBILITY EXPORTS
// ============================================================================

// Export all types for easy importing
export const allDocumentTypes = {
  Post,
  Book,
  Canon,
  Download,
  Short,
  Event,
  Print,
  Resource,
  Strategy,
};

// Legacy export pattern for compatibility
export const contentlayerConfig = {
  contentDirPath,
  documentTypes: [Post, Book, Canon, Download, Short, Event, Print, Resource, Strategy],
};

// Export the computed fields for reuse
export { computedFields };
