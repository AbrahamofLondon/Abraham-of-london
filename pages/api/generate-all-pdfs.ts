import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LegacyCanvasGenerator } from '../../scripts/generate-legacy-canvas.tsx'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// TYPES & SCHEMAS (Institutional Grade)
// -----------------------------------------------------------------------------
export interface PDFConfig {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;
  generationScript?: string;
  sourcePath?: string;
  // Categorization expanded for ranged formats
  type: 'editorial' | 'framework' | 'academic' | 'strategic' | 'tool' | 'canvas' | 'worksheet' | 'other';
  format: 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';
  isInteractive: boolean; // True for fillable PDFs
  isFillable: boolean; // Specific fillable forms
  category: string;
  tier: 'free' | 'member' | 'architect' | 'inner-circle';
  formats: ('A4' | 'Letter' | 'A3' | 'bundle')[];
  fileSize?: number;
  lastModified?: Date;
  exists: boolean;
  sourceType: 'static' | 'dynamic' | 'generated';
  tags: string[];
  requiresAuth: boolean;
}

export type PDFId = string;

// -----------------------------------------------------------------------------
// MASTER CONFIGURATION REGISTRY
// -----------------------------------------------------------------------------
const MASTER_PDF_REGISTRY = {
  // Legacy Architecture Canvas (Premium Interactive)
  'legacy-architecture-canvas': {
    title: 'The Legacy Architecture Canvas',
    description: 'Heirloom-grade fillable PDF for designing sovereign legacies',
    excerpt: 'The foundational instrument for designing a sovereign legacy. Move beyond sentiment to architect the durable transmission of values, capital, and culture.',
    outputPath: '/assets/downloads/legacy-architecture-canvas.pdf',
    generationScript: 'scripts/generate-legacy-canvas.tsx',
    sourcePath: 'content/downloads/legacy-architecture-canvas.mdx',
    type: 'canvas' as const,
    category: 'legacy',
    isInteractive: true,
    isFillable: true,
    tier: 'architect' as const,
    formats: ['A4', 'Letter', 'A3', 'bundle'],
    requiresAuth: true,
    tags: ['legacy', 'governance', 'family', 'formation', 'architecture']
  },

  // Featured Publications
  'ultimate-purpose-of-man': {
    title: 'The Ultimate Purpose of Man',
    description: 'Definitive editorial examining the structural logic of human purpose.',
    outputPath: '/assets/downloads/ultimate-purpose-of-man-premium.pdf',
    generationScript: 'scripts/generate-standalone-pdf.tsx',
    type: 'editorial' as const,
    category: 'theology',
    isInteractive: false,
    isFillable: false,
    tier: 'member' as const,
    formats: ['A4'],
    requiresAuth: false,
    tags: ['purpose', 'philosophy', 'theology', 'existence']
  },
  
  'strategic-foundations': {
    title: 'Strategic Foundations',
    description: 'Core frameworks for institutional thinking and leadership.',
    outputPath: '/assets/downloads/strategic-foundations.pdf',
    generationScript: 'scripts/generate-frameworks-pdf.tsx',
    type: 'framework' as const,
    category: 'leadership',
    isInteractive: false,
    isFillable: false,
    tier: 'member' as const,
    formats: ['A4', 'Letter'],
    requiresAuth: false,
    tags: ['strategy', 'leadership', 'foundations', 'principles']
  }
} as const;

// -----------------------------------------------------------------------------
// FORMAT ROUTING UTILITY
// -----------------------------------------------------------------------------
function resolveFileMeta(filename: string): { 
  format: PDFConfig['format']; 
  isInteractive: boolean;
  isFillable: boolean;
} {
  const ext = path.extname(filename).toLowerCase();
  const name = filename.toLowerCase();
  
  const isFillable = name.includes('-fillable') || name.includes('-canvas');
  const isInteractive = isFillable || name.includes('-form') || name.includes('-worksheet');
  
  let format: PDFConfig['format'] = 'BINARY';
  if (ext === '.pdf') format = 'PDF';
  if (['.xlsx', '.xls', '.csv'].includes(ext)) format = 'EXCEL';
  if (['.pptx', '.ppt'].includes(ext)) format = 'POWERPOINT';
  if (ext === '.zip') format = 'ZIP';

  return { format, isInteractive, isFillable };
}

