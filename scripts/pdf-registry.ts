// scripts/pdf-registry.ts - FIXED VERSION
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  type: 'editorial' | 'framework' | 'academic' | 'strategic' | 'tool' | 'canvas' | 'worksheet' | 'other';
  format: 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';
  isInteractive: boolean;
  isFillable: boolean;
  category: string;
  tier: 'free' | 'member' | 'architect' | 'inner-circle';
  formats: ('A4' | 'Letter' | 'A3' | 'bundle')[];
  fileSize?: number;
  lastModified?: Date;
  exists: boolean;
  sourceType: 'static' | 'dynamic' | 'generated';
  tags: string[];
  requiresAuth: boolean;
  version?: string;
}

export type PDFId = string;

// -----------------------------------------------------------------------------
// MASTER CONFIGURATION REGISTRY
// -----------------------------------------------------------------------------
const MASTER_PDF_REGISTRY: Record<string, Omit<PDFConfig, 'id' | 'format' | 'isInteractive' | 'isFillable' | 'fileSize' | 'lastModified' | 'exists' | 'sourceType'>> = {
  'legacy-architecture-canvas': {
    title: 'The Legacy Architecture Canvas',
    description: 'Heirloom-grade fillable PDF for designing sovereign legacies',
    excerpt: 'The foundational instrument for designing a sovereign legacy. Move beyond sentiment to architect the durable transmission of values, capital, and culture.',
    outputPath: '/assets/downloads/legacy-architecture-canvas.pdf',
    generationScript: './scripts/generate-legacy-canvas.tsx',
    sourcePath: 'content/downloads/legacy-architecture-canvas.mdx',
    type: 'canvas',
    category: 'legacy',
    tier: 'architect',
    formats: ['A4', 'Letter', 'A3', 'bundle'],
    requiresAuth: true,
    tags: ['legacy', 'governance', 'family', 'formation', 'architecture'],
    version: '1.0.0'
  },
  'ultimate-purpose-of-man': {
    title: 'The Ultimate Purpose of Man',
    description: 'Definitive editorial examining the structural logic of human purpose.',
    outputPath: '/assets/downloads/ultimate-purpose-of-man-premium.pdf',
    generationScript: './scripts/generate-standalone-pdf.tsx',
    type: 'editorial',
    category: 'theology',
    tier: 'member',
    formats: ['A4'],
    requiresAuth: false,
    tags: ['purpose', 'philosophy', 'theology', 'existence'],
    version: '1.0.0'
  },
  'strategic-foundations': {
    title: 'Strategic Foundations',
    description: 'Core frameworks for institutional thinking and leadership.',
    outputPath: '/assets/downloads/strategic-foundations.pdf',
    generationScript: './scripts/generate-frameworks-pdf.tsx',
    type: 'framework',
    category: 'leadership',
    tier: 'member',
    formats: ['A4', 'Letter'],
    requiresAuth: false,
    tags: ['strategy', 'leadership', 'foundations', 'principles'],
    version: '1.0.0'
  }
};

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
export function scanForDynamicAssets(): PDFConfig[] {
  const downloadsDir = path.resolve(process.cwd(), 'public/assets/downloads');
  const discovered: PDFConfig[] = [];
  
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
    return discovered;
  }

  const files = fs.readdirSync(downloadsDir);
  
  for (const filename of files) {
    if (filename.startsWith('.') || filename.endsWith('.mdx')) continue;

    const filePath = path.join(downloadsDir, filename);
    let stats: fs.Stats;
    
    try {
      stats = fs.statSync(filePath);
    } catch (error) {
      console.warn(`Could not stat file ${filename}:`, error);
      continue;
    }
    
    const { format, isInteractive, isFillable } = resolveFileMeta(filename);
    const fileId = filename
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/(-fillable|-\d+\.\d+\.\d+)$/, "");

    const isMasterDefined = Object.keys(MASTER_PDF_REGISTRY).some(key => 
      filename.includes(key.replace(/-/g, ''))
    );

    if (!isMasterDefined) {
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
      } else if (lowerName.includes('editorial') || lowerName.includes('article')) {
        type = 'editorial';
      } else if (lowerName.includes('academic') || lowerName.includes('research')) {
        type = 'academic';
      } else if (lowerName.includes('tool') || lowerName.includes('utility')) {
        type = 'tool';
      }

      let tier: PDFConfig['tier'] = 'free';
      if (lowerName.includes('premium') || lowerName.includes('architect') || lowerName.includes('pro')) {
        tier = 'architect';
      } else if (lowerName.includes('member') || lowerName.includes('inner') || lowerName.includes('plus')) {
        tier = 'member';
      }

      discovered.push({
        id: fileId,
        title: fileId
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase())
          .replace(/\b(Pdf|Excel|Ppt)\b/gi, (match: string) => match.toUpperCase()),
        description: `Archive Document: ${filename}`,
        outputPath: `/assets/downloads/${filename}`,
        type,
        format,
        isInteractive,
        isFillable,
        category: 'archive',
        tier,
        formats: ['A4'],
        fileSize: stats.size,
        lastModified: stats.mtime,
        exists: true,
        sourceType: 'dynamic',
        tags: ['discovered', type],
        requiresAuth: tier !== 'free'
      });
    }
  }
  
  return discovered;
}

