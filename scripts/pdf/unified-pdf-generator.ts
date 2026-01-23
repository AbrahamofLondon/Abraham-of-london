// scripts/pdf/unified-pdf-generator.ts - ENHANCED WITH CONTENT SCANNING
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import crypto from 'crypto';
import matter from 'gray-matter';
import os from 'os';
import { fileURLToPath } from 'url';

const program = new Command();

program
  .name('unified-pdf-generator')
  .description('Premium PDF generator for all tiers with content scanning & enhanced output')
  .version('2.0.0');

program
  .option('-t, --tier <tier>', 'Tier to generate (architect, member, free, all)', 'all')
  .option('-q, --quality <quality>', 'PDF quality (premium, enterprise, draft)', 'premium')
  .option('-f, --formats <formats>', 'Formats (A4,Letter,A3,bundle)', 'A4,Letter,A3')
  .option('-o, --output <output>', 'Output directory', './public/assets/downloads')
  .option('-c, --clean', 'Clean output before generation', false)
  .option('-v, --verbose', 'Verbose output', false)
  .option('--scan-content', 'Scan content/downloads for source files', false)
  .option('--scan-only', 'Only scan content, don\'t generate', false)
  .option('--skip-canvas', 'Skip legacy canvas generation', false)
  .option('--no-clean', 'Skip cleaning (safer)', false);

type Tier = 'architect' | 'member' | 'free' | 'all';
type Quality = 'premium' | 'enterprise' | 'draft';
type Format = 'A4' | 'Letter' | 'A3' | 'bundle';
type SourceKind = 'mdx' | 'md' | 'xlsx' | 'xls' | 'pptx' | 'ppt' | 'pdf';

interface GenerationOptions {
  tier: string;
  quality: Quality;
  formats: Format[];
  output: string;
  clean: boolean;
  verbose: boolean;
  scanContent: boolean;
  scanOnly: boolean;
  skipCanvas: boolean;
}

interface SourceFile {
  absPath: string;
  relPath: string;
  kind: SourceKind;
  baseName: string;
  mtimeMs: number;
  size: number;
  from: 'content/downloads' | 'lib/pdf';
}

interface ContentRegistryEntry {
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
  tier: Tier;
  formats: Format[];
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
  sourceKind?: SourceKind;
  needsGeneration: boolean;
}

class ContentScanner {
  static async discoverFiles(root: string, from: SourceFile["from"], recursive: boolean = true): Promise<SourceFile[]> {
    if (!fs.existsSync(root)) {
      console.warn(`\x1b[33m⚠️ Source directory does not exist: ${root}\x1b[0m`);
      return [];
    }

    const files: SourceFile[] = [];

    function walk(dir: string) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const absPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (recursive) walk(absPath);
            continue;
          }