// -----------------------------------------------------------------------------
// DISCOVERY ENGINE: Scan for Dynamic Assets
// -----------------------------------------------------------------------------
function scanForDynamicAssets(): PDFConfig[] {
  const downloadsDir = path.resolve(process.cwd(), 'public/assets/downloads');
  const discovered: PDFConfig[] = [];
  
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
    return discovered;
  }

  const files = fs.readdirSync(downloadsDir);
  files.forEach(filename => {
    // Ignore system files and source mdx
    if (filename.startsWith('.') || filename.endsWith('.mdx')) return;

    const filePath = path.join(downloadsDir, filename);
    const stats = fs.statSync(filePath);
    const { format, isInteractive, isFillable } = resolveFileMeta(filename);
    
    // Normalize ID: remove extension and interactive suffixes for logic pairing
    const fileId = filename
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/(-fillable|-\d+\.\d+\.\d+)$/, "");

    // Check if this file is already defined in master registry
    const isMasterDefined = Object.keys(MASTER_PDF_REGISTRY).some(key => 
      filename.includes(key.replace(/-/g, ''))
    );

    if (!isMasterDefined) {
      // Determine type based on filename patterns
      let type: PDFConfig['type'] = 'other';
      const lowerName = filename.toLowerCase();
      
      if (lowerName.includes('canvas') || lowerName.includes('template')) {
        type = 'canvas';
      } else if (lowerName.includes('worksheet') || lowerName.includes('checklist')) {
        type = 'worksheet';
      } else if (lowerName.includes('framework') || lowerName.includes('model')) {
        type = 'framework';
      } else if (lowerName.includes('guide') || lowerName.includes('manual')) {
        type = 'strategic';
      }

      // Determine tier based on naming patterns
      let tier: PDFConfig['tier'] = 'free';
      if (lowerName.includes('premium') || lowerName.includes('architect')) {
        tier = 'architect';
      } else if (lowerName.includes('member') || lowerName.includes('inner')) {
        tier = 'member';
      }

      discovered.push({
        id: fileId,
        title: fileId
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
          .replace(/\b(Pdf|Excel|Ppt)\b/gi, match => match.toUpperCase()),
        description: `Archive Document: ${filename}`,
        outputPath: `/assets/downloads/${filename}`,
        type,
        format,
        isInteractive,
        isFillable,
        category: 'archive',
        tier,
        formats: ['A4'], // Default for discovered files
        fileSize: stats.size,
        lastModified: stats.mtime,
        exists: true,
        sourceType: 'dynamic',
        tags: ['discovered', type],
        requiresAuth: tier !== 'free'
      });
    }
  });
  
  return discovered;
}

// -----------------------------------------------------------------------------
// VALIDATION: Check if generation is needed
// -----------------------------------------------------------------------------
function needsRegeneration(config: any, existingStats?: fs.Stats): boolean {
  if (!config.generationScript) return false;
  
  const scriptPath = path.resolve(process.cwd(), config.generationScript);
  if (!fs.existsSync(scriptPath)) return false;

  if (!existingStats) return true; // File doesn't exist

  // Check if source file is newer than generated file
  if (config.sourcePath) {
    const sourcePath = path.resolve(process.cwd(), config.sourcePath);
    if (fs.existsSync(sourcePath)) {
      const sourceStats = fs.statSync(sourcePath);
      return sourceStats.mtime > existingStats.mtime;
    }
  }

  // Regenerate if older than 7 days for dynamic content
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return existingStats.mtime < weekAgo;
}

