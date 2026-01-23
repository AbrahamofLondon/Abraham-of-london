// scripts/pdf/scan-content-for-registry.ts
// UNIFIED CONTENT SCANNER FOR REGISTRY GENERATION
// Uses the same scanning logic as universal-converter.ts
// Generates PDF registry entries from content/downloads/ and lib/pdf/

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import crypto from 'crypto';

// Reuse types from universal-converter
type SourceKind = "mdx" | "md" | "xlsx" | "xls" | "pptx" | "ppt" | "pdf";

interface SourceFile {
  absPath: string;
  relPath: string;
  kind: SourceKind;
  baseName: string;
  mtimeMs: number;
  size: number;
  from: "content/downloads" | "lib/pdf";
}

interface PDFRegistryEntry {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;
  type: string;
  format: string;
  isInteractive: boolean;
  isFillable: boolean;
  category: string;
  tier: string;
  formats: string[];
  fileSize: string;
  lastModified: string;
  exists: boolean;
  tags: string[];
  requiresAuth: boolean;
  version: string;
  priority?: number;
  preload?: boolean;
  placeholder?: string;
  md5?: string;
  sourcePath?: string;
  sourceType?: SourceKind;
}

// -----------------------------------------------------------------------------
// SCANNING LOGIC (reused from universal-converter)
// -----------------------------------------------------------------------------

function discoverFiles(root: string, from: SourceFile["from"], recursive: boolean = true): SourceFile[] {
  if (!fs.existsSync(root)) {
    console.warn(`⚠ Source directory does not exist: ${root}`);
    return [];
  }

  const files: SourceFile[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const absPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) walk(absPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase().replace('.', '');
      const kind = ext as SourceKind;
      
      // Only process supported file types
      if (!['mdx', 'md', 'xlsx', 'xls', 'pptx', 'ppt', 'pdf'].includes(kind)) {
        continue;
      }

      const stats = fs.statSync(absPath);
      const relPath = path.relative(root, absPath);
      const baseName = path.basename(entry.name, path.extname(entry.name));

      files.push({
        absPath,
        relPath,
        kind,
        baseName,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
        from,
      });
    }
  }

  walk(root);
  return files;
}

// -----------------------------------------------------------------------------
// METADATA EXTRACTION
// -----------------------------------------------------------------------------

function extractMetadataFromMDX(filePath: string): Record<string, any> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);
    return frontmatter || {};
  } catch (error) {
    console.warn(`❌ Could not parse frontmatter from ${filePath}:`, error.message);
    return {};
  }
}

function extractMetadataFromPDF(filePath: string): Record<string, any> {
  // Basic PDF metadata extraction
  // In production, you might use a library like pdf-lib or pdf-parse
  const stats = fs.statSync(filePath);
  return {
    _pdfSize: stats.size,
    _pdfModified: new Date(stats.mtimeMs).toISOString(),
  };
}

function extractMetadataFromOffice(filePath: string): Record<string, any> {
  // Office files might have metadata in their properties
  // For now, return basic file info
  const stats = fs.statSync(filePath);
  return {
    _officeSize: stats.size,
    _officeModified: new Date(stats.mtimeMs).toISOString(),
  };
}

