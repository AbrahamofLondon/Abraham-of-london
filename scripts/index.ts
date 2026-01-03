/**
 * ABRAHAM OF LONDON: INSTITUTIONAL SCRIPT EXPORTS
 * Unified entry point for registry, discovery, and generation logic.
 * 
 * @version 1.1.0
 * @category PDF-Management
 */

/* -------------------------------------------------------------------------- */
/* TYPES & INTERFACES                                                         */
/* -------------------------------------------------------------------------- */

export type { 
  PDFConfig, 
  PDFId
} from './pdf-registry';

export type { 
  GenerationOptions,
  PageDimensions,
  CanvasSection
} from './generate-legacy-canvas';

/* -------------------------------------------------------------------------- */
/* REGISTRY & DISCOVERY                                                       */
/* -------------------------------------------------------------------------- */

export {
  // Core registry
  PDF_REGISTRY,
  getPDFRegistry,
  getPDFById,
  getAllPDFs,
  
  // Filtered accessors
  getPDFsByTier,
  getPDFsByType,
  getInteractivePDFs,
  getFillablePDFs,
  
  // Discovery & validation
  scanForDynamicAssets,
  getPDFsRequiringGeneration,
  needsRegeneration,
  
  // Generation utilities
  generateMissingPDFs
} from './pdf-registry';

/* -------------------------------------------------------------------------- */
/* GENERATORS & PIPELINES                                                     */
/* -------------------------------------------------------------------------- */

// Legacy Canvas Generator
export {
  LegacyCanvasGenerator,
  generateLegacyCanvasProduction
} from './generate-legacy-canvas';

// PDF Generation Pipeline
export {
  PDFGenerationPipeline,
  generateSinglePDF,
  generatePDFBatch,
  validatePDFConfigs,
  getGenerationReport
} from './generate-pdfs';

/* -------------------------------------------------------------------------- */
/* UTILITIES & HELPERS                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Resolve file metadata from filename
 */