// -----------------------------------------------------------------------------
// PUBLIC ACCESSORS (EXPLICIT EXPORTS)
// -----------------------------------------------------------------------------
export function getPDFRegistry(): Record<PDFId, PDFConfig> {
  const registry: Record<PDFId, PDFConfig> = {};
  
  // 1. Load Master Configurations
  Object.entries(MASTER_PDF_REGISTRY).forEach(([id, config]) => {
    const fullPath = path.resolve(process.cwd(), 'public', config.outputPath.replace(/^\//, ''));
    const exists = fs.existsSync(fullPath);
    const stats = exists ? fs.statSync(fullPath) : null;
    const { format, isInteractive, isFillable } = resolveFileMeta(config.outputPath);

    // Check if regeneration is needed
    const shouldRegenerate = needsRegeneration(config, stats || undefined);

    registry[id] = { 
      id, 
      ...config,
      format,
      isInteractive,
      isFillable,
      fileSize: stats?.size, 
      lastModified: stats?.mtime, 
      exists: exists && !shouldRegenerate, 
      sourceType: 'static',
      tags: config.tags || []
    };
  });
  
  // 2. Blend with Dynamic Multi-Format Discoveries
  scanForDynamicAssets().forEach(asset => { 
    if (!registry[asset.id]) {
      registry[asset.id] = asset;
    } else {
      // Update existing with dynamic data
      registry[asset.id] = {
        ...registry[asset.id],
        fileSize: asset.fileSize,
        lastModified: asset.lastModified,
        exists: asset.exists
      };
    }
  });

  return registry;
}

export function getPDFById(id: string): PDFConfig | null {
  return getPDFRegistry()[id] || null;
}

export function getAllPDFs(): PDFConfig[] {
  // Sort by tier, then type, then title
  return Object.values(getPDFRegistry())
    .filter(asset => asset.exists)
    .sort((a, b) => {
      // Tier order: architect > member > free
      const tierOrder = { architect: 0, 'inner-circle': 1, member: 2, free: 3 };
      const tierDiff = (tierOrder[a.tier] || 4) - (tierOrder[b.tier] || 4);
      if (tierDiff !== 0) return tierDiff;
      
      // Type order: canvas > framework > strategic > editorial > worksheet > other
      const typeOrder = { 
        canvas: 0, framework: 1, strategic: 2, 
        editorial: 3, academic: 4, worksheet: 5, other: 6 
      };
      const typeDiff = (typeOrder[a.type] || 7) - (typeOrder[b.type] || 7);
      if (typeDiff !== 0) return typeDiff;
      
      return a.title.localeCompare(b.title);
    });
}

export function getPDFsByTier(tier: PDFConfig['tier']): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.tier === tier);
}

export function getPDFsByType(type: PDFConfig['type']): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.type === type);
}

export function getInteractivePDFs(): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.isInteractive);
}

export function getFillablePDFs(): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.isFillable);
}

export function getPDFsRequiringGeneration(): PDFConfig[] {
  const registry = getPDFRegistry();
  return Object.values(registry).filter(pdf => 
    pdf.generationScript && (!pdf.exists || needsRegeneration(pdf, pdf.lastModified ? { mtime: pdf.lastModified } as fs.Stats : undefined))
  );
}

export const PDF_REGISTRY = getPDFRegistry();