// -----------------------------------------------------------------------------
// VALIDATION: Check if generation is needed
// -----------------------------------------------------------------------------
export function needsRegeneration(config: PDFConfig, existingStats?: fs.Stats): boolean {
  if (!config.generationScript) return false;
  
  const scriptPath = path.resolve(process.cwd(), config.generationScript);
  if (!fs.existsSync(scriptPath)) {
    console.warn(`Generation script not found: ${scriptPath}`);
    return false;
  }

  if (!existingStats) return true;

  if (config.sourcePath) {
    const sourcePath = path.resolve(process.cwd(), config.sourcePath);
    if (fs.existsSync(sourcePath)) {
      const sourceStats = fs.statSync(sourcePath);
      return sourceStats.mtime > existingStats.mtime;
    }
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return existingStats.mtime < weekAgo;
}

// -----------------------------------------------------------------------------
// PUBLIC ACCESSORS (EXPLICIT EXPORTS)
// -----------------------------------------------------------------------------
export function getPDFRegistry(): Record<PDFId, PDFConfig> {
  const registry: Record<PDFId, PDFConfig> = {};
  
  Object.entries(MASTER_PDF_REGISTRY).forEach(([id, config]) => {
    const fullPath = path.resolve(process.cwd(), 'public', config.outputPath.replace(/^\//, ''));
    const exists = fs.existsSync(fullPath);
    const stats = exists ? fs.statSync(fullPath) : null;
    const { format, isInteractive, isFillable } = resolveFileMeta(config.outputPath);
    const shouldRegenerate = needsRegeneration({ 
      id, 
      ...config, 
      format, 
      isInteractive, 
      isFillable, 
      exists, 
      sourceType: 'static',
      tags: config.tags || [],
      category: config.category || '',
      tier: config.tier || 'free',
      formats: config.formats || ['A4'],
      requiresAuth: config.requiresAuth || false,
      version: config.version || '1.0.0'
    }, stats || undefined);

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
      tags: config.tags || [],
      category: config.category || '',
      tier: config.tier || 'free',
      formats: config.formats || ['A4'],
      requiresAuth: config.requiresAuth || false,
      version: config.version || '1.0.0'
    };
  });
  
  const discoveredAssets = scanForDynamicAssets();
  for (const asset of discoveredAssets) { 
    if (!registry[asset.id]) {
      registry[asset.id] = asset;
    } else {
      registry[asset.id] = {
        ...registry[asset.id],
        fileSize: asset.fileSize,
        lastModified: asset.lastModified,
        exists: asset.exists
      };
    }
  }

  return registry;
}

export function getPDFById(id: string): PDFConfig | null {
  return getPDFRegistry()[id] || null;
}

export function getAllPDFs(): PDFConfig[] {
  return Object.values(getPDFRegistry())
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
    pdf.generationScript && (!pdf.exists || needsRegeneration(pdf, pdf.lastModified ? { 
      mtime: pdf.lastModified,
      size: pdf.fileSize || 0,
      isFile: () => true,
      isDirectory: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isSymbolicLink: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      dev: 0,
      ino: 0,
      mode: 0,
      nlink: 0,
      uid: 0,
      gid: 0,
      rdev: 0,
      blksize: 0,
      blocks: 0,
      atimeMs: 0,
      mtimeMs: pdf.lastModified.getTime(),
      ctimeMs: 0,
      birthtimeMs: 0,
      atime: pdf.lastModified,
      ctime: pdf.lastModified,
      birthtime: pdf.lastModified
    } as fs.Stats : undefined))
  );
}

export const PDF_REGISTRY = getPDFRegistry();

// -----------------------------------------------------------------------------
// GENERATION PIPELINE (SERVER-SIDE ONLY)
// -----------------------------------------------------------------------------
export async function generateMissingPDFs(): Promise<Array<{id: string; success: boolean; error?: string; duration?: number}>> {
  // Only run on server
  if (typeof window !== 'undefined') {
    return [];
  }

  const results: Array<{id: string; success: boolean; error?: string; duration?: number}> = [];
  const pdfsToGenerate = getPDFsRequiringGeneration();
  
  console.log(`📊 Found ${pdfsToGenerate.length} PDFs requiring generation`);
  
  for (const pdf of pdfsToGenerate) {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Generating: ${pdf.title} (${pdf.id})`);
      
      if (pdf.id === 'legacy-architecture-canvas') {
        // Use dynamic import for ESM
        const module = await import('./generate-legacy-canvas.tsx');
        const generator = new module.LegacyCanvasGenerator();
        
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
            console.log(`  ✅ Generated ${format} format`);
          }
        }
        
        if (pdf.formats.includes('bundle')) {
          await generator.generateAllFormats();
        }
        
        const duration = Date.now() - startTime;
        results.push({ 
          id: pdf.id, 
          success: true,
          duration
        });
        
      } else if (pdf.generationScript) {
        // Use dynamic import for child_process
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        const scriptPath = path.resolve(process.cwd(), pdf.generationScript);
        
        if (!fs.existsSync(scriptPath)) {
          throw new Error(`Generation script not found: ${scriptPath}`);
        }
        
        // Use tsx directly without npx.cmd on Windows
        const command = `npx tsx "${scriptPath}"`;
        
        await execAsync(command, {
          cwd: process.cwd(),
          env: { 
            ...process.env, 
            PDF_ID: pdf.id
          },
          timeout: 300000
        });
        
        const duration = Date.now() - startTime;
        results.push({ 
          id: pdf.id, 
          success: true,
          duration
        });
      } else {
        throw new Error('No generation script specified');
      }
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to generate ${pdf.id}:`, error.message);
      results.push({ 
        id: pdf.id, 
        success: false, 
        error: error.message,
        duration
      });
    }
  }
  
  return results;
}

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------
export function getPDFStats() {
  const registry = getPDFRegistry();
  const allPDFs = Object.values(registry);
  
  return {
    total: allPDFs.length,
    available: allPDFs.filter(pdf => pdf.exists).length,
    missing: allPDFs.filter(pdf => !pdf.exists).length,
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

export function validatePDFRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const registry = getPDFRegistry();
  
  Object.entries(registry).forEach(([id, config]) => {
    if (!config.title) errors.push(`PDF ${id}: Missing title`);
    if (!config.outputPath) errors.push(`PDF ${id}: Missing outputPath`);
    
    if (!config.outputPath.startsWith('/')) {
      errors.push(`PDF ${id}: outputPath must start with / (got: ${config.outputPath})`);
    }
    
    if (config.generationScript) {
      const scriptPath = path.resolve(process.cwd(), config.generationScript);
      if (!fs.existsSync(scriptPath)) {
        errors.push(`PDF ${id}: Generation script not found: ${config.generationScript}`);
      }
    }
    
    const fullPath = path.resolve(process.cwd(), 'public', config.outputPath.replace(/^\//, ''));
    if (config.exists && !fs.existsSync(fullPath)) {
      errors.push(`PDF ${id}: Marked as exists but file not found: ${fullPath}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// -----------------------------------------------------------------------------
// CLI INTERFACE (SERVER-ONLY)
// -----------------------------------------------------------------------------
async function runCLI() {
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
    
    allPDFs.forEach((pdf, index) => {
      const status = pdf.exists ? '✅' : '❌';
      const size = pdf.fileSize ? `${(pdf.fileSize / 1024).toFixed(1)} KB` : 'N/A';
      const interactive = pdf.isInteractive ? 'Yes' : 'No';
      const fillable = pdf.isFillable ? 'Yes' : 'No';
      
      console.log(`${index + 1}. ${status} ${pdf.title}`);
      console.log(`   ID: ${pdf.id}`);
      console.log(`   Tier: ${pdf.tier} | Type: ${pdf.type} | Auth: ${pdf.requiresAuth ? 'Yes' : 'No'}`);
      console.log(`   Interactive: ${interactive} | Fillable: ${fillable}`);
      console.log(`   Size: ${size} | Path: ${pdf.outputPath}`);
      if (pdf.generationScript) console.log(`   Generator: ${pdf.generationScript}`);
      console.log();
    });
    
  } else if (args.includes('--generate-missing')) {
    console.log('🔄 Generating missing PDFs...\n');
    const results = await generateMissingPDFs();
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n📊 Generation Results:');
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total time: ${results.reduce((sum, r) => sum + (r.duration || 0), 0)}ms`);
    
    if (successful > 0) {
      console.log('\n✅ Successful generations:');
      results.filter(r => r.success).forEach(r => {
        console.log(`  • ${r.id} (${r.duration}ms)`);
      });
    }
    
    if (failed > 0) {
      console.log('\n❌ Failed generations:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  • ${r.id}: ${r.error}`);
      });
    }
    
    process.exit(failed > 0 ? 1 : 0);
    
  } else if (args.includes('--validate')) {
    console.log('🔍 Validating PDF registry...\n');
    const validation = validatePDFRegistry();
    
    if (validation.valid) {
      console.log('✅ Registry is valid!');
    } else {
      console.error('❌ Registry validation failed:');
      validation.errors.forEach(error => console.error(`  • ${error}`));
      process.exit(1);
    }
    
  } else if (args.includes('--stats')) {
    console.log('📊 PDF Registry Statistics:\n');
    const stats = getPDFStats();
    
    console.log(`Total Configured: ${stats.total}`);
    console.log(`Available: ${stats.available}`);
    console.log(`Missing: ${stats.missing}`);
    console.log(`Interactive: ${stats.interactive}`);
    console.log(`Fillable: ${stats.fillable}`);
    
    console.log('\nBy Tier:');
    console.log(`  Architect: ${stats.byTier.architect}`);
    console.log(`  Member: ${stats.byTier.member}`);
    console.log(`  Free: ${stats.byTier.free}`);
    
    console.log('\nBy Type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`);
      }
    });
    
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📚 PDF Registry Management

Commands:
  --scan, --discover     Scan for dynamic PDF assets
  --list                 List all PDFs in registry
  --generate-missing     Generate missing PDFs
  --validate            Validate registry configuration
  --stats               Show registry statistics
  --help, -h            Show this help message

Examples:
  npx tsx scripts/pdf-registry.ts --list
  npx tsx scripts/pdf-registry.ts --generate-missing
  npx tsx scripts/pdf-registry.ts --validate
    `);
    
  } else {
    const registry = getPDFRegistry();
    const allPDFs = getAllPDFs();
    const missing = Object.values(registry).filter(pdf => !pdf.exists);
    const stats = getPDFStats();
    
    console.log('📊 PDF REGISTRY STATUS\n');
    console.log(`Total configured: ${stats.total}`);
    console.log(`Available: ${stats.available}`);
    console.log(`Missing: ${stats.missing}`);
    console.log(`Interactive: ${stats.interactive}`);
    console.log(`Fillable: ${stats.fillable}`);
    
    if (missing.length > 0) {
      console.log('\n❌ Missing PDFs:');
      missing.forEach(pdf => {
        console.log(`  • ${pdf.title} (${pdf.id})`);
        if (pdf.generationScript) {
          console.log(`    To generate: npx tsx scripts/pdf-registry.ts --generate-missing`);
        }
      });
    }
    
    console.log('\n💡 Tip: Use --help for available commands');
  }
}

// Only run CLI if this is the main module (not imported)
if (import.meta.url && process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCLI().catch(console.error);
}