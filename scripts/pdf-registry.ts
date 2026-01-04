// scripts/pdf-registry.ts - BROWSER-SAFE VERSION WITH TYPE FIX
// This version is safe for client-side use

// -----------------------------------------------------------------------------
// TYPES & SCHEMAS (Institutional Grade)
// -----------------------------------------------------------------------------
export interface PDFConfig {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;
  type: 'editorial' | 'framework' | 'academic' | 'strategic' | 'tool' | 'canvas' | 'worksheet' | 'other';
  format: 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';
  isInteractive: boolean;
  isFillable: boolean;
  category: string;
  tier: 'free' | 'member' | 'architect' | 'inner-circle';
  formats: ('A4' | 'Letter' | 'A3' | 'bundle')[];
  fileSize?: string; // CHANGED: number → string
  lastModified?: Date;
  exists: boolean;
  tags: string[];
  requiresAuth: boolean;
  version?: string;
}

export interface PDFItem {
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
  fileSize?: string; // CHANGED: Consistent string type
  lastModified?: string;
  exists: boolean;
  error?: string;
  isGenerating?: boolean;
  fileUrl?: string;
  tags: string[];
  requiresAuth: boolean;
  version?: string;
}

export type PDFId = string;

// -----------------------------------------------------------------------------
// STATIC REGISTRY (Client-side only) - UPDATED with string fileSize
// -----------------------------------------------------------------------------
export const STATIC_PDF_REGISTRY: Record<string, PDFConfig> = {
  'legacy-architecture-canvas': {
    id: 'legacy-architecture-canvas',
    title: 'The Legacy Architecture Canvas',
    description: 'Heirloom-grade fillable PDF for designing sovereign legacies',
    excerpt: 'The foundational instrument for designing a sovereign legacy. Move beyond sentiment to architect the durable transmission of values, capital, and culture.',
    outputPath: '/assets/downloads/legacy-architecture-canvas.pdf',
    type: 'canvas',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'legacy',
    tier: 'architect',
    formats: ['A4', 'Letter', 'A3', 'bundle'],
    exists: true,
    requiresAuth: true,
    tags: ['legacy', 'governance', 'family', 'formation', 'architecture'],
    version: '1.0.0',
    fileSize: '2.2 MB', // CHANGED: 2200000 → '2.2 MB'
    lastModified: new Date('2024-01-15')
  },
  'ultimate-purpose-of-man': {
    id: 'ultimate-purpose-of-man',
    title: 'The Ultimate Purpose of Man',
    description: 'Definitive editorial examining the structural logic of human purpose.',
    outputPath: '/assets/downloads/ultimate-purpose-of-man-premium.pdf',
    type: 'editorial',
    format: 'PDF',
    isInteractive: false,
    isFillable: false,
    category: 'theology',
    tier: 'member',
    formats: ['A4'],
    exists: true,
    requiresAuth: false,
    tags: ['purpose', 'philosophy', 'theology', 'existence'],
    version: '1.0.0',
    fileSize: '1.8 MB', // CHANGED: 1800000 → '1.8 MB'
    lastModified: new Date('2024-01-10')
  },
  'strategic-foundations': {
    id: 'strategic-foundations',
    title: 'Strategic Foundations',
    description: 'Core frameworks for institutional thinking and leadership.',
    outputPath: '/assets/downloads/strategic-foundations.pdf',
    type: 'framework',
    format: 'PDF',
    isInteractive: false,
    isFillable: false,
    category: 'leadership',
    tier: 'member',
    formats: ['A4', 'Letter'],
    exists: true,
    requiresAuth: false,
    tags: ['strategy', 'leadership', 'foundations', 'principles'],
    version: '1.0.0',
    fileSize: '1.5 MB', // CHANGED: 1500000 → '1.5 MB'
    lastModified: new Date('2024-01-05')
  }
};

// -----------------------------------------------------------------------------
// UTILITY FUNCTIONS FOR TYPE CONVERSION
// -----------------------------------------------------------------------------
export function configToItem(config: PDFConfig): PDFItem {
  return {
    ...config,
    lastModified: config.lastModified ? config.lastModified.toISOString() : undefined,
    fileUrl: config.outputPath,
    fileSize: config.fileSize || formatFileSizeFromBytes(0),
    error: undefined,
    isGenerating: false
  };
}