function getMetadata(sourceFile: SourceFile): Record<string, any> {
  switch (sourceFile.kind) {
    case 'mdx':
    case 'md':
      return extractMetadataFromMDX(sourceFile.absPath);
    case 'pdf':
      return extractMetadataFromPDF(sourceFile.absPath);
    case 'xlsx':
    case 'xls':
    case 'pptx':
    case 'ppt':
      return extractMetadataFromOffice(sourceFile.absPath);
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// INTELLIGENT CATEGORY/TYPE/TIER DETECTION
// -----------------------------------------------------------------------------

function detectCategory(id: string, tags: string[] = [], frontmatter?: Record<string, any>): string {
  // Priority: frontmatter.category > tags > intelligent guessing
  if (frontmatter?.category) return frontmatter.category;
  
  // Check tags for category hints
  const tagCategories = ['legacy', 'leadership', 'theology', 'surrender-framework', 'personal-growth', 'organizational'];
  for (const tag of tags) {
    if (tagCategories.includes(tag.toLowerCase())) return tag;
  }
  
  // Intelligent guessing based on ID/name patterns
  const idLower = id.toLowerCase();
  if (idLower.includes('legacy') || idLower.includes('architecture')) return 'legacy';
  if (idLower.includes('leadership') || idLower.includes('management')) return 'leadership';
  if (idLower.includes('theology') || idLower.includes('scripture')) return 'theology';
  if (idLower.includes('personal') || idLower.includes('alignment')) return 'personal-growth';
  if (idLower.includes('board') || idLower.includes('organizational')) return 'organizational';
  if (idLower.includes('surrender') || idLower.includes('framework')) return 'surrender-framework';
  
  return 'downloads'; // default
}

function detectType(id: string, kind: SourceKind, frontmatter?: Record<string, any>): string {
  if (frontmatter?.type) return frontmatter.type;
  
  const idLower = id.toLowerCase();
  if (idLower.includes('canvas')) return 'canvas';
  if (idLower.includes('worksheet')) return 'worksheet';
  if (idLower.includes('assessment') || idLower.includes('diagnostic')) return 'assessment';
  if (idLower.includes('template')) return 'tool';
  if (idLower.includes('journal') || idLower.includes('log')) return 'journal';
  if (idLower.includes('tracker')) return 'tracker';
  if (idLower.includes('bundle') || idLower.includes('pack') || idLower.includes('kit')) return 'bundle';
  if (idLower.includes('framework')) return 'framework';
  if (idLower.includes('editorial')) return 'editorial';
  if (idLower.includes('strategic')) return 'strategic';
  if (idLower.includes('academic')) return 'academic';
  
  // Default based on file type
  if (kind === 'pdf') return 'tool';
  if (kind === 'xlsx' || kind === 'xls') return 'worksheet';
  if (kind === 'pptx' || kind === 'ppt') return 'strategic';
  
  return 'other';
}

function detectTier(id: string, frontmatter?: Record<string, any>): string {
  if (frontmatter?.tier) return frontmatter.tier;
  
  const idLower = id.toLowerCase();
  if (idLower.includes('premium') || idLower.includes('architect') || idLower.includes('inner-circle')) {
    return 'architect';
  }
  if (idLower.includes('member') || idLower.includes('pro')) {
    return 'member';
  }
  if (idLower.includes('free') || idLower.includes('basic')) {
    return 'free';
  }
  
  // Default tier based on content type
  if (idLower.includes('legacy-architecture')) return 'architect';
  if (idLower.includes('canvas') || idLower.includes('framework')) return 'member';
  
  return 'free';
}

function detectFormats(id: string, kind: SourceKind): string[] {
  const idLower = id.toLowerCase();
  const formats: string[] = [];
  
  if (idLower.includes('a4') || idLower.includes('premium')) formats.push('A4');
  if (idLower.includes('letter')) formats.push('Letter');
  if (idLower.includes('a3')) formats.push('A3');
  if (idLower.includes('bundle') || kind === 'xlsx' || kind === 'xls') formats.push('bundle');
  
  // Default format
  if (formats.length === 0) formats.push('A4');
  
  return formats;
}

function detectInteractiveFillable(id: string, kind: SourceKind): { isInteractive: boolean; isFillable: boolean } {
  const idLower = id.toLowerCase();
  
  // Check filename patterns
  const isFillable = idLower.includes('fillable') || kind === 'xlsx' || kind === 'xls';
  const isInteractive = idLower.includes('interactive') || isFillable;
  
  return { isInteractive, isFillable };
}

// -----------------------------------------------------------------------------
// REGISTRY ENTRY GENERATION
// -----------------------------------------------------------------------------

function sourceFileToRegistryEntry(sourceFile: SourceFile): PDFRegistryEntry {
  const { id, baseName, kind, from, absPath } = sourceFile;
  
  // Extract metadata based on file type
  const metadata = getMetadata(sourceFile);
  
  // Get frontmatter if MDX/MD
  const frontmatter = (kind === 'mdx' || kind === 'md') ? metadata : {};
  
  // Process tags
  const tags = Array.isArray(frontmatter.tags) 
    ? frontmatter.tags 
    : (typeof frontmatter.tags === 'string' ? frontmatter.tags.split(',').map(t => t.trim()) : []);
  
  // Intelligent detection
  const category = detectCategory(id, tags, frontmatter);
  const type = detectType(id, kind, frontmatter);
  const tier = detectTier(id, frontmatter);
  const formats = detectFormats(id, kind);
  const { isInteractive, isFillable } = detectInteractiveFillable(id, kind);
  
  // Generate title
  const title = frontmatter.title || 
    baseName.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  
  // Generate description
  const description = frontmatter.description || 
    frontmatter.excerpt || 
    `${title} - A resource from Abraham of London`;
  
  // Determine output path (matching universal-converter structure)
  const outputPath = from === 'content/downloads'
    ? `/assets/downloads/content-downloads/${id}.pdf`
    : `/assets/downloads/lib-pdf/${id}.pdf`;
  
  // Check if PDF already exists
  const pdfExists = fs.existsSync(path.join('public', outputPath));
  let fileSize = '0 KB';
  
  if (pdfExists) {
    const stats = fs.statSync(path.join('public', outputPath));
    fileSize = formatFileSize(stats.size);
  }
  
  // Generate checksum for versioning
  let md5: string | undefined;
  try {
    if (pdfExists) {
      const fileBuffer = fs.readFileSync(path.join('public', outputPath));
      md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
    }
  } catch (error) {
    // Silently fail on checksum generation
  }
  
  return {
    id,
    title,
    description,
    excerpt: frontmatter.excerpt || description.substring(0, 120) + '...',
    outputPath,
    type,
    format: kind === 'pdf' ? 'PDF' : 
            (kind === 'xlsx' || kind === 'xls') ? 'EXCEL' :
            (kind === 'pptx' || kind === 'ppt') ? 'POWERPOINT' : 'PDF',
    isInteractive,
    isFillable,
    category,
    tier,
    formats,
    fileSize,
    lastModified: new Date(sourceFile.mtimeMs).toISOString(),
    exists: pdfExists,
    tags,
    requiresAuth: tier !== 'free',
    version: frontmatter.version || '1.0.0',
    priority: frontmatter.priority || (tier === 'architect' ? 5 : 10),
    preload: frontmatter.preload || false,
    placeholder: frontmatter.placeholder,
    md5,
    sourcePath: absPath,
    sourceType: kind,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// -----------------------------------------------------------------------------
// MAIN SCANNING FUNCTION
// -----------------------------------------------------------------------------

export function scanAllContentForRegistry(
  contentDir: string = 'content/downloads',
  libPdfDir: string = 'lib/pdf',
  recursive: boolean = true
): PDFRegistryEntry[] {
  console.log('🔍 Scanning content for PDF registry generation...');
  console.log(`📁 Content directory: ${contentDir}`);
  console.log(`📁 Library PDF directory: ${libPdfDir}`);
  
  // Scan both source directories
  const contentFiles = discoverFiles(contentDir, 'content/downloads', recursive);
  const libPdfFiles = discoverFiles(libPdfDir, 'lib/pdf', recursive);
  
  console.log(`✅ Found ${contentFiles.length} content files`);
  console.log(`✅ Found ${libPdfFiles.length} library PDF files`);
  
  // Convert all files to registry entries
  const allEntries: PDFRegistryEntry[] = [];
  
  // Process content files first (higher priority for MDX sources)
  for (const file of contentFiles) {
    try {
      const entry = sourceFileToRegistryEntry(file);
      allEntries.push(entry);
      console.log(`  ✓ ${file.kind}: ${file.baseName} -> ${entry.id}`);
    } catch (error) {
      console.error(`  ✗ Error processing ${file.absPath}:`, error.message);
    }
  }
  
  // Process library PDF files (but avoid duplicates)
  const existingIds = new Set(allEntries.map(e => e.id));
  
  for (const file of libPdfFiles) {
    // Skip if we already have this ID from content files
    if (existingIds.has(file.baseName.toLowerCase().replace(/[^a-z0-9]/g, '-'))) {
      console.log(`  ⚠ Skipping duplicate: ${file.baseName} (already in content)`);
      continue;
    }
    
    try {
      const entry = sourceFileToRegistryEntry(file);
      allEntries.push(entry);
      console.log(`  ✓ ${file.kind}: ${file.baseName} -> ${entry.id}`);
    } catch (error) {
      console.error(`  ✗ Error processing ${file.absPath}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total registry entries: ${allEntries.length}`);
  
  // Group by category for reporting
  const byCategory = allEntries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📈 By category:');
  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });
  
  return allEntries;
}

// -----------------------------------------------------------------------------
// REGISTRY GENERATION
// -----------------------------------------------------------------------------

export function generateRegistryFile(entries: PDFRegistryEntry[], outputPath: string = 'scripts/pdf/pdf-registry.generated.ts'): void {
  const now = new Date().toISOString();
  
  const registryContent = `// scripts/pdf/pdf-registry.generated.ts
// AUTO-GENERATED FROM CONTENT SCAN - DO NOT EDIT MANUALLY
// Generated: ${now}
// Sources: content/downloads/ and lib/pdf/

export type PDFTier = 'free' | 'member' | 'architect' | 'inner-circle';
export type PDFType = 'editorial' | 'framework' | 'academic' | 'strategic' | 'tool' | 'canvas' | 'worksheet' | 'assessment' | 'journal' | 'tracker' | 'bundle' | 'other';
export type PDFFormat = 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';

export interface PDFConfigGenerated {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;
  type: PDFType;
  format: PDFFormat;
  isInteractive: boolean;
  isFillable: boolean;
  category: string;
  tier: PDFTier;
  formats: string[];
  fileSize: string;
  lastModified: string;
  exists: boolean;
  tags: string[];
  requiresAuth: boolean;
  version: string;
  priority?: number;
  preload?: boolean;
  placeholder?: string;
  md5?: string;
}

export const GENERATED_PDF_CONFIGS: PDFConfigGenerated[] = ${JSON.stringify(entries, null, 2)};

export const GENERATED_AT = "${now}";
export const GENERATED_COUNT = ${entries.length};
export const GENERATED_SOURCES = {
  content: ${JSON.stringify(entries.filter(e => e.sourcePath?.includes('content/downloads')).length)},
  libPdf: ${JSON.stringify(entries.filter(e => e.sourcePath?.includes('lib/pdf')).length)}
};

// Helper exports for runtime
export const ALL_GENERATED_IDS = ${JSON.stringify(entries.map(e => e.id))};
export const BY_CATEGORY = ${JSON.stringify(
    entries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )};
export const BY_TIER = ${JSON.stringify(
    entries.reduce((acc, e) => {
      acc[e.tier] = (acc[e.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )};
`;
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, registryContent, 'utf-8');
  console.log(`\n✅ Generated registry file: ${outputPath}`);
}

// -----------------------------------------------------------------------------
// CLI SUPPORT
// -----------------------------------------------------------------------------

export async function scanAndGenerateRegistry() {
  const entries = scanAllContentForRegistry();
  
  if (entries.length === 0) {
    console.error('❌ No content found to generate registry');
    process.exit(1);
  }
  
  generateRegistryFile(entries);
  
  // Also update the main registry manifest
  updateRegistryManifest(entries);
  
  return entries;
}

function updateRegistryManifest(entries: PDFRegistryEntry[]) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    availablePDFs: entries.filter(e => e.exists).length,
    byTier: entries.reduce((acc, e) => {
      acc[e.tier] = (acc[e.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byCategory: entries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byType: entries.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
  
  const manifestPath = 'scripts/pdf/registry-manifest.json';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`📄 Registry manifest: ${manifestPath}`);
}

// -----------------------------------------------------------------------------
// MAIN EXECUTION (CLI)
// -----------------------------------------------------------------------------

if (require.main === module) {
  console.log('🔄 PDF Registry Content Scanner');
  console.log('='.repeat(50));
  
  scanAndGenerateRegistry()
    .then(() => {
      console.log('\n🎉 Registry generation completed!');
      console.log('\nNext steps:');
      console.log('1. Review generated registry: scripts/pdf/pdf-registry.generated.ts');
      console.log('2. Run PDF generation: npm run pdf:generate-from-content');
      console.log('3. Start dev server: npm run dev');
    })
    .catch(error => {
      console.error('❌ Registry generation failed:', error);
      process.exit(1);
    });
}

export default scanAllContentForRegistry;