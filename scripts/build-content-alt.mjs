#!/usr/bin/env node

/**
 * Alternative Content Build System for Abraham of London
 * 
 * This script bypasses Contentlayer's Windows issues by building
 * content directly using gray-matter and generating compatible outputs.
 * 
 * Features:
 * - Processes all MDX/MD files
 * - Generates .contentlayer/generated output
 * - Compatible with existing imports
 * - Full TypeScript support
 */

import fs from 'fs/promises';
import path from 'path';
import { globby } from 'globby';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📚 Alternative Content Build System for Abraham of London\n');

const projectRoot = path.resolve(__dirname, '..');
const contentDir = path.join(projectRoot, 'content');
const outputDir = path.join(projectRoot, '.contentlayer', 'generated');

// Document type configurations matching your project
const documentTypes = [
  { name: 'Post', pattern: 'blog/**/*.{md,mdx}', basePath: 'blog' },
  { name: 'Canon', pattern: 'canon/**/*.{md,mdx}', basePath: 'canon' },
  { name: 'Book', pattern: 'books/**/*.{md,mdx}', basePath: 'books' },
  { name: 'Short', pattern: 'shorts/**/*.{md,mdx}', basePath: 'shorts' },
  { name: 'Event', pattern: 'events/**/*.{md,mdx}', basePath: 'events' },
  { name: 'Resource', pattern: 'resources/**/*.{md,mdx}', basePath: 'resources' },
  { name: 'Strategy', pattern: 'strategy/**/*.{md,mdx}', basePath: 'strategy' },
  { name: 'Article', pattern: 'articles/**/*.{md,mdx}', basePath: 'articles' },
  { name: 'Guide', pattern: 'guides/**/*.{md,mdx}', basePath: 'guides' },
  { name: 'Tutorial', pattern: 'tutorials/**/*.{md,mdx}', basePath: 'tutorials' },
  { name: 'CaseStudy', pattern: 'case-studies/**/*.{md,mdx}', basePath: 'case-studies' },
  { name: 'Whitepaper', pattern: 'whitepapers/**/*.{md,mdx}', basePath: 'whitepapers' },
  { name: 'Report', pattern: 'reports/**/*.{md,mdx}', basePath: 'reports' },
  { name: 'Newsletter', pattern: 'newsletters/**/*.{md,mdx}', basePath: 'newsletters' },
  { name: 'Sermon', pattern: 'sermons/**/*.{md,mdx}', basePath: 'sermons' },
  { name: 'Devotional', pattern: 'devotionals/**/*.{md,mdx}', basePath: 'devotionals' },
  { name: 'Prayer', pattern: 'prayers/**/*.{md,mdx}', basePath: 'prayers' },
  { name: 'Testimony', pattern: 'testimonies/**/*.{md,mdx}', basePath: 'testimonies' },
  { name: 'Podcast', pattern: 'podcasts/**/*.{md,mdx}', basePath: 'podcasts' },
  { name: 'Video', pattern: 'videos/**/*.{md,mdx}', basePath: 'videos' },
  { name: 'Course', pattern: 'courses/**/*.{md,mdx}', basePath: 'courses' },
  { name: 'Lesson', pattern: 'lessons/**/*.{md,mdx}', basePath: 'lessons' },
  { name: 'Print', pattern: 'prints/**/*.{md,mdx}', basePath: 'prints' },
  { name: 'Download', pattern: 'downloads/**/*.{md,mdx}', basePath: 'downloads' }
];

/**
 * Normalize paths for cross-platform compatibility
 */
