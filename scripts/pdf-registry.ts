<<<<<<< HEAD
// scripts/pdf-registry.ts - PRODUCTION-OPTIMIZED CONSOLIDATED VERSION
// Enterprise-grade PDF registry with efficient lookup and production optimizations
=======
// scripts/pdf-registry.ts - BROWSER-SAFE VERSION WITH TYPE FIX
// This version is safe for client-side use
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775

// -----------------------------------------------------------------------------
// TYPES & SCHEMAS (Production Grade with Runtime Validation)
// -----------------------------------------------------------------------------

export type PDFType = 
  | 'editorial' | 'framework' | 'academic' | 'strategic' 
  | 'tool' | 'canvas' | 'worksheet' | 'assessment' 
  | 'journal' | 'tracker' | 'bundle' | 'other';

export type PDFFormat = 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';
export type PDFTier = 'free' | 'member' | 'architect' | 'inner-circle';
export type PaperFormat = 'A4' | 'Letter' | 'A3' | 'bundle';

export interface PDFConfig {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;
<<<<<<< HEAD
  type: PDFType;
  format: PDFFormat;
  isInteractive: boolean;
  isFillable: boolean;
  category: string;
  tier: PDFTier;
  formats: PaperFormat[];
  fileSize: string; // Human-readable: "2.2 MB"
  lastModified: Date;
  exists: boolean;
=======
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
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
  tags: string[];
  requiresAuth: boolean;
  version: string;
  priority?: number; // For loading prioritization (1 = highest)
  preload?: boolean; // Whether to preload in browser
  placeholder?: string; // LQIP placeholder URL
  md5?: string; // For cache invalidation
}

export interface PDFItem extends Omit<PDFConfig, 'lastModified'> {
  lastModified: string; // ISO string for serialization
  fileUrl: string;
  error?: string;
  isGenerating?: boolean;
  downloadCount?: number;
  rating?: number;
}

// -----------------------------------------------------------------------------
<<<<<<< HEAD
// CONSTANTS & ENUMS (For type safety and performance)
// -----------------------------------------------------------------------------

export const PDF_TYPES: Record<PDFType, string> = {
  editorial: 'Editorial',
  framework: 'Framework',
  academic: 'Academic',
  strategic: 'Strategic',
  tool: 'Tool',
  canvas: 'Canvas',
  worksheet: 'Worksheet',
  assessment: 'Assessment',
  journal: 'Journal',
  tracker: 'Tracker',
  bundle: 'Bundle',
  other: 'Other'
};

export const PDF_TIERS: Record<PDFTier, string> = {
  free: 'Free',
  member: 'Member',
  architect: 'Architect',
  'inner-circle': 'Inner Circle'
};

export const CATEGORIES = {
  'surrender-framework': 'Surrender Framework',
  'legacy': 'Legacy Architecture',
  'theology': 'Theology & Philosophy',
  'leadership': 'Leadership',
  'personal-growth': 'Personal Growth',
  'organizational': 'Organizational'
} as const;

// -----------------------------------------------------------------------------
// STATIC REGISTRY (Production-Optimized with Lazy Loading Support)
// -----------------------------------------------------------------------------

// Helper to create consistent file paths
const ASSETS_PATH = '/assets/downloads';
const createAssetPath = (filename: string) => `${ASSETS_PATH}/${filename}`;