// -----------------------------------------------------------------------------
// UTILITIES FOR GENERATION PIPELINE
// -----------------------------------------------------------------------------
export async function generateMissingPDFs(): Promise<Array<{id: string; success: boolean; error?: string}>> {
  const results = [];
  const pdfsToGenerate = getPDFsRequiringGeneration();
  
  console.log(`📊 Found ${pdfsToGenerate.length} PDFs requiring generation`);
  
  for (const pdf of pdfsToGenerate) {
    try {
      console.log(`🚀 Generating: ${pdf.title}`);
      
      if (pdf.id === 'legacy-architecture-canvas') {
        // Special handling for legacy canvas
        const { LegacyCanvasGenerator } = await import('./generate-legacy-canvas.tsx');
        const generator = new LegacyCanvasGenerator();
        
        // Generate all formats
        for (const format of pdf.formats) {
          if (format !== 'bundle') {
            const pdfBytes = await generator.generate({
              format,
              includeWatermark: true,
              isPreview: false
            });
            
            const outputPath = path.resolve(
              process.cwd(), 
              'public/assets/downloads',
              `legacy-architecture-canvas-${format.toLowerCase()}.pdf`
            );
            
            fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
            console.log(`✅ Generated ${format} format`);
          }
        }
        
        results.push({ id: pdf.id, success: true });
        
      } else if (pdf.generationScript) {
        // Standard generation via script
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        const scriptPath = path.resolve(process.cwd(), pdf.generationScript);
        const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        const command = `${npxCmd} tsx ${scriptPath}`;
        
        await execAsync(command, {
          cwd: process.cwd(),
          env: { ...process.env, PDF_ID: pdf.id, NODE_OPTIONS: '--max-old-space-size=4096' },
          timeout: 300000
        });
        
        results.push({ id: pdf.id, success: true });
      }
      
    } catch (error: any) {
      console.error(`❌ Failed to generate ${pdf.id}:`, error.message);
      results.push({ 
        id: pdf.id, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return results;
}

// -----------------------------------------------------------------------------
// CLI INTERFACE
// -----------------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  
  if (args.includes('--scan') || args.includes('--discover')) {
    console.log('🔍 Scanning for PDF assets...\n');
    const dynamicAssets = scanForDynamicAssets();
    
    console.log(`📊 Found ${dynamicAssets.length} dynamic assets:\n`);
    dynamicAssets.forEach(asset => {
      console.log(`• ${asset.title}`);
      console.log(`  ID: ${asset.id}`);
      console.log(`  Type: ${asset.type}`);
      console.log(`  Tier: ${asset.tier}`);
      console.log(`  Size: ${asset.fileSize ? (asset.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown'}`);
      console.log();
    });
    
  } else if (args.includes('--list')) {
    console.log('📚 PDF REGISTRY:\n');
    const allPDFs = getAllPDFs();
    
    console.log(`Total PDFs: ${allPDFs.length}\n`);
    
    allPDFs.forEach(pdf => {
      const status = pdf.exists ? '✅' : '❌';
      const size = pdf.fileSize ? `${(pdf.fileSize / 1024).toFixed(1)} KB` : 'N/A';
      console.log(`${status} ${pdf.title}`);
      console.log(`   ID: ${pdf.id}`);
      console.log(`   Tier: ${pdf.tier} | Type: ${pdf.type}`);
      console.log(`   Interactive: ${pdf.isInteractive ? 'Yes' : 'No'}`);
      console.log(`   Size: ${size}`);
      console.log();
    });
    
  } else if (args.includes('--generate-missing')) {
    console.log('🔄 Generating missing PDFs...\n');
    generateMissingPDFs().then(results => {
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
      
      process.exit(failed > 0 ? 1 : 0);
    });
    
  } else {
    // Default: Show registry summary
    const registry = getPDFRegistry();
    const allPDFs = getAllPDFs();
    const missing = Object.values(registry).filter(pdf => !pdf.exists);
    
    console.log('📊 PDF REGISTRY STATUS\n');
    console.log(`Total configured: ${Object.keys(registry).length}`);
    console.log(`Available: ${allPDFs.length}`);
    console.log(`Missing: ${missing.length}`);
    
    if (missing.length > 0) {
      console.log('\n❌ Missing PDFs:');
      missing.forEach(pdf => {
        console.log(`  • ${pdf.title} (${pdf.id})`);
        if (pdf.generationScript) {
          console.log(`    To generate: npm run pdfs:single=${pdf.id}`);
        }
      });
    }
  }
}