export function formatFileSizeFromBytes(bytes: number): string {
  if (!bytes) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// -----------------------------------------------------------------------------
// PUBLIC ACCESSORS (Client-side safe)
// -----------------------------------------------------------------------------
export function getPDFRegistry(): Record<PDFId, PDFConfig> {
  return { ...STATIC_PDF_REGISTRY };
}

export function getPDFById(id: string): PDFConfig | null {
  return STATIC_PDF_REGISTRY[id] || null;
}

export function getPDFItemById(id: string): PDFItem | null {
  const config = getPDFById(id);
  return config ? configToItem(config) : null;
}

export function getAllPDFs(): PDFConfig[] {
  return Object.values(STATIC_PDF_REGISTRY)
    .filter(asset => asset.exists)
    .sort((a, b) => {
      const tierOrder: Record<string, number> = { architect: 0, 'inner-circle': 1, member: 2, free: 3 };
      const tierDiff = (tierOrder[a.tier] || 4) - (tierOrder[b.tier] || 4);
      if (tierDiff !== 0) return tierDiff;
      
      const typeOrder: Record<string, number> = { 
        canvas: 0, framework: 1, strategic: 2, 
        editorial: 3, academic: 4, worksheet: 5, tool: 6, other: 7 
      };
      const typeDiff = (typeOrder[a.type] || 8) - (typeOrder[b.type] || 8);
      if (typeDiff !== 0) return typeDiff;
      
      return a.title.localeCompare(b.title);
    });
}

export function getAllPDFItems(): PDFItem[] {
  return getAllPDFs().map(configToItem);
}

export function getPDFsByTier(tier: PDFConfig['tier']): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.tier === tier);
}

export function getPDFItemsByTier(tier: string): PDFItem[] {
  return getAllPDFItems().filter(pdf => pdf.tier === tier);
}

export function getPDFsByType(type: PDFConfig['type']): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.type === type);
}

export function getPDFItemsByType(type: string): PDFItem[] {
  return getAllPDFItems().filter(pdf => pdf.type === type);
}

export function getInteractivePDFs(): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.isInteractive);
}

export function getInteractivePDFItems(): PDFItem[] {
  return getAllPDFItems().filter(pdf => pdf.isInteractive);
}

export function getFillablePDFs(): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.isFillable);
}

export function getFillablePDFItems(): PDFItem[] {
  return getAllPDFItems().filter(pdf => pdf.isFillable);
}

// -----------------------------------------------------------------------------
// GENERATION & DYNAMIC ASSET FUNCTIONS
// -----------------------------------------------------------------------------
export function scanForDynamicAssets(): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.isInteractive || pdf.isFillable);
}

export function getPDFsRequiringGeneration(): PDFConfig[] {
  return getAllPDFs().filter(pdf => !pdf.exists);
}

export function getPDFItemsRequiringGeneration(): PDFItem[] {
  return getAllPDFItems().filter(pdf => !pdf.exists);
}

export function needsRegeneration(pdfId: string): boolean {
  const pdf = getPDFById(pdfId);
  return !pdf?.exists;
}

export async function generateMissingPDFs(): Promise<Array<{id: string; success: boolean; error?: string; message?: string}>> {
  const missingPDFs = getPDFsRequiringGeneration();
  
  console.log(`Generating ${missingPDFs.length} missing PDFs...`);
  
  return missingPDFs.map(pdf => ({
    id: pdf.id,
    success: true,
    message: `PDF ${pdf.title} would be generated server-side`
  }));
}

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS (Client-side safe)
// -----------------------------------------------------------------------------
export function getPDFStats() {
  const allPDFs = getAllPDFs();
  
  return {
    total: allPDFs.length,
    available: allPDFs.filter(pdf => pdf.exists).length,
    interactive: allPDFs.filter(pdf => pdf.isInteractive).length,
    fillable: allPDFs.filter(pdf => pdf.isFillable).length,
    byTier: {
      architect: allPDFs.filter(pdf => pdf.tier === 'architect').length,
      member: allPDFs.filter(pdf => pdf.tier === 'member').length,
      free: allPDFs.filter(pdf => pdf.tier === 'free').length,
    },
    byType: {
      canvas: allPDFs.filter(pdf => pdf.type === 'canvas').length,
      framework: allPDFs.filter(pdf => pdf.type === 'framework').length,
      editorial: allPDFs.filter(pdf => pdf.type === 'editorial').length,
      strategic: allPDFs.filter(pdf => pdf.type === 'strategic').length,
      worksheet: allPDFs.filter(pdf => pdf.type === 'worksheet').length,
      tool: allPDFs.filter(pdf => pdf.type === 'tool').length,
      other: allPDFs.filter(pdf => pdf.type === 'other').length,
    }
  };
}