export function resolveFileMetadata(filename: string): {
  format: 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';
  isInteractive: boolean;
  isFillable: boolean;
  type: 'editorial' | 'framework' | 'academic' | 'strategic' | 'tool' | 'canvas' | 'worksheet' | 'other';
} {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const name = filename.toLowerCase();
  
  // Determine format
  let format: any = 'BINARY';
  if (ext === 'pdf') format = 'PDF';
  if (['xlsx', 'xls', 'csv'].includes(ext)) format = 'EXCEL';
  if (['pptx', 'ppt'].includes(ext)) format = 'POWERPOINT';
  if (ext === 'zip') format = 'ZIP';
  
  // Determine interactivity
  const isFillable = name.includes('-fillable') || name.includes('-canvas');
  const isInteractive = isFillable || name.includes('-form') || name.includes('-worksheet');
  
  // Determine type
  let type: any = 'other';
  if (name.includes('canvas') || name.includes('template')) {
    type = 'canvas';
  } else if (name.includes('worksheet') || name.includes('checklist')) {
    type = 'worksheet';
  } else if (name.includes('framework') || name.includes('model')) {
    type = 'framework';
  } else if (name.includes('guide') || name.includes('manual')) {
    type = 'strategic';
  } else if (name.includes('editorial') || name.includes('article')) {
    type = 'editorial';
  } else if (name.includes('academic') || name.includes('research')) {
    type = 'academic';
  } else if (name.includes('tool') || name.includes('utility')) {
    type = 'tool';
  }
  
  return { format, isInteractive, isFillable, type };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if user has access to PDF based on tier
 */
export function hasAccessToPDF(
  userTier: 'free' | 'member' | 'architect' | 'inner-circle',
  pdfTier: 'free' | 'member' | 'architect' | 'inner-circle'
): boolean {
  const tierHierarchy = {
    'free': 0,
    'member': 1,
    'architect': 2,
    'inner-circle': 3
  };
  
  return tierHierarchy[userTier] >= tierHierarchy[pdfTier];
}

/**
 * Get PDF download URL with authentication check
 */
export function getPDFDownloadUrl(
  pdfId: string,
  userId?: string,
  userTier?: string
): { url: string; requiresAuth: boolean; accessGranted: boolean } {
  const pdf = getPDFById(pdfId);
  
  if (!pdf) {
    throw new Error(`PDF with ID "${pdfId}" not found`);
  }
  
  const requiresAuth = pdf.requiresAuth;
  const accessGranted = !requiresAuth || 
    (userId && userTier && hasAccessToPDF(userTier as any, pdf.tier));
  
  return {
    url: pdf.outputPath,
    requiresAuth,
    accessGranted
  };
}

/**
 * Generate export metadata for external consumption
 */
export function generatePDFManifest(): {
  version: string;
  generatedAt: string;
  count: number;
  pdfs: Array<{
    id: string;
    title: string;
    type: string;
    tier: string;
    path: string;
    size?: string;
    interactive: boolean;
    fillable: boolean;
    requiresAuth: boolean;
  }>;
} {
  const allPDFs = getAllPDFs();
  const now = new Date().toISOString();
  
  return {
    version: '1.1.0',
    generatedAt: now,
    count: allPDFs.length,
    pdfs: allPDFs.map(pdf => ({
      id: pdf.id,
      title: pdf.title,
      type: pdf.type,
      tier: pdf.tier,
      path: pdf.outputPath,
      size: pdf.fileSize ? formatFileSize(pdf.fileSize) : undefined,
      interactive: pdf.isInteractive,
      fillable: pdf.isFillable,
      requiresAuth: pdf.requiresAuth
    }))
  };
}

/* -------------------------------------------------------------------------- */
/* CLI INTERFACE                                                              */
/* -------------------------------------------------------------------------- */

/**
 * CLI command handler for running scripts from npm
 */
export async function handleCLICommand(args: string[] = []): Promise<void> {
  const command = args[0];
  
  switch (command) {
    case 'list':
    case '--list':
    case '-l':
      const allPDFs = getAllPDFs();
      console.log('📚 PDF REGISTRY:\n');
      console.log(`Total PDFs: ${allPDFs.length}\n`);
      
      allPDFs.forEach(pdf => {
        const status = pdf.exists ? '✅' : '❌';
        const size = pdf.fileSize ? formatFileSize(pdf.fileSize) : 'N/A';
        console.log(`${status} ${pdf.title}`);
        console.log(`   ID: ${pdf.id}`);
        console.log(`   Tier: ${pdf.tier} | Type: ${pdf.type}`);
        console.log(`   Interactive: ${pdf.isInteractive ? 'Yes' : 'No'}`);
        console.log(`   Size: ${size}`);
        console.log();
      });
      break;
      
    case 'scan':
    case '--scan':
    case '-s':
      console.log('🔍 Scanning for PDF assets...\n');
      const dynamicAssets = scanForDynamicAssets();
      
      console.log(`📊 Found ${dynamicAssets.length} dynamic assets:\n`);
      dynamicAssets.forEach(asset => {
        console.log(`• ${asset.title}`);
        console.log(`  ID: ${asset.id}`);
        console.log(`  Type: ${asset.type}`);
        console.log(`  Tier: ${asset.tier}`);
        console.log(`  Size: ${asset.fileSize ? formatFileSize(asset.fileSize) : 'Unknown'}`);
        console.log();
      });
      break;
      
    case 'generate':
    case '--generate':
    case '-g':
      console.log('🔄 Generating missing PDFs...\n');
      const results = await generateMissingPDFs();
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log('\n📊 Generation Results:');
      console.log(`✅ Successful: ${successful}`);
      console.log(`❌ Failed: ${failed}`);
      
      if (failed > 0) {
        console.log('\nFailed generations:');
        results.filter(r => !r.success).forEach(r => {
          console.log(`  • ${r.id}: ${r.error}`);
        });
      }
      break;
      
    case 'manifest':
    case '--manifest':
    case '-m':
      const manifest = generatePDFManifest();
      console.log(JSON.stringify(manifest, null, 2));
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log(`
📚 PDF Management System - CLI Commands:

  npm run pdfs:list       List all PDFs in registry
  npm run pdfs:scan       Scan for dynamic assets
  npm run pdfs:generate   Generate missing PDFs
  npm run pdfs:manifest   Generate JSON manifest
  npm run pdfs:help       Show this help message

📋 Programmatic Usage:

  import { 
    getPDFRegistry,
    getAllPDFs,
    PDFGenerationPipeline,
    LegacyCanvasGenerator
  } from '@/scripts';

  // Get all PDFs
  const pdfs = getAllPDFs();
  
  // Generate PDFs
  const pipeline = new PDFGenerationPipeline();
  await pipeline.generateAll();
  
  // Generate legacy canvas
  const generator = new LegacyCanvasGenerator();
  await generator.generateAllFormats();

📁 Available Exports:
  • PDF_REGISTRY, getPDFRegistry, getPDFById, getAllPDFs
  • getPDFsByTier, getPDFsByType, getInteractivePDFs
  • PDFGenerationPipeline, LegacyCanvasGenerator
  • generateMissingPDFs, scanForDynamicAssets
  • resolveFileMetadata, formatFileSize, hasAccessToPDF
      `);
      break;
      
    default:
      console.log('Unknown command. Use --help for available commands.');
      break;
  }
}

/* -------------------------------------------------------------------------- */
/* TYPE RE-EXPORTS FOR CONVENIENCE                                            */
/* -------------------------------------------------------------------------- */

// Re-export common types
export type PDFType = 'editorial' | 'framework' | 'academic' | 'strategic' | 'tool' | 'canvas' | 'worksheet' | 'other';
export type PDFTier = 'free' | 'member' | 'architect' | 'inner-circle';
export type PDFFormat = 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORT (SINGLE EXPORT)                                             */
/* -------------------------------------------------------------------------- */

export default {
  // Registry
  PDF_REGISTRY,
  getPDFRegistry,
  getPDFById,
  getAllPDFs,
  
  // Generators
  LegacyCanvasGenerator,
  PDFGenerationPipeline,
  
  // Utilities
  resolveFileMetadata,
  formatFileSize,
  hasAccessToPDF,
  getPDFDownloadUrl,
  generatePDFManifest,
  
  // CLI
  handleCLICommand
};