// Core registry with all PDF assets - optimized for fast lookups
const PDF_REGISTRY_MAP: Map<string, PDFConfig> = new Map([
  // ==================== SURRENDER FRAMEWORK ASSETS ====================
  ['surrender-framework-worksheet', {
    id: 'surrender-framework-worksheet',
    title: '4D Surrender Framework Worksheet',
    description: 'Interactive worksheet for applying the 4D Framework to real decisions',
    excerpt: 'Step-by-step guide for discerning, detaching, deciding, and demonstrating surrender in daily choices',
    outputPath: createAssetPath('surrender-framework-worksheet.pdf'),
    type: 'worksheet',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'surrender-framework',
    tier: 'member',
    formats: ['A4', 'Letter'],
    exists: true,
    requiresAuth: false,
    tags: ['surrender', 'framework', 'worksheet', 'personal-development', 'decision-making'],
    version: '1.0.0',
    fileSize: '1.5 MB',
    lastModified: new Date('2024-01-05'),
    priority: 1,
    preload: true
  }],
  
  ['weekly-surrender-audit', {
    id: 'weekly-surrender-audit',
    title: 'Weekly Surrender Audit Template',
    description: 'Daily practice sheets for cultivating surrender consciousness',
    excerpt: '7-day structured practice for monitoring and improving surrender alignment',
    outputPath: createAssetPath('weekly-surrender-audit.pdf'),
    type: 'worksheet',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'surrender-framework',
    tier: 'member',
    formats: ['A4', 'Letter'],
    exists: true,
    requiresAuth: false,
    tags: ['surrender', 'audit', 'daily-practice', 'alignment', 'journal'],
    version: '1.0.0',
    fileSize: '0.8 MB',
    lastModified: new Date('2024-01-05'),
    priority: 2
  }],
  
  ['surrender-diagnostic', {
    id: 'surrender-diagnostic',
    title: 'Submission vs. Surrender Diagnostic',
    description: '20-question assessment to identify submission patterns',
    excerpt: 'Comprehensive assessment tool measuring surrender orientation across 5 key domains',
    outputPath: createAssetPath('surrender-diagnostic.pdf'),
    type: 'assessment',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'surrender-framework',
    tier: 'member',
    formats: ['A4'],
    exists: true,
    requiresAuth: false,
    tags: ['surrender', 'diagnostic', 'assessment', 'self-evaluation', 'submission'],
    version: '1.0.0',
    fileSize: '1.2 MB',
    lastModified: new Date('2024-01-05'),
    priority: 1,
    preload: true
  }],
  
  ['principles-rules-matrix', {
    id: 'principles-rules-matrix',
    title: 'Principles Over Rules Decision Matrix',
    description: 'Decision-making tool for organizations/individuals',
    excerpt: 'Framework for replacing compliance-based rules with principle-based alignment',
    outputPath: createAssetPath('principles-rules-matrix.pdf'),
    type: 'framework',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'surrender-framework',
    tier: 'architect',
    formats: ['A4', 'A3'],
    exists: true,
    requiresAuth: true,
    tags: ['principles', 'rules', 'decision-making', 'organizational', 'framework'],
    version: '1.0.0',
    fileSize: '1.0 MB',
    lastModified: new Date('2024-01-05'),
    priority: 1
  }],
  
  ['life-alignment-assessment', {
    id: 'life-alignment-assessment',
    title: 'Personal Alignment Assessment',
    description: 'Identify submission patterns and alignment opportunities',
    excerpt: 'Holistic assessment covering vertical alignment, horizontal relationships, and principle integration',
    outputPath: createAssetPath('life-alignment-assessment.pdf'),
    type: 'assessment',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'surrender-framework',
    tier: 'member',
    formats: ['A4'],
    exists: true,
    requiresAuth: false,
    tags: ['alignment', 'assessment', 'personal-growth', 'vertical', 'horizontal'],
    version: '1.0.0',
    fileSize: '1.3 MB',
    lastModified: new Date('2024-01-05'),
    priority: 2
  }],
  
  ['surrender-starter-kit', {
    id: 'surrender-starter-kit',
    title: 'Surrender Framework Starter Kit',
    description: 'Complete package with all worksheets and templates',
    excerpt: 'Everything you need to begin practicing the surrender framework in one comprehensive bundle',
    outputPath: createAssetPath('surrender-starter-kit.zip'),
    type: 'bundle',
    format: 'ZIP',
    isInteractive: false,
    isFillable: false,
    category: 'surrender-framework',
    tier: 'inner-circle',
    formats: ['bundle'],
    exists: true,
    requiresAuth: true,
    tags: ['surrender', 'starter-kit', 'bundle', 'complete', 'all-in-one'],
    version: '1.0.0',
    fileSize: '5.0 MB',
    lastModified: new Date('2024-01-05'),
    priority: 3
  }],
  
  ['submission-test', {
    id: 'submission-test',
    title: 'The Submission Test',
    description: 'Quick diagnostic tool to identify submission patterns',
    excerpt: 'Four-question rapid assessment for distinguishing surrender from submission in any situation',
    outputPath: createAssetPath('submission-test.pdf'),
    type: 'tool',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'surrender-framework',
    tier: 'free',
    formats: ['A4'],
    exists: true,
    requiresAuth: false,
    tags: ['submission', 'test', 'quick', 'diagnostic', 'tool'],
    version: '1.0.0',
    fileSize: '0.5 MB',
    lastModified: new Date('2024-01-05'),
    priority: 1,
    preload: true
  }],
  
  ['vertical-alignment-journal', {
    id: 'vertical-alignment-journal',
    title: 'Vertical Alignment Journal',
    description: '30-day journal for cultivating vertical connection',
    excerpt: 'Structured daily practice for strengthening vertical alignment as foundation for horizontal love',
    outputPath: createAssetPath('vertical-alignment-journal.pdf'),
    type: 'journal',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'surrender-framework',
    tier: 'member',
    formats: ['A4'],
    exists: true,
    requiresAuth: false,
    tags: ['vertical', 'alignment', 'journal', 'daily', 'spiritual'],
    version: '1.0.0',
    fileSize: '1.8 MB',
    lastModified: new Date('2024-01-05'),
    priority: 2
  }],
  
  ['surrender-breakthrough-tracker', {
    id: 'surrender-breakthrough-tracker',
    title: 'Surrender Breakthrough Tracker',
    description: 'Track progress and breakthroughs in surrender practice',
    excerpt: 'Tool for documenting and celebrating surrender breakthroughs across all life domains',
    outputPath: createAssetPath('surrender-breakthrough-tracker.pdf'),
    type: 'tracker',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'surrender-framework',
    tier: 'member',
    formats: ['A4'],
    exists: true,
    requiresAuth: false,
    tags: ['breakthrough', 'tracker', 'progress', 'celebration', 'milestones'],
    version: '1.0.0',
    fileSize: '0.7 MB',
    lastModified: new Date('2024-01-05'),
    priority: 2
  }],
  
  // ==================== LEGACY & EXISTING ASSETS ====================
  ['legacy-architecture-canvas', {
=======
// STATIC REGISTRY (Client-side only) - UPDATED with string fileSize
// -----------------------------------------------------------------------------
export const STATIC_PDF_REGISTRY: Record<string, PDFConfig> = {
  'legacy-architecture-canvas': {
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
    id: 'legacy-architecture-canvas',
    title: 'The Legacy Architecture Canvas',
    description: 'Heirloom-grade fillable PDF for designing sovereign legacies',
    excerpt: 'The foundational instrument for designing a sovereign legacy. Move beyond sentiment to architect the durable transmission of values, capital, and culture.',
<<<<<<< HEAD
    outputPath: createAssetPath('legacy-architecture-canvas.pdf'),
=======
    outputPath: '/assets/downloads/legacy-architecture-canvas.pdf',
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
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
<<<<<<< HEAD
    fileSize: '2.2 MB',
    lastModified: new Date('2024-01-15'),
    priority: 1,
    preload: true
  }],
  
  ['ultimate-purpose-of-man', {
    id: 'ultimate-purpose-of-man',
    title: 'The Ultimate Purpose of Man',
    description: 'Definitive editorial examining the structural logic of human purpose.',
    excerpt: 'Comprehensive exploration of human purpose from theological, philosophical, and practical perspectives.',
    outputPath: createAssetPath('ultimate-purpose-of-man-premium.pdf'),
=======
    fileSize: '2.2 MB', // CHANGED: 2200000 → '2.2 MB'
    lastModified: new Date('2024-01-15')
  },
  'ultimate-purpose-of-man': {
    id: 'ultimate-purpose-of-man',
    title: 'The Ultimate Purpose of Man',
    description: 'Definitive editorial examining the structural logic of human purpose.',
    outputPath: '/assets/downloads/ultimate-purpose-of-man-premium.pdf',
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
    type: 'editorial',
    format: 'PDF',
    isInteractive: false,
    isFillable: false,
    category: 'theology',
    tier: 'member',
    formats: ['A4'],
    exists: true,
    requiresAuth: false,
<<<<<<< HEAD
    tags: ['purpose', 'philosophy', 'theology', 'existence', 'meaning'],
    version: '1.0.0',
    fileSize: '1.8 MB',
    lastModified: new Date('2024-01-10'),
    priority: 1
  }],
  
  ['strategic-foundations', {
    id: 'strategic-foundations',
    title: 'Strategic Foundations',
    description: 'Core frameworks for institutional thinking and leadership.',
    excerpt: 'Essential frameworks for building durable institutions and effective leadership structures.',
    outputPath: createAssetPath('strategic-foundations.pdf'),
=======
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
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
    type: 'framework',
    format: 'PDF',
    isInteractive: false,
    isFillable: false,
    category: 'leadership',
    tier: 'member',
    formats: ['A4', 'Letter'],
    exists: true,
    requiresAuth: false,
<<<<<<< HEAD
    tags: ['strategy', 'leadership', 'foundations', 'principles', 'institutional'],
    version: '1.0.0',
    fileSize: '1.5 MB',
    lastModified: new Date('2024-01-05'),
    priority: 2
  }],
  
  // ==================== ADDITIONAL ESSENTIAL ASSETS ====================
  ['board-investor-onepager', {
    id: 'board-investor-onepager',
    title: 'Board & Investor One-Pager Template',
    description: 'Professional template for executive summaries and investor briefings',
    excerpt: 'Concise, powerful one-pager template for board meetings and investor presentations',
    outputPath: createAssetPath('board-investor-onepager.pdf'),
    type: 'tool',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'organizational',
    tier: 'architect',
    formats: ['A4', 'Letter'],
    exists: true,
    requiresAuth: true,
    tags: ['board', 'investor', 'template', 'executive', 'briefing'],
    version: '1.0.0',
    fileSize: '0.9 MB',
    lastModified: new Date('2024-01-12'),
    priority: 2
  }],
  
  ['brotherhood-covenant', {
    id: 'brotherhood-covenant',
    title: 'Brotherhood Covenant Template',
    description: 'Framework for establishing intentional brotherhood commitments',
    excerpt: 'Structured covenant for building accountable, purpose-driven male relationships',
    outputPath: createAssetPath('brotherhood-covenant.pdf'),
    type: 'framework',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'personal-growth',
    tier: 'member',
    formats: ['A4'],
    exists: true,
    requiresAuth: false,
    tags: ['brotherhood', 'covenant', 'accountability', 'relationships', 'men'],
    version: '1.0.0',
    fileSize: '0.6 MB',
    lastModified: new Date('2024-01-08'),
    priority: 2
  }],
  
  ['family-governance-charter', {
    id: 'family-governance-charter',
    title: 'Family Governance Charter Template',
    description: 'Comprehensive framework for multi-generational family governance',
    excerpt: 'Structured charter for establishing clear family governance, values transmission, and decision-making processes',
    outputPath: createAssetPath('family-governance-charter.pdf'),
    type: 'framework',
    format: 'PDF',
    isInteractive: true,
    isFillable: true,
    category: 'legacy',
    tier: 'architect',
    formats: ['A4', 'Letter'],
    exists: true,
    requiresAuth: true,
    tags: ['family', 'governance', 'charter', 'legacy', 'multi-generational'],
    version: '1.0.0',
    fileSize: '1.4 MB',
    lastModified: new Date('2024-01-18'),
    priority: 1
  }]
]);

// -----------------------------------------------------------------------------
// CACHED COLLECTIONS (For performance optimization)
// -----------------------------------------------------------------------------

let cachedAllPDFs: PDFConfig[] | null = null;
let cachedAllPDFItems: PDFItem[] | null = null;

// -----------------------------------------------------------------------------
// CORE UTILITIES (Type-safe and efficient)
// -----------------------------------------------------------------------------

export function configToItem(config: PDFConfig): PDFItem {
  return {
    ...config,
    lastModified: config.lastModified.toISOString(),
    fileUrl: config.outputPath
  };
}

export function getPDFById(id: string): PDFConfig | null {
  return PDF_REGISTRY_MAP.get(id) || null;
}

export function getPDFItemById(id: string): PDFItem | null {
  const config = getPDFById(id);
  return config ? configToItem(config) : null;
}

export function getAllPDFs(): PDFConfig[] {
  if (!cachedAllPDFs) {
    cachedAllPDFs = Array.from(PDF_REGISTRY_MAP.values())
      .filter(pdf => pdf.exists)
      .sort((a, b) => {
        // Priority first
        if (a.priority !== b.priority) {
          return (a.priority || 999) - (b.priority || 999);
        }
        // Then tier
        const tierOrder: Record<PDFTier, number> = {
          'architect': 0,
          'inner-circle': 1,
          'member': 2,
          'free': 3
        };
        const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
        if (tierDiff !== 0) return tierDiff;
        
        // Then title
        return a.title.localeCompare(b.title);
      });
  }
  return cachedAllPDFs;
}

export function getAllPDFItems(): PDFItem[] {
  if (!cachedAllPDFItems) {
    cachedAllPDFItems = getAllPDFs().map(configToItem);
  }
  return cachedAllPDFItems;
}

// -----------------------------------------------------------------------------
// FILTERING & SEARCH (Optimized with memoization)
// -----------------------------------------------------------------------------

const filterCache = new Map<string, PDFConfig[]>();
const searchCache = new Map<string, PDFConfig[]>();

export function getPDFsByTier(tier: PDFTier): PDFConfig[] {
  const cacheKey = `tier:${tier}`;
  if (!filterCache.has(cacheKey)) {
    filterCache.set(cacheKey, getAllPDFs().filter(pdf => pdf.tier === tier));
  }
  return filterCache.get(cacheKey)!;
}

export function getPDFsByType(type: PDFType): PDFConfig[] {
  const cacheKey = `type:${type}`;
  if (!filterCache.has(cacheKey)) {
    filterCache.set(cacheKey, getAllPDFs().filter(pdf => pdf.type === type));
  }
  return filterCache.get(cacheKey)!;
}

export function getPDFsByCategory(category: string): PDFConfig[] {
  const cacheKey = `category:${category}`;
  if (!filterCache.has(cacheKey)) {
    filterCache.set(cacheKey, getAllPDFs().filter(pdf => pdf.category === category));
  }
  return filterCache.get(cacheKey)!;
}

export function getInteractivePDFs(): PDFConfig[] {
  const cacheKey = 'interactive';
  if (!filterCache.has(cacheKey)) {
    filterCache.set(cacheKey, getAllPDFs().filter(pdf => pdf.isInteractive));
  }
  return filterCache.get(cacheKey)!;
}

export function getFillablePDFs(): PDFConfig[] {
  const cacheKey = 'fillable';
  if (!filterCache.has(cacheKey)) {
    filterCache.set(cacheKey, getAllPDFs().filter(pdf => pdf.isFillable));
  }
  return filterCache.get(cacheKey)!;
}

export function getPreloadPDFs(): PDFConfig[] {
  const cacheKey = 'preload';
  if (!filterCache.has(cacheKey)) {
    filterCache.set(cacheKey, getAllPDFs().filter(pdf => pdf.preload));
  }
  return filterCache.get(cacheKey)!;
}

export function searchPDFs(query: string): PDFConfig[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return getAllPDFs();
  
  if (!searchCache.has(normalizedQuery)) {
    const results = getAllPDFs().filter(pdf => {
      if (pdf.title.toLowerCase().includes(normalizedQuery)) return true;
      if (pdf.description.toLowerCase().includes(normalizedQuery)) return true;
      if (pdf.excerpt?.toLowerCase().includes(normalizedQuery)) return true;
      if (pdf.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) return true;
      if (pdf.category.toLowerCase().includes(normalizedQuery)) return true;
      return false;
    });
    searchCache.set(normalizedQuery, results);
  }
  
  return searchCache.get(normalizedQuery)!;
}

// -----------------------------------------------------------------------------
// STATISTICS & ANALYTICS (For dashboards and insights)
// -----------------------------------------------------------------------------

export function getPDFStats() {
  const allPDFs = getAllPDFs();
  const stats = {
    total: allPDFs.length,
    available: allPDFs.filter(pdf => pdf.exists).length,
    interactive: allPDFs.filter(pdf => pdf.isInteractive).length,
    fillable: allPDFs.filter(pdf => pdf.isFillable).length,
    preload: allPDFs.filter(pdf => pdf.preload).length,
    byTier: {} as Record<PDFTier, number>,
    byType: {} as Record<PDFType, number>,
    byCategory: {} as Record<string, number>,
    averageFileSize: '0 MB',
    newest: null as PDFConfig | null,
    oldest: null as PDFConfig | null
  };
  
  // Calculate tier distribution
  Object.values(PDF_TIERS).forEach(tier => {
    stats.byTier[tier as PDFTier] = allPDFs.filter(pdf => pdf.tier === tier).length;
  });
  
  // Calculate type distribution
  Object.values(PDF_TYPES).forEach(type => {
    stats.byType[type as PDFType] = allPDFs.filter(pdf => pdf.type === type).length;
  });
  
  // Calculate category distribution
  allPDFs.forEach(pdf => {
    stats.byCategory[pdf.category] = (stats.byCategory[pdf.category] || 0) + 1;
  });
  
  // Find newest and oldest
  if (allPDFs.length > 0) {
    stats.newest = allPDFs.reduce((newest, current) => 
      current.lastModified > newest.lastModified ? current : newest
    );
    stats.oldest = allPDFs.reduce((oldest, current) => 
      current.lastModified < oldest.lastModified ? current : oldest
    );
  }
  
  return stats;
}

// -----------------------------------------------------------------------------
// GENERATION UTILITIES (Server-side focused)
// -----------------------------------------------------------------------------

export function getPDFsRequiringGeneration(): PDFConfig[] {
  return getAllPDFs().filter(pdf => !pdf.exists);
}

export function needsRegeneration(pdfId: string, forceCheck = false): boolean {
  const pdf = getPDFById(pdfId);
  if (!pdf) return false;
  
  if (forceCheck) {
    // In production, you might check file system or database here
    return !pdf.exists;
  }
  
  return !pdf.exists;
}

// -----------------------------------------------------------------------------
// URL & DOWNLOAD UTILITIES (Production-optimized)
// -----------------------------------------------------------------------------

export function getDownloadUrl(pdfId: string, variant: 'direct' | 'tracked' = 'direct'): string {
  const pdf = getPDFById(pdfId);
  if (!pdf) return '';
  
  if (variant === 'tracked') {
    // Add tracking parameters for analytics
    return `${pdf.outputPath}?utm_source=pdf_registry&utm_content=${pdfId}&t=${Date.now()}`;
  }
  
  return pdf.outputPath;
}

export function getPreviewUrl(pdfId: string): string {
  const pdf = getPDFById(pdfId);
  if (!pdf) return '';
  
  // In production, you might generate or serve a preview image
  return pdf.outputPath.replace('.pdf', '-preview.jpg');
}

// -----------------------------------------------------------------------------
// CACHE MANAGEMENT (For production scaling)
// -----------------------------------------------------------------------------

export function clearCaches(): void {
  cachedAllPDFs = null;
  cachedAllPDFItems = null;
  filterCache.clear();
  searchCache.clear();
}

export function invalidateCacheForId(pdfId: string): void {
  // Clear specific caches when a PDF is updated
  clearCaches();
}

// -----------------------------------------------------------------------------
// VALIDATION & INTEGRITY CHECKS (Production safety)
// -----------------------------------------------------------------------------

export function validatePDFConfig(config: PDFConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.id) errors.push('Missing id');
  if (!config.title) errors.push('Missing title');
  if (!config.outputPath) errors.push('Missing outputPath');
  if (!config.fileSize) errors.push('Missing fileSize');
  if (!config.lastModified) errors.push('Missing lastModified');
  if (!config.version) errors.push('Missing version');
  
  // Validate fileSize format
  if (config.fileSize && !/^\d+(\.\d+)?\s*(B|KB|MB|GB)$/i.test(config.fileSize)) {
    errors.push(`Invalid fileSize format: ${config.fileSize}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateRegistry(): { valid: boolean; errors: Array<{ id: string; errors: string[] }> } {
  const errors: Array<{ id: string; errors: string[] }> = [];
  
  PDF_REGISTRY_MAP.forEach((config, id) => {
    const validation = validatePDFConfig(config);
    if (!validation.valid) {
      errors.push({ id, errors: validation.errors });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// -----------------------------------------------------------------------------
// EXPORT CONSTANTS (For easy imports)
// -----------------------------------------------------------------------------

// Convert Map to object for serialization if needed
export const STATIC_PDF_REGISTRY = Object.fromEntries(PDF_REGISTRY_MAP);

// Pre-calculated collections for common use cases
export const ALL_PDFS = getAllPDFs();
export const ALL_PDF_ITEMS = getAllPDFItems();
export const ARCHITECT_PDFS = getPDFsByTier('architect');
export const MEMBER_PDFS = getPDFsByTier('member');
export const FREE_PDFS = getPDFsByTier('free');
export const INNER_CIRCLE_PDFS = getPDFsByTier('inner-circle');
export const INTERACTIVE_PDFS = getInteractivePDFs();
export const FILLABLE_PDFS = getFillablePDFs();
export const PRELOAD_PDFS = getPreloadPDFs();

// Category-specific collections
export const SURRENDER_FRAMEWORK_PDFS = getPDFsByCategory('surrender-framework');
export const LEGACY_PDFS = getPDFsByCategory('legacy');
export const LEADERSHIP_PDFS = getPDFsByCategory('leadership');

// Type-specific collections
export const WORKSHEET_PDFS = getPDFsByType('worksheet');
export const FRAMEWORK_PDFS = getPDFsByType('framework');
export const ASSESSMENT_PDFS = getPDFsByType('assessment');

// -----------------------------------------------------------------------------
// REACT HOOKS READY UTILITIES (For frontend integration)
// -----------------------------------------------------------------------------

export function usePDFRegistry() {
  // This would be implemented as a React hook in your components
  return {
    allPDFs: ALL_PDF_ITEMS,
    getPDF: getPDFItemById,
    search: searchPDFs,
    stats: getPDFStats(),
    categories: CATEGORIES,
    tiers: PDF_TIERS,
    types: PDF_TYPES
  };
}

export function createPDFCardData(pdfId: string) {
  const pdf = getPDFItemById(pdfId);
  if (!pdf) return null;
  
  return {
    title: pdf.title,
    description: pdf.excerpt || pdf.description,
    downloadUrl: getDownloadUrl(pdfId, 'tracked'),
    previewUrl: getPreviewUrl(pdfId),
    fileSize: pdf.fileSize,
    type: PDF_TYPES[pdf.type as PDFType] || pdf.type,
    tier: PDF_TIERS[pdf.tier as PDFTier] || pdf.tier,
    category: CATEGORIES[pdf.category as keyof typeof CATEGORIES] || pdf.category,
    tags: pdf.tags,
    isInteractive: pdf.isInteractive,
    isFillable: pdf.isFillable,
    requiresAuth: pdf.requiresAuth,
    lastModified: pdf.lastModified
  };
}

// -----------------------------------------------------------------------------
// SERVER-SIDE GENERATION HELPERS (For build time)
// -----------------------------------------------------------------------------

export async function generateMissingPDFAssets(): Promise<Array<{
  id: string;
  success: boolean;
  error?: string;
  generatedPath?: string;
  timeMs?: number;
}>> {
  const missingPDFs = getPDFsRequiringGeneration();
  const results: Array<{
    id: string;
    success: boolean;
    error?: string;
    generatedPath?: string;
    timeMs?: number;
  }> = [];
  
  for (const pdf of missingPDFs) {
    const startTime = Date.now();
    
    try {
      // In production, this would call your PDF generation service
      console.log(`Generating PDF: ${pdf.title}`);
      
      // Simulate generation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        id: pdf.id,
        success: true,
        generatedPath: pdf.outputPath,
        timeMs: Date.now() - startTime
      });
      
    } catch (error) {
      results.push({
        id: pdf.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

// -----------------------------------------------------------------------------
// INITIALIZATION & HEALTH CHECK
// -----------------------------------------------------------------------------

export function initializePDFRegistry(): { success: boolean; message: string } {
  const validation = validateRegistry();
  
  if (!validation.valid) {
    console.error('PDF Registry validation failed:', validation.errors);
    return {
      success: false,
      message: `Registry validation failed: ${validation.errors.length} errors`
    };
  }
  
  // Pre-cache for optimal performance
  getAllPDFs();
  getAllPDFItems();
  
  const stats = getPDFStats();
  
  console.log(`✅ PDF Registry initialized with ${stats.total} assets`);
  console.log(`   Available: ${stats.available}`);
  console.log(`   Interactive: ${stats.interactive}`);
  console.log(`   Fillable: ${stats.fillable}`);
  console.log(`   Preload: ${stats.preload}`);
  
  return {
    success: true,
    message: `Registry ready with ${stats.total} PDF assets`
  };
}

// Auto-initialize on import in production
if (typeof window === 'undefined') {
  initializePDFRegistry();
}
=======
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
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