// -----------------------------------------------------------------------------
// URL UTILITIES
// -----------------------------------------------------------------------------
export function getPDFDownloadUrl(pdf: PDFConfig): string {
  return pdf.outputPath;
}

export function getPDFItemDownloadUrl(pdf: PDFItem): string {
  return pdf.outputPath;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDate(date?: Date): string {
  if (!date) return 'Unknown date';
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// -----------------------------------------------------------------------------
// FILTERING UTILITIES
// -----------------------------------------------------------------------------
export function searchPDFs(query: string): PDFConfig[] {
  const lowerQuery = query.toLowerCase();
  return getAllPDFs().filter(pdf => 
    pdf.title.toLowerCase().includes(lowerQuery) ||
    pdf.description.toLowerCase().includes(lowerQuery) ||
    pdf.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    pdf.category.toLowerCase().includes(lowerQuery)
  );
}

export function searchPDFItems(query: string): PDFItem[] {
  const lowerQuery = query.toLowerCase();
  return getAllPDFItems().filter(pdf => 
    pdf.title.toLowerCase().includes(lowerQuery) ||
    pdf.description.toLowerCase().includes(lowerQuery) ||
    pdf.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    pdf.category.toLowerCase().includes(lowerQuery)
  );
}

export function filterPDFs(options: {
  tier?: PDFConfig['tier'];
  type?: PDFConfig['type'];
  category?: string;
  interactive?: boolean;
  fillable?: boolean;
  requiresAuth?: boolean;
}): PDFConfig[] {
  return getAllPDFs().filter(pdf => {
    if (options.tier && pdf.tier !== options.tier) return false;
    if (options.type && pdf.type !== options.type) return false;
    if (options.category && pdf.category !== options.category) return false;
    if (options.interactive !== undefined && pdf.isInteractive !== options.interactive) return false;
    if (options.fillable !== undefined && pdf.isFillable !== options.fillable) return false;
    if (options.requiresAuth !== undefined && pdf.requiresAuth !== options.requiresAuth) return false;
    return true;
  });
}

export function filterPDFItems(options: {
  tier?: string;
  type?: string;
  category?: string;
  interactive?: boolean;
  fillable?: boolean;
  requiresAuth?: boolean;
}): PDFItem[] {
  return getAllPDFItems().filter(pdf => {
    if (options.tier && pdf.tier !== options.tier) return false;
    if (options.type && pdf.type !== options.type) return false;
    if (options.category && pdf.category !== options.category) return false;
    if (options.interactive !== undefined && pdf.isInteractive !== options.interactive) return false;
    if (options.fillable !== undefined && pdf.isFillable !== options.fillable) return false;
    if (options.requiresAuth !== undefined && pdf.requiresAuth !== options.requiresAuth) return false;
    return true;
  });
}

// -----------------------------------------------------------------------------
// EXPORT CONSTANTS
// -----------------------------------------------------------------------------
export const PDF_REGISTRY = getPDFRegistry();
export const ALL_PDFS = getAllPDFs();
export const ALL_PDF_ITEMS = getAllPDFItems();
export const ARCHITECT_PDFS = getPDFsByTier('architect');
export const ARCHITECT_PDF_ITEMS = getPDFItemsByTier('architect');
export const MEMBER_PDFS = getPDFsByTier('member');
export const MEMBER_PDF_ITEMS = getPDFItemsByTier('member');
export const FREE_PDFS = getPDFsByTier('free');
export const FREE_PDF_ITEMS = getPDFItemsByTier('free');
export const INTERACTIVE_PDFS = getInteractivePDFs();
export const INTERACTIVE_PDF_ITEMS = getInteractivePDFItems();
export const FILLABLE_PDFS = getFillablePDFs();
export const FILLABLE_PDF_ITEMS = getFillablePDFItems();