function normalizePath(filepath) {
  if (!filepath) return '';
  return filepath.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/**
 * Generate URL-safe slug from file path
 */
function generateSlug(filepath) {
  return normalizePath(filepath)
    .split('/')
    .pop()
    ?.replace(/\.mdx?$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled';
}

/**
 * Estimate reading time from content
 */
function estimateReadingTime(content) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Compute fields for a document
 */
function computeFields(data, filepath, body, basePath) {
  const relativePath = normalizePath(filepath.replace(contentDir, '').replace(/^[\/\\]/, ''));
  const flattenedPath = relativePath.replace(/\.mdx?$/, '');
  const slug = data.slug || generateSlug(filepath);
  
  // Compute URL with priority
  const url = data.canonicalUrl && data.canonicalUrl !== '#'
    ? data.canonicalUrl
    : data.href && data.href !== '#'
    ? data.href
    : normalizePath(`/${basePath}/${slug}`);
  
  // Compute publication status
  const isDraft = data.draft === true;
  const isArchived = data.archived === true;
  const isPublished = data.published !== false;
  const isAvailable = data.available !== false;
  
  // Compute dates with fallbacks
  const now = new Date().toISOString();
  const effectiveDate = data.publishDate || data.date || data.updated || now;
  const lastModified = data.updated || data.date || now;
  
  // Compute reading time with fallbacks
  const estimatedTime = estimateReadingTime(body);
  const computedReadingTime = data.readingTime || data.readTime || data.readtime || estimatedTime;
  
  // Compute tier
  const computedTier = data.requiredTier || data.tier || 'free';
  
  // Compute download path
  const downloadPath = data.file || data.downloadFile || data.downloadUrl || 
                       data.pdfPath || data.fileUrl || '';
  
  // File info
  const extension = downloadPath ? downloadPath.split('.').pop()?.toLowerCase() : 'unknown';
  const fileInfo = {
    path: normalizePath(downloadPath),
    size: data.fileSize || null,
    type: extension,
    name: downloadPath ? downloadPath.split('/').pop() : null
  };
  
  // Author list
  const authorList = data.authors && Array.isArray(data.authors)
    ? data.authors
    : data.author
    ? [data.author]
    : [];
  
  // All taxonomies
  const allTaxonomies = new Set();
  if (data.tags && Array.isArray(data.tags)) {
    data.tags.forEach(t => allTaxonomies.add(t));
  }
  if (data.categories && Array.isArray(data.categories)) {
    data.categories.forEach(c => allTaxonomies.add(c));
  }
  if (data.category) {
    allTaxonomies.add(data.category);
  }
  
  // SEO description
  const seoDescription = data.metaDescription || data.ogDescription || 
                        data.description || data.excerpt || '';
  
  return {
    url,
    computedSlug: slug,
    isPublished: isPublished && !isDraft && !isArchived && isAvailable,
    computedReadingTime,
    effectiveDate,
    lastModified,
    computedTier,
    sourcePath: flattenedPath,
    sourceFileName: path.basename(filepath, path.extname(filepath)),
    fileType: filepath.endsWith('.mdx') ? 'mdx' : 'md',
    seoDescription,
    authorList,
    allTaxonomies: Array.from(allTaxonomies),
    downloadPath: normalizePath(downloadPath),
    fileInfo
  };
}

/**
 * Process a single document
 */
async function processDocument(filepath, docType) {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    const { data, content: body } = matter(content);
    
    const computed = computeFields(data, filepath, body, docType.basePath);
    
    const relativePath = normalizePath(filepath.replace(contentDir, '').replace(/^[\/\\]/, ''));
    
    return {
      type: docType.name,
      _id: relativePath,
      _raw: {
        sourceFilePath: normalizePath(filepath.replace(projectRoot, '').replace(/^[\/\\]/, '')),
        sourceFileName: path.basename(filepath),
        sourceFileDir: normalizePath(path.dirname(filepath).replace(projectRoot, '').replace(/^[\/\\]/, '')),
        contentType: filepath.endsWith('.mdx') ? 'mdx' : 'markdown',
        flattenedPath: relativePath.replace(/\.mdx?$/, '')
      },
      ...data,
      ...computed,
      body: {
        raw: body,
        code: body // For compatibility
      }
    };
  } catch (error) {
    console.error(`❌ Error processing ${filepath}:`, error.message);
    return null;
  }
}

/**
 * Main build function
 */
async function build() {
  try {
    const startTime = Date.now();
    
    console.log('🔍 Content directory:', contentDir);
    console.log('📤 Output directory:', outputDir);
    console.log('');
    
    const allDocuments = [];
    const documentsByType = {};
    
    // Process each document type
    for (const docType of documentTypes) {
      const pattern = path.join(contentDir, docType.pattern).replace(/\\/g, '/');
      
      try {
        const files = await globby(pattern, {
          ignore: [
            '**/node_modules/**',
            '**/.git/**',
            '**/_*/**',
            '**/*.tmp',
            '**/*.bak',
            '**/.DS_Store'
          ],
          absolute: true
        });
        
        if (files.length > 0) {
          console.log(`📁 ${docType.name}: Found ${files.length} files`);
        }
        
        const documents = [];
        for (const file of files) {
          const doc = await processDocument(file, docType);
          if (doc) {
            documents.push(doc);
            allDocuments.push(doc);
          }
        }
        
        documentsByType[`all${docType.name}s`] = documents;
        
        if (documents.length > 0) {
          console.log(`   ✅ Processed ${documents.length} ${docType.name} documents`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${docType.name}:`, error.message);
      }
    }
    
    console.log('');
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write individual type files as JSON
    for (const [key, docs] of Object.entries(documentsByType)) {
      if (docs.length > 0) {
        const filename = path.join(outputDir, `${key}.json`);
        await fs.writeFile(filename, JSON.stringify(docs, null, 2));
      }
    }
    
    // Write all documents file
    await fs.writeFile(
      path.join(outputDir, 'allDocuments.json'),
      JSON.stringify(allDocuments, null, 2)
    );
    
    // Create index.mjs for ES module imports
    const indexContent = `// Auto-generated by alternative content build
// Generated: ${new Date().toISOString()}

${documentTypes.map(dt => {
  const varName = `all${dt.name}s`;
  const docs = documentsByType[varName] || [];
  return `export const ${varName} = ${JSON.stringify(docs, null, 2)};`;
}).join('\n\n')}

export const allDocuments = ${JSON.stringify(allDocuments, null, 2)};

// Document counts by type
export const documentCounts = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(documentsByType).map(([key, docs]) => [key, docs.length])
  ),
  null,
  2
)};
`;
    
    await fs.writeFile(path.join(outputDir, 'index.mjs'), indexContent);
    
    // Create index.js for CommonJS compatibility
    const indexCjs = `// Auto-generated by alternative content build
// Generated: ${new Date().toISOString()}

${documentTypes.map(dt => {
  const varName = `all${dt.name}s`;
  const docs = documentsByType[varName] || [];
  return `exports.${varName} = ${JSON.stringify(docs, null, 2)};`;
}).join('\n\n')}

exports.allDocuments = ${JSON.stringify(allDocuments, null, 2)};

exports.documentCounts = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(documentsByType).map(([key, docs]) => [key, docs.length])
  ),
  null,
  2
)};
`;
    
    await fs.writeFile(path.join(outputDir, 'index.js'), indexCjs);
    
    // Create TypeScript definitions
    const typeDefinitions = `// Auto-generated type definitions
// Generated: ${new Date().toISOString()}

export interface DocumentRaw {
  sourceFilePath: string;
  sourceFileName: string;
  sourceFileDir: string;
  contentType: 'mdx' | 'markdown';
  flattenedPath: string;
}

export interface DocumentBody {
  raw: string;
  code?: string;
}

export interface FileInfo {
  path: string;
  size: string | null;
  type: string;
  name: string | null;
}

export interface Document {
  type: string;
  _id: string;
  _raw: DocumentRaw;
  body: DocumentBody;
  
  // Core fields
  title: string;
  subtitle?: string;
  description?: string;
  excerpt?: string;
  
  // Dates
  date?: string;
  updated?: string;
  publishDate?: string;
  expireDate?: string;
  eventDate?: string;
  
  // URLs
  slug?: string;
  href?: string;
  canonicalUrl?: string;
  
  // Classification
  category?: string;
  categories?: string[];
  tags?: string[];
  resourceType?: string;
  contentType?: string;
  
  // Author
  author?: string;
  authors?: string[];
  authorTitle?: string;
  
  // Visual
  coverImage?: string;
  coverAspect?: string;
  coverFit?: string;
  coverPosition?: string;
  
  // Layout
  layout?: string;
  theme?: string;
  
  // Reading
  readTime?: string;
  readtime?: string;
  readingTime?: string;
  wordCount?: number;
  
  // Status
  draft?: boolean;
  published?: boolean;
  featured?: boolean;
  archived?: boolean;
  available?: boolean;
  
  // Access
  requiredTier?: string;
  tier?: string;
  accessLevel?: string;
  requiresLogin?: boolean;
  lockMessage?: string;
  
  // SEO
  ogTitle?: string;
  ogDescription?: string;
  metaDescription?: string;
  socialCaption?: string;
  keywords?: string[];
  
  // Downloads
  file?: string;
  downloadFile?: string;
  pdfPath?: string;
  downloadUrl?: string;
  fileUrl?: string;
  fileSize?: string;
  
  // Events
  time?: string;
  location?: string;
  registrationUrl?: string;
  
  // Organization
  volumeNumber?: string;
  order?: number;
  priority?: number;
  series?: string;
  part?: number;
  
  // Relationships
  related?: string[];
  relatedDownloads?: string[];
  next?: string;
  prev?: string;
  
  // Structured data
  resources?: any;
  ctaPrimary?: any;
  ctaSecondary?: any;
  meta?: any;
  customFields?: any;
  
  // Computed fields
  url: string;
  computedSlug: string;
  isPublished: boolean;
  computedReadingTime: string;
  effectiveDate: string;
  lastModified: string;
  computedTier: string;
  sourcePath: string;
  sourceFileName: string;
  fileType: 'mdx' | 'md';
  seoDescription: string;
  authorList: string[];
  allTaxonomies: string[];
  downloadPath: string;
  fileInfo: FileInfo;
  
  // Allow additional fields
  [key: string]: any;
}

${documentTypes.map(dt => 
  `export declare const all${dt.name}s: Document[];`
).join('\n')}

export declare const allDocuments: Document[];

export declare const documentCounts: Record<string, number>;
`;
    
    await fs.writeFile(path.join(outputDir, 'index.d.ts'), typeDefinitions);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('✅ Build complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total documents: ${allDocuments.length}`);
    console.log(`   Build time: ${duration}s`);
    console.log(`   Output: ${outputDir}\n`);
    
    console.log('📝 Generated files:');
    console.log('   ✓ index.mjs (ES modules)');
    console.log('   ✓ index.js (CommonJS)');
    console.log('   ✓ index.d.ts (TypeScript definitions)');
    console.log('   ✓ allDocuments.json');
    
    const typeCount = Object.entries(documentsByType)
      .filter(([, docs]) => docs.length > 0)
      .length;
    console.log(`   ✓ ${typeCount} document type JSON files\n`);
    
    if (allDocuments.length === 0) {
      console.warn('⚠️  Warning: No documents were processed!');
      console.warn('   Check your content directory structure.\n');
    }
    
    console.log('🚀 Ready to use! Import with:');
    console.log('   import { allPosts, allCanons } from "@/.contentlayer/generated";\n');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the build
build();