          const ext = path.extname(entry.name).toLowerCase().replace('.', '');
          const kind = ext as SourceKind;
          
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
      } catch (error: any) {
        console.error(`\x1b[31m❌ Error scanning directory ${dir}: ${error.message}\x1b[0m`);
      }
    }

    walk(root);
    return files;
  }

  static extractMetadata(filePath: string, kind: SourceKind): Record<string, any> {
    try {
      if (kind === 'mdx' || kind === 'md') {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(content);
        return data || {};
      }
      const stats = fs.statSync(filePath);
      return {
        _fileSize: stats.size,
        _modified: new Date(stats.mtimeMs).toISOString(),
        _source: path.basename(filePath),
      };
    } catch (error: any) {
      console.warn(`\x1b[33m⚠️ Could not extract metadata from ${filePath}: ${error.message}\x1b[0m`);
      return {};
    }
  }

  static detectCategory(id: string, tags: string[] = [], metadata?: Record<string, any>): string {
    if (metadata?.category) return metadata.category;
    
    const tagCategories = ['legacy', 'leadership', 'theology', 'surrender-framework', 'personal-growth', 'organizational'];
    for (const tag of tags) {
      if (tagCategories.includes(tag.toLowerCase())) return tag;
    }
    
    const idLower = id.toLowerCase();
    if (idLower.includes('legacy') || idLower.includes('architecture')) return 'legacy';
    if (idLower.includes('leadership') || idLower.includes('management')) return 'leadership';
    if (idLower.includes('theology') || idLower.includes('scripture')) return 'theology';
    if (idLower.includes('personal') || idLower.includes('alignment')) return 'personal-growth';
    if (idLower.includes('board') || idLower.includes('organizational')) return 'organizational';
    if (idLower.includes('surrender') || idLower.includes('framework')) return 'surrender-framework';
    
    return 'downloads';
  }

  static detectTier(id: string, metadata?: Record<string, any>): Tier {
    if (metadata?.tier && ['architect', 'member', 'free'].includes(metadata.tier)) {
      return metadata.tier as Tier;
    }
    
    const idLower = id.toLowerCase();
    if (idLower.includes('premium') || idLower.includes('architect') || idLower.includes('inner-circle')) {
      return 'architect';
    }
    if (idLower.includes('member') || idLower.includes('pro')) {
      return 'member';
    }
    if (idLower.includes('free') || idLower.includes('public') || idLower.includes('basic')) {
      return 'free';
    }
    
    if (idLower.includes('legacy-architecture')) return 'architect';
    if (idLower.includes('canvas') || idLower.includes('framework')) return 'member';
    
    return 'free';
  }

  static generateId(baseName: string): string {
    return baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static sourceFileToRegistryEntry(sourceFile: SourceFile): ContentRegistryEntry {
    const id = ContentScanner.generateId(sourceFile.baseName);
    const metadata = ContentScanner.extractMetadata(sourceFile.absPath, sourceFile.kind);
    
    const tags = Array.isArray(metadata.tags) 
      ? metadata.tags 
      : (typeof metadata.tags === 'string' ? metadata.tags.split(',').map(t => t.trim()) : []);
    
    const category = ContentScanner.detectCategory(id, tags, metadata);
    const tier = ContentScanner.detectTier(id, metadata);
    
    const title = metadata.title || 
      sourceFile.baseName.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    const description = metadata.description || 
      metadata.excerpt || 
      `${title} - A resource from Abraham of London`;
    
    const outputPath = sourceFile.from === 'content/downloads'
      ? `/assets/downloads/content-downloads/${id}.pdf`
      : `/assets/downloads/lib-pdf/${id}.pdf`;
    
    const outputAbsPath = path.join(process.cwd(), 'public', outputPath);
    const pdfExists = fs.existsSync(outputAbsPath);
    
    let fileSize = '0 KB';
    if (pdfExists) {
      const stats = fs.statSync(outputAbsPath);
      fileSize = this.formatFileSize(stats.size);
    }
    
    let needsGeneration = !pdfExists;
    if (pdfExists && sourceFile.mtimeMs) {
      try {
        const pdfStats = fs.statSync(outputAbsPath);
        needsGeneration = sourceFile.mtimeMs > pdfStats.mtimeMs + 1000;
      } catch {
        needsGeneration = true;
      }
    }
    
    return {
      id,
      title,
      description,
      excerpt: metadata.excerpt || description.substring(0, 120) + '...',
      outputPath,
      type: metadata.type || 'tool',
      format: sourceFile.kind === 'pdf' ? 'PDF' : 
              (sourceFile.kind === 'xlsx' || sourceFile.kind === 'xls') ? 'EXCEL' :
              (sourceFile.kind === 'pptx' || sourceFile.kind === 'ppt') ? 'POWERPOINT' : 'PDF',
      isInteractive: id.toLowerCase().includes('interactive') || id.toLowerCase().includes('fillable'),
      isFillable: id.toLowerCase().includes('fillable') || sourceFile.kind === 'xlsx' || sourceFile.kind === 'xls',
      category,
      tier,
      formats: ['A4'],
      fileSize,
      lastModified: new Date(sourceFile.mtimeMs).toISOString(),
      exists: pdfExists,
      tags,
      requiresAuth: tier !== 'free',
      version: metadata.version || '1.0.0',
      priority: metadata.priority || (tier === 'architect' ? 5 : 10),
      preload: metadata.preload || false,
      placeholder: metadata.placeholder,
      md5: undefined,
      sourcePath: sourceFile.absPath,
      sourceKind: sourceFile.kind,
      needsGeneration,
    };
  }

  static formatFileSize(bytes: number): string {
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

  static async scanAllContent(options: GenerationOptions): Promise<{
    entries: ContentRegistryEntry[];
    summary: {
      total: number;
      contentFiles: number;
      libFiles: number;
      needGeneration: number;
    };
  }> {
    console.log('\n\x1b[1;36m🔍 CONTENT SCANNER\x1b[0m');
    console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
    
    const contentDir = path.join(process.cwd(), 'content/downloads');
    const libDir = path.join(process.cwd(), 'lib/pdf');
    
    console.log(`\x1b[36m📂 Scanning: ${contentDir}\x1b[0m`);
    const contentFiles = await ContentScanner.discoverFiles(contentDir, 'content/downloads', true);
    
    console.log(`\x1b[36m📂 Scanning: ${libDir}\x1b[0m`);
    const libFiles = await ContentScanner.discoverFiles(libDir, 'lib/pdf', true);
    
    console.log(`\x1b[32m✅ Found ${contentFiles.length} content files\x1b[0m`);
    console.log(`\x1b[32m✅ Found ${libFiles.length} library PDF files\x1b[0m`);
    
    const allEntries: ContentRegistryEntry[] = [];
    const existingIds = new Set<string>();
    
    for (const file of contentFiles) {
      try {
        const entry = ContentScanner.sourceFileToRegistryEntry(file);
        allEntries.push(entry);
        existingIds.add(entry.id);
        if (options.verbose) {
          console.log(`  \x1b[90m📄 ${file.kind}: ${file.baseName} -> ${entry.id}\x1b[0m`);
        }
      } catch (error: any) {
        console.error(`  \x1b[31m❌ Error processing ${file.absPath}: ${error.message}\x1b[0m`);
      }
    }
    
    for (const file of libFiles) {
      const entryId = ContentScanner.generateId(file.baseName);
      if (existingIds.has(entryId)) {
        if (options.verbose) {
          console.log(`  \x1b[33m⚠️  Skipping duplicate: ${file.baseName}\x1b[0m`);
        }
        continue;
      }
      
      try {
        const entry = ContentScanner.sourceFileToRegistryEntry(file);
        allEntries.push(entry);
        if (options.verbose) {
          console.log(`  \x1b[90m📄 ${file.kind}: ${file.baseName} -> ${entry.id}\x1b[0m`);
        }
      } catch (error: any) {
        console.error(`  \x1b[31m❌ Error processing ${file.absPath}: ${error.message}\x1b[0m`);
      }
    }
    
    const needGeneration = allEntries.filter(e => e.needsGeneration).length;
    
    const summary = {
      total: allEntries.length,
      contentFiles: contentFiles.length,
      libFiles: libFiles.length,
      needGeneration,
    };
    
    console.log(`\n\x1b[32m📊 Scan complete: ${allEntries.length} entries, ${needGeneration} need generation\x1b[0m`);
    console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
    
    return { entries: allEntries, summary };
  }
}

class UnifiedPDFGenerator {
  private options: GenerationOptions;
  private tierMapping: Record<Tier, string> = {
    architect: 'inner-circle-plus',
    member: 'inner-circle',
    free: 'public',
    all: 'all'
  };

  constructor(options: GenerationOptions) {
    this.options = options;
  }

  async initialize() {
    console.log('\n\x1b[1;35m✨ UNIFIED PDF GENERATOR v2.0 ✨\x1b[0m');
    console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');
    
    console.log(`🎯 \x1b[1;36mTier:\x1b[0m \x1b[1;33m${this.options.tier}\x1b[0m`);
    console.log(`🏆 \x1b[1;36mQuality:\x1b[0m \x1b[1;33m${this.options.quality}\x1b[0m`);
    console.log(`📄 \x1b[1;36mFormats:\x1b[0m \x1b[1;33m${this.options.formats.join(', ')}\x1b[0m`);
    console.log(`🔍 \x1b[1;36mContent Scan:\x1b[0m \x1b[1;33m${this.options.scanContent ? 'ENABLED' : 'DISABLED'}\x1b[0m`);
    console.log(`🏗️ \x1b[1;36mCanvas Gen:\x1b[0m \x1b[1;33m${this.options.skipCanvas ? 'SKIP' : 'ENABLED'}\x1b[0m`);
    console.log(`📁 \x1b[1;36mOutput:\x1b[0m \x1b[1;33m${this.options.output}\x1b[0m`);
    console.log(`🧹 \x1b[1;36mClean:\x1b[0m \x1b[1;33m${this.options.clean ? 'YES' : 'NO'}\x1b[0m`);
    
    if (!fs.existsSync(this.options.output)) {
      fs.mkdirSync(this.options.output, { recursive: true });
      console.log('\n\x1b[32m📁 Created output directory\x1b[0m');
    }
    
    if (this.options.clean) {
      await this.cleanOutputSafely();
    }
    
    console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');
  }

  async cleanOutputSafely() {
    console.log('\n\x1b[33m🧹 Safe cleaning of output directory...\x1b[0m');
    
    if (!fs.existsSync(this.options.output)) {
      console.log('  \x1b[90m📁 Output directory does not exist, skipping clean\x1b[0m');
      return;
    }
    
    const files = fs.readdirSync(this.options.output);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('  \x1b[90m✅ No PDF files found to clean\x1b[0m');
      return;
    }
    
    const tiers = this.options.tier === 'all' 
      ? ['architect', 'member', 'free'] 
      : [this.options.tier as Tier];
    
    let filesToDelete: string[] = [];
    
    for (const tier of tiers) {
      for (const format of this.options.formats) {
        const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${this.options.quality}-${tier}.pdf`;
        if (pdfFiles.includes(filename)) {
          filesToDelete.push(filename);
        }
      }
    }
    
    let cleaned = 0;
    let skipped = 0;
    
    for (const filename of filesToDelete) {
      try {
        const filePath = path.join(this.options.output, filename);
        const stats = fs.statSync(filePath);
        const fileAgeMinutes = (Date.now() - stats.mtimeMs) / (1000 * 60);
        
        if (fileAgeMinutes > 5) {
          const tempBackup = path.join(os.tmpdir(), 'pdf-backup', filename);
          fs.mkdirSync(path.dirname(tempBackup), { recursive: true });
          fs.copyFileSync(filePath, tempBackup);
          
          fs.unlinkSync(filePath);
          if (this.options.verbose) {
            console.log(`  \x1b[32m✅ Removed: ${filename} (${Math.round(fileAgeMinutes)}min old)\x1b[0m`);
          }
          cleaned++;
        } else {
          if (this.options.verbose) {
            console.log(`  \x1b[33m⏭️  Skipped: ${filename} (too recent, ${Math.round(fileAgeMinutes)}min)\x1b[0m`);
          }
          skipped++;
        }
      } catch (error: any) {
        console.log(`  \x1b[31m❌ Failed to remove: ${filename} (${error.message})\x1b[0m`);
      }
    }
    
    if (cleaned > 0 || skipped > 0) {
      console.log(`  \x1b[90mCleaned ${cleaned} outdated files, skipped ${skipped} recent ones\x1b[0m`);
    }
  }

  async generateFromContent(entries: ContentRegistryEntry[]): Promise<{
    generated: number;
    skipped: number;
    failed: number;
    results: Array<{
      id: string;
      success: boolean;
      method: string;
      duration: number;
      error?: string;
      size?: number;
    }>;
  }> {
    console.log('\n\x1b[1;36m🔄 GENERATING FROM CONTENT\x1b[0m');
    console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
    
    const toGenerate = entries.filter(entry => entry.needsGeneration);
    const skipped = entries.length - toGenerate.length;
    
    console.log(`\x1b[36m📊 Found ${toGenerate.length} files to generate (${skipped} already exist)\x1b[0m`);
    
    const results = [];
    let generated = 0;
    let failed = 0;
    
    for (const entry of toGenerate) {
      console.log(`  \x1b[36m🚀 Generating: ${entry.title} (${entry.id})\x1b[0m`);
      
      const startTime = Date.now();
      const outputAbsPath = path.join(process.cwd(), 'public', entry.outputPath);
      
      try {
        fs.mkdirSync(path.dirname(outputAbsPath), { recursive: true });
        
        if (entry.sourceKind === 'pdf') {
          // Direct copy for PDFs
          fs.copyFileSync(entry.sourcePath!, outputAbsPath);
          const stats = fs.statSync(outputAbsPath);
          
          results.push({
            id: entry.id,
            success: true,
            method: 'copy',
            duration: Date.now() - startTime,
            size: stats.size,
          });
          
          generated++;
          console.log(`    \x1b[32m✅ Copied (${(stats.size / 1024).toFixed(1)}KB)\x1b[0m`);
          
        } else {
          // Use universal-converter for other types
          const converterPath = path.join(process.cwd(), 'scripts', 'pdf', 'universal-converter.ts');
          
          if (!fs.existsSync(converterPath)) {
            throw new Error('Universal converter not found');
          }
          
          const res = spawnSync(
            os.platform() === 'win32' ? 'npx.cmd' : 'npx',
            ['tsx', converterPath, entry.sourcePath!],
            {
              stdio: this.options.verbose ? 'inherit' : 'pipe',
              cwd: process.cwd(),
              env: {
                ...process.env,
                FORCE_COLOR: "1",
                NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=4096",
              },
            }
          );
          
          if (res.status !== 0) {
            throw new Error(`Converter failed with code ${res.status}`);
          }
          
          if (!fs.existsSync(outputAbsPath)) {
            throw new Error('Converter did not produce output file');
          }
          
          const stats = fs.statSync(outputAbsPath);
          results.push({
            id: entry.id,
            success: true,
            method: 'universal-converter',
            duration: Date.now() - startTime,
            size: stats.size,
          });
          
          generated++;
          console.log(`    \x1b[32m✅ Converted (${(stats.size / 1024).toFixed(1)}KB)\x1b[0m`);
        }
        
      } catch (error: any) {
        results.push({
          id: entry.id,
          success: false,
          method: 'error',
          duration: Date.now() - startTime,
          error: error.message,
        });
        
        failed++;
        console.log(`    \x1b[31m❌ Failed: ${error.message}\x1b[0m`);
        
        // Try to create placeholder
        try {
          await this.generatePlaceholderPDF(entry, outputAbsPath);
          console.log(`    \x1b[33m⚠️  Created placeholder instead\x1b[0m`);
        } catch (placeholderError: any) {
          console.log(`    \x1b[31m❌ Placeholder also failed\x1b[0m`);
        }
      }
    }
    
    console.log(`\n\x1b[32m📊 Content generation: ${generated} generated, ${skipped} skipped, ${failed} failed\x1b[0m`);
    console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
    
    return { generated, skipped, failed, results };
  }

  async generateTier(tier: Tier) {
    console.log(`\n\x1b[1;35m🚀 Generating tier: ${tier.toUpperCase()}\x1b[0m`);
    console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
    
    const filesBefore = fs.existsSync(this.options.output) 
      ? fs.readdirSync(this.options.output).filter(f => f.includes(`-${tier}.pdf`))
      : [];
    
    if (filesBefore.length > 0 && this.options.verbose) {
      console.log(`  \x1b[90m📋 Found ${filesBefore.length} existing files for tier ${tier}\x1b[0m`);
    }
    
    const generatedFiles: string[] = [];
    
    for (const format of this.options.formats) {
      console.log(`  \x1b[36m📄 Generating ${format}...\x1b[0m`);
      
      try {
        const command = `npx tsx scripts/generate-legacy-canvas.ts ${format} ${this.options.quality} ${tier}`;
        
        if (this.options.verbose) {
          console.log(`    \x1b[90mCommand: ${command}\x1b[0m`);
        }
        
        const output = execSync(command, {
          encoding: 'utf8',
          cwd: process.cwd(),
          env: {
            ...process.env,
            PDF_TIER: tier,
            PDF_QUALITY: this.options.quality,
            PDF_FORMAT: format,
            FORCE_COLOR: '1'
          }
        });
        
        const lines = output.trim().split('\n');
        for (const line of lines) {
          if (line.includes('KB') || line.includes('LAC-')) {
            console.log(`    \x1b[32m✅ ${line.trim()}\x1b[0m`);
          } else if (!line.includes('legacy-canvas')) {
            console.log(`    \x1b[90m${line}\x1b[0m`);
          }
        }
        
        const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${this.options.quality}-${tier}.pdf`;
        generatedFiles.push(filename);
        
      } catch (error: any) {
        console.log(`    \x1b[31m❌ ${format} failed: ${error.message}\x1b[0m`);
        
        const expectedFile = path.join(
          this.options.output, 
          `legacy-architecture-canvas-${format.toLowerCase()}-${this.options.quality}-${tier}.pdf`
        );
        
        if (fs.existsSync(expectedFile)) {
          const stats = fs.statSync(expectedFile);
          if (stats.size < 10000) {
            console.log(`    \x1b[33m⚠️  Removing corrupted file (${stats.size} bytes)\x1b[0m`);
            fs.unlinkSync(expectedFile);
          }
        }
        
        try {
          console.log(`    \x1b[33m🔄 Trying fallback generation for ${format}...\x1b[0m`);
          await this.generateFallback(format, tier, this.options.quality);
          console.log(`    \x1b[32m✅ ${format} (fallback) generated\x1b[0m`);
        } catch (fallbackError: any) {
          console.log(`    \x1b[31m❌ ${format} fallback failed: ${fallbackError.message}\x1b[0m`);
        }
      }
    }
    
    await this.generateStandalonePDF(tier, this.options.quality);
    
    console.log(`\n\x1b[32m✅ Tier ${tier.toUpperCase()} completed\x1b[0m`);
    console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
    
    return generatedFiles;
  }

  async generateStandalonePDF(tier: Tier, quality: Quality) {
    console.log(`  \x1b[36m📖 Generating standalone editorial...\x1b[0m`);
    
    try {
      const command = `npx tsx scripts/generate-standalone-pdf.tsx ${quality} ${tier}`;
      
      if (this.options.verbose) {
        console.log(`    \x1b[90mCommand: ${command}\x1b[0m`);
      }
      
      const output = execSync(command, {
        encoding: 'utf8',
        cwd: process.cwd(),
        env: {
          ...process.env,
          PDF_TIER: tier,
          PDF_QUALITY: quality,
          FORCE_COLOR: '1'
        }
      });
      
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.includes('Success!') || line.includes('PDF saved to:')) {
          console.log(`    \x1b[32m✅ ${line.trim()}\x1b[0m`);
        } else if (line.includes('File size:') || line.includes('Pages:')) {
          console.log(`    \x1b[90m${line.trim()}\x1b[0m`);
        }
      }
      
    } catch (error: any) {
      console.log(`    \x1b[33m⚠️  Standalone PDF generation skipped: ${error.message}\x1b[0m`);
    }
  }

  async generatePlaceholderPDF(entry: ContentRegistryEntry, outputPath: string): Promise<void> {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    
    // Header
    page.drawText(entry.title, {
      x: 50,
      y: 750,
      size: 24,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    page.drawText('PLACEHOLDER DOCUMENT - CONTENT GENERATION PENDING', {
      x: 50,
      y: 720,
      size: 10,
      font: font,
      color: rgb(0.6, 0.2, 0.2),
    });
    
    // Description
    page.drawText(entry.description, {
      x: 50,
      y: 680,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
      maxWidth: 500,
    });
    
    // Metadata
    const metadata = [
      `ID: ${entry.id}`,
      `Type: ${entry.type}`,
      `Tier: ${entry.tier}`,
      `Category: ${entry.category}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Status: Placeholder - Source: ${entry.sourceKind || 'unknown'}`,
    ];
    
    metadata.forEach((line, i) => {
      page.drawText(line, {
        x: 50,
        y: 600 - (i * 20),
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
    });
    
    const pdfBytes = await doc.save();
    fs.writeFileSync(outputPath, pdfBytes);
  }

  async generateFallback(format: string, tier: Tier, quality: Quality) {
    const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${quality}-${tier}.pdf`;
    const filePath = path.join(this.options.output, filename);
    
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]); // A4
      
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      
      doc.setTitle(`Legacy Architecture Canvas - ${tier}`);
      doc.setAuthor('Abraham of London');
      doc.setSubject('Strategic Framework');
      
      // Professional header
      page.drawText('LEGACY ARCHITECTURE CANVAS', {
        x: 50,
        y: 750,
        size: 24,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      page.drawText(`Tier: ${tier.toUpperCase()} | Format: ${format} | Quality: ${quality}`, {
        x: 50,
        y: 720,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      const content = [
        'This is a fallback document generated because the primary',
        'PDF generator encountered an issue. The full-featured version',
        'with interactive form fields and enhanced formatting should',
        'be available when the system is fully operational.',
        '',
        `Generated: ${new Date().toLocaleDateString()}`,
      ];
      
      content.forEach((line, i) => {
        page.drawText(line, {
          x: 50,
          y: 650 - (i * 20),
          size: 11,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
      });
      
      const pdfBytes = await doc.save();
      fs.writeFileSync(filePath, pdfBytes);
      
    } catch (error) {
      // Minimal PDF as last resort
      const minimalPDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources << /Font << /F1 5 0 R >> >>
>>
endobj

4 0 obj
<< /Length 200 >>
stream
BT
/F1 24 Tf
100 700 Td
(Legacy Architecture Canvas) Tj
0 -30 Td
/F1 12 Tf
(Tier: ${tier.toUpperCase()}) Tj
0 -20 Td
(Format: ${format}) Tj
0 -20 Td
(Quality: ${quality}) Tj
0 -20 Td
(Date: ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000050 00000 n 
0000000120 00000 n 
0000000250 00000 n 
0000002000 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
2500
%%EOF`;
      
      fs.writeFileSync(filePath, minimalPDF);
    }
  }

  async generateRegistryFile(entries: ContentRegistryEntry[]): Promise<string> {
    const registryPath = path.join(process.cwd(), 'scripts', 'pdf', 'pdf-registry.generated.ts');
    const now = new Date().toISOString();
    
    const configs = entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      excerpt: entry.excerpt,
      outputPath: entry.outputPath,
      type: entry.type,
      format: entry.format as any,
      isInteractive: entry.isInteractive,
      isFillable: entry.isFillable,
      category: entry.category,
      tier: entry.tier,
      formats: entry.formats,
      fileSize: entry.fileSize,
      lastModified: entry.lastModified,
      exists: entry.exists,
      tags: entry.tags,
      requiresAuth: entry.requiresAuth,
      version: entry.version,
      priority: entry.priority,
      preload: entry.preload,
      placeholder: entry.placeholder,
      md5: entry.md5,
    }));
    
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

export const GENERATED_PDF_CONFIGS: PDFConfigGenerated[] = ${JSON.stringify(configs, null, 2)};

export const GENERATED_AT = "${now}";
export const GENERATED_COUNT = ${configs.length};
export const GENERATED_SOURCES = {
  content: ${entries.filter(e => e.sourcePath?.includes('content/downloads')).length},
  libPdf: ${entries.filter(e => e.sourcePath?.includes('lib/pdf')).length}
};
`;
    
    fs.mkdirSync(path.dirname(registryPath), { recursive: true });
    fs.writeFileSync(registryPath, registryContent, 'utf-8');
    
    console.log(`\n\x1b[32m📋 Generated registry: ${registryPath} (${configs.length} entries)\x1b[0m`);
    return registryPath;
  }

  async run() {
    await this.initialize();
    
    let contentResults;
    let canvasResults;
    
    // CONTENT SCANNING & GENERATION
    if (this.options.scanContent && !this.options.scanOnly) {
      const { entries } = await ContentScanner.scanAllContent(this.options);
      contentResults = await this.generateFromContent(entries);
      
      // Generate registry after content generation
      if (contentResults.generated > 0) {
        await this.generateRegistryFile(entries);
      }
    } else if (this.options.scanOnly) {
      console.log('\n\x1b[1;36m🔍 SCAN-ONLY MODE\x1b[0m');
      console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
      const { entries, summary } = await ContentScanner.scanAllContent(this.options);
      console.log(`\x1b[32m📊 Scan complete: ${summary.total} total entries\x1b[0m`);
      console.log(`\x1b[90m  • Content files: ${summary.contentFiles}\x1b[0m`);
      console.log(`\x1b[90m  • Library PDFs: ${summary.libFiles}\x1b[0m`);
      console.log(`\x1b[90m  • Need generation: ${summary.needGeneration}\x1b[0m`);
      
      // Generate registry file from scan
      await this.generateRegistryFile(entries);
      return true;
    }
    
    // LEGACY CANVAS GENERATION
    if (!this.options.skipCanvas) {
      const tiers: Tier[] = this.options.tier === 'all' 
        ? ['architect', 'member', 'free'] 
        : [this.options.tier as Tier];
      
      const results: Record<string, boolean> = {};
      
      for (const tier of tiers) {
        console.log('\n\x1b[1;37m' + '='.repeat(60) + '\x1b[0m');
        console.log(`\x1b[1;34m🏗️  BUILDING: ${tier.toUpperCase()}\x1b[0m`);
        console.log('\x1b[1;37m' + '='.repeat(60) + '\x1b[0m');
        
        const filesGenerated = await this.generateTier(tier);
        const verified = await this.verifyTier(tier);
        results[tier] = verified;
        
        console.log('\x1b[1;37m' + '='.repeat(60) + '\x1b[0m');
        console.log(verified ? 
          `\x1b[1;32m✅ ${tier.toUpperCase()} VERIFIED\x1b[0m` : 
          `\x1b[1;33m⚠️  ${tier.toUpperCase()} HAS ISSUES\x1b[0m`);
        console.log('\x1b[1;37m' + '='.repeat(60) + '\x1b[0m');
      }
      
      canvasResults = results;
    }
    
    // SUMMARY
    this.printSummary(contentResults, canvasResults);
    
    const canvasSuccess = !canvasResults || Object.values(canvasResults).every(v => v);
    const contentSuccess = !contentResults || contentResults.failed === 0;
    
    return canvasSuccess && contentSuccess;
  }

  async verifyTier(tier: Tier): Promise<boolean> {
    console.log(`\x1b[36m🔍 Verifying tier: ${tier}\x1b[0m`);
    
    if (!fs.existsSync(this.options.output)) {
      console.log(`  \x1b[31m❌ Output directory does not exist\x1b[0m`);
      return false;
    }
    
    const files = fs.readdirSync(this.options.output);
    const expectedFiles = this.options.formats.map(f => 
      `legacy-architecture-canvas-${f.toLowerCase()}-${this.options.quality}-${tier}.pdf`
    );
    
    let allValid = true;
    let validCount = 0;
    
    for (const expected of expectedFiles) {
      if (files.includes(expected)) {
        const filePath = path.join(this.options.output, expected);
        const stats = fs.statSync(filePath);
        
        let minSize, maxSize;
        switch (this.options.quality) {
          case 'enterprise':
            minSize = 50000;
            maxSize = 5000000;
            break;
          case 'premium':
            minSize = 30000;
            maxSize = 2000000;
            break;
          default:
            minSize = 20000;
            maxSize = 1000000;
        }
        
        const isValid = stats.size >= minSize && stats.size <= maxSize;
        const sizeDisplay = (stats.size / 1024).toFixed(1);
        
        if (isValid) {
          console.log(`  \x1b[32m✅ ${expected} (${sizeDisplay} KB)\x1b[0m`);
          validCount++;
        } else {
          const issue = stats.size < minSize ? 'TOO SMALL' : 'TOO LARGE';
          console.log(`  \x1b[33m⚠️  ${expected} (${sizeDisplay} KB - ${issue})\x1b[0m`);
          allValid = false;
        }
      } else {
        console.log(`  \x1b[31m❌ ${expected} (MISSING)\x1b[0m`);
        allValid = false;
      }
    }
    
    const standaloneFile = `ultimate-purpose-of-man-${this.options.quality}.pdf`;
    if (files.includes(standaloneFile)) {
      const stats = fs.statSync(path.join(this.options.output, standaloneFile));
      console.log(`  \x1b[32m✅ ${standaloneFile} (${(stats.size / 1024).toFixed(1)} KB)\x1b[0m`);
      validCount++;
    }
    
    console.log(`  \x1b[90mValid files: ${validCount}/${expectedFiles.length + 1}\x1b[0m`);
    return allValid;
  }

  printSummary(
    contentResults?: { generated: number; skipped: number; failed: number; results: any[] },
    canvasResults?: Record<string, boolean>
  ) {
    console.log('\n\x1b[1;36m📊 GENERATION SUMMARY\x1b[0m');
    console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');
    
    if (contentResults) {
      console.log(`\x1b[1;36mCONTENT:\x1b[0m`);
      console.log(`  \x1b[32m✅ Generated: ${contentResults.generated}\x1b[0m`);
      console.log(`  \x1b[33m⏭️  Skipped: ${contentResults.skipped}\x1b[0m`);
      console.log(`  \x1b[31m❌ Failed: ${contentResults.failed}\x1b[0m`);
    }
    
    if (canvasResults) {
      console.log(`\n\x1b[1;36mLEGACY CANVAS:\x1b[0m`);
      const successful = Object.keys(canvasResults).filter(t => canvasResults[t]);
      const failed = Object.keys(canvasResults).filter(t => !canvasResults[t]);
      
      console.log(`  \x1b[32m✅ Successful: ${successful.length}/${Object.keys(canvasResults).length}\x1b[0m`);
      
      if (failed.length > 0) {
        console.log(`  \x1b[31m❌ Failed: ${failed.length}/${Object.keys(canvasResults).length}\x1b[0m`);
        console.log(`  \x1b[33m   Failed tiers: ${failed.join(', ')}\x1b[0m`);
      }
    }
    
    // Show directory contents
    if (fs.existsSync(this.options.output)) {
      const files = fs.readdirSync(this.options.output);
      const pdfCount = files.filter(f => f.endsWith('.pdf')).length;
      console.log(`\n\x1b[90m📁 Output directory: ${this.options.output}\x1b[0m`);
      console.log(`\x1b[90m📄 Total PDF files: ${pdfCount}\x1b[0m`);
    }
    
    const contentSuccess = !contentResults || contentResults.failed === 0;
    const canvasSuccess = !canvasResults || Object.values(canvasResults).every(v => v);
    
    if (contentSuccess && canvasSuccess) {
      console.log('\n\x1b[1;32m🎉 ALL GENERATION COMPLETED SUCCESSFULLY!\x1b[0m');
    } else {
      console.log('\n\x1b[33m⚠️  Some generations failed - check logs above\x1b[0m');
    }
    
    console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');
  }
}

async function main() {
  program.parse(process.argv);
  const opts = program.opts();
  
  const formats = (opts.formats || 'A4,Letter,A3')
    .split(',')
    .map((f: string) => f.trim().toUpperCase() as Format)
    .filter(f => ['A4', 'LETTER', 'A3', 'BUNDLE'].includes(f))
    .map(f => f === 'LETTER' ? 'Letter' : f as Format);
  
  const options: GenerationOptions = {
    tier: opts.tier || 'all',
    quality: (opts.quality || 'premium') as Quality,
    formats: formats.length > 0 ? formats : ['A4', 'Letter', 'A3'] as Format[],
    output: opts.output || './public/assets/downloads',
    clean: opts.clean || false,
    verbose: opts.verbose || false,
    scanContent: opts.scanContent || false,
    scanOnly: opts.scanOnly || false,
    skipCanvas: opts.skipCanvas || false,
  };
  
  const generator = new UnifiedPDFGenerator(options);
  
  try {
    const success = await generator.run();
    process.exit(success ? 0 : 1);
  } catch (error: any) {
    console.error('\n\x1b[1;31m❌ Generation failed:\x1b[0m', error.message);
    if (opts.verbose && error.stack) {
      console.error('\x1b[90m' + error.stack + '\x1b[0m');
    }
    process.exit(1);
  }
}

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  main();
}

export { UnifiedPDFGenerator, ContentScanner };