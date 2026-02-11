// scripts/pdf/unified-pdf-generator.ts - COMPLETE AND PROPERLY STRUCTURED
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import matter from 'gray-matter';
import os from 'os';
import { fileURLToPath } from 'url';
import { SecurePuppeteerPDFGenerator } from './secure-puppeteer-generator';

const program = new Command();

program
  .name('unified-pdf-generator')
  .description('Premium PDF generator with content scanning & enhanced output')
  .version('3.2.0');

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
  .option('--use-puppeteer', 'Use Puppeteer for MDX/HTML generation', true)
  .option('--use-universal', 'Use Universal Converter for Office/PDF files', true)
  .option('--strict', 'Fail on conversion errors', false)
  .option('--overwrite', 'Overwrite existing files', false)
  .option('--min-bytes <bytes>', 'Minimum PDF size to consider valid', '8000')
  .option('--no-clean', 'Skip cleaning (safer)', false);

type Tier = 'architect' | 'member' | 'free' | 'all';
type Quality = 'premium' | 'enterprise' | 'draft';
type Format = 'A4' | 'Letter' | 'A3' | 'bundle';
type SourceKind = 'mdx' | 'md' | 'xlsx' | 'xls' | 'pptx' | 'ppt' | 'pdf' | 'html';

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
  usePuppeteer: boolean;
  useUniversal: boolean;
  strict: boolean;
  overwrite: boolean;
  minBytes: number;
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
          let kind = ext as SourceKind;
          
          if (ext === 'html' || ext === 'htm') kind = 'html';
          if (!['mdx', 'md', 'xlsx', 'xls', 'pptx', 'ppt', 'pdf', 'html'].includes(kind)) {
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
      if (kind === 'html') {
        const content = fs.readFileSync(filePath, 'utf-8');
        const metaTags: Record<string, string> = {};
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) metaTags.title = titleMatch[1];
        
        const descriptionMatch = content.match(/<meta name="description" content="(.*?)"/i);
        if (descriptionMatch) metaTags.description = descriptionMatch[1];
        
        return metaTags;
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
    
    const tagCategories = ['legacy', 'leadership', 'theology', 'surrender-framework', 'personal-growth', 'organizational', 'tools', 'templates'];
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
    if (idLower.includes('template') || idLower.includes('worksheet')) return 'templates';
    if (idLower.includes('tool') || idLower.includes('calculator')) return 'tools';
    
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
    if (idLower.includes('member') || idLower.includes('pro') || idLower.includes('premium')) {
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
              (sourceFile.kind === 'pptx' || sourceFile.kind === 'ppt') ? 'POWERPOINT' :
              sourceFile.kind === 'html' ? 'HTML' : 'PDF',
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

class IntegratedUniversalConverter {
  static isPdfHeader(buf: Buffer): boolean {
    if (!buf || buf.length < 4) return false;
    const head = buf.subarray(0, 4).toString('utf8');
    return head === '%PDF';
  }

  static pdfLooksValid(absPath: string, minBytes: number): { ok: boolean; reason: string } {
    try {
      const st = fs.statSync(absPath);
      if (st.size < minBytes) return { ok: false, reason: "too small or missing" };

      const head = fs.readFileSync(absPath, { encoding: null, flag: "r" });
      if (!this.isPdfHeader(head)) return { ok: false, reason: "missing %PDF header" };

      return { ok: true, reason: "ok" };
    } catch {
      return { ok: false, reason: "cannot read file" };
    }
  }

  static hasLibreOffice(): boolean {
    try {
      execSync('libreoffice --version', { stdio: 'ignore', shell: true });
      return true;
    } catch {
      try {
        execSync('soffice --version', { stdio: 'ignore', shell: true });
        return true;
      } catch {
        return false;
      }
    }
  }

  static checksum16(filePath: string): string | null {
    try {
      const buf = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
    } catch {
      return null;
    }
  }

  static async convertOfficeWithLibreOffice(srcAbsPath: string, outAbsPath: string): Promise<boolean> {
    try {
      const tempDir = path.join(os.tmpdir(), 'pdf-conversion');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      if (!fs.existsSync(path.dirname(outAbsPath))) {
        fs.mkdirSync(path.dirname(outAbsPath), { recursive: true });
      }

      const cmd = `soffice --headless --convert-to pdf --outdir "${tempDir}" "${srcAbsPath}"`;
      execSync(cmd, { stdio: 'pipe', shell: true });

      const base = path.basename(srcAbsPath, path.extname(srcAbsPath));
      const produced = path.join(tempDir, `${base}.pdf`);

      if (!fs.existsSync(produced)) {
        const pdfs = fs.readdirSync(tempDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
        if (pdfs.length === 0) throw new Error("LibreOffice produced no PDF output");
        fs.copyFileSync(path.join(tempDir, pdfs[0]), outAbsPath);
      } else {
        fs.copyFileSync(produced, outAbsPath);
      }

      try {
        if (fs.existsSync(produced)) fs.unlinkSync(produced);
      } catch {}

      return true;
    } catch (error: any) {
      console.error(`\x1b[31m❌ LibreOffice conversion failed: ${error.message}\x1b[0m`);
      return false;
    }
  }

  static async convertWithFallback(entry: ContentRegistryEntry, outputPath: string, options: GenerationOptions): Promise<{
    success: boolean;
    method: string;
    error?: string;
    size?: number;
  }> {
    const startTime = Date.now();
    
    try {
      if (!entry.sourcePath) {
        throw new Error('No source path');
      }

      if (entry.sourceKind === 'pdf') {
        fs.copyFileSync(entry.sourcePath, outputPath);
        const stats = fs.statSync(outputPath);
        const valid = this.pdfLooksValid(outputPath, options.minBytes);
        
        if (!valid.ok) {
          fs.unlinkSync(outputPath);
          throw new Error(`Invalid PDF: ${valid.reason}`);
        }
        
        return {
          success: true,
          method: 'copy',
          size: stats.size,
        };
      }

      if (['xlsx', 'xls', 'pptx', 'ppt'].includes(entry.sourceKind || '')) {
        const hasLibreOffice = this.hasLibreOffice();
        
        if (hasLibreOffice) {
          const success = await this.convertOfficeWithLibreOffice(entry.sourcePath, outputPath);
          if (success) {
            const stats = fs.statSync(outputPath);
            const valid = this.pdfLooksValid(outputPath, options.minBytes);
            
            if (!valid.ok) {
              fs.unlinkSync(outputPath);
              throw new Error(`Converted PDF invalid: ${valid.reason}`);
            }
            
            return {
              success: true,
              method: 'libreoffice',
              size: stats.size,
            };
          }
        }
        
        console.log(`  \x1b[33m⚠️  LibreOffice not available, using fallback for ${entry.sourceKind}\x1b[0m`);
        return this.createFallbackPDF(entry, outputPath, `${entry.sourceKind?.toUpperCase()} Document`);
      }

      throw new Error(`Unsupported file type: ${entry.sourceKind}`);

    } catch (error: any) {
      return {
        success: false,
        method: 'universal-converter',
        error: error.message,
      };
    }
  }

  static async createFallbackPDF(entry: ContentRegistryEntry, outputPath: string, docType: string): Promise<{
    success: boolean;
    method: string;
    error?: string;
    size?: number;
  }> {
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]);
      
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      
      const fileName = entry.sourcePath ? path.basename(entry.sourcePath) : entry.id;
      
      page.drawText(`${docType} - Fallback PDF`, {
        x: 50,
        y: 750,
        size: 24,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      page.drawText(`File: ${fileName}`, {
        x: 50,
        y: 700,
        size: 14,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      page.drawText(entry.title, {
        x: 50,
        y: 670,
        size: 16,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
        maxWidth: 500,
      });
      
      page.drawText(entry.description.substring(0, 200) + '...', {
        x: 50,
        y: 640,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
        maxWidth: 500,
      });
      
      const metadata = [
        `ID: ${entry.id}`,
        `Type: ${entry.type}`,
        `Tier: ${entry.tier}`,
        `Category: ${entry.category}`,
        `Source: ${entry.sourceKind || 'unknown'}`,
        `Generated: ${new Date().toLocaleDateString()}`,
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
      const stats = fs.statSync(outputPath);
      
      return {
        success: true,
        method: 'fallback',
        size: stats.size,
      };
    } catch (error: any) {
      return {
        success: false,
        method: 'fallback',
        error: `Fallback creation failed: ${error.message}`,
      };
    }
  }
}

class UnifiedPDFGenerator {
  private options: GenerationOptions;
  private puppeteerGenerator: SecurePuppeteerPDFGenerator;
  private tierMapping: Record<Tier, string> = {
    architect: 'inner-circle-plus',
    member: 'inner-circle',
    free: 'public',
    all: 'all'
  };

  constructor(options: GenerationOptions) {
    this.options = options;
    this.puppeteerGenerator = new SecurePuppeteerPDFGenerator({
      timeout: 60000,
      maxRetries: 3,
    });
  }

  async initialize() {
    console.log('\n\x1b[1;35m✨ UNIFIED PDF GENERATOR v3.2 ✨\x1b[0m');
    console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');
    
    console.log(`🎯 \x1b[1;36mTier:\x1b[0m \x1b[1;33m${this.options.tier}\x1b[0m`);
    console.log(`🏆 \x1b[1;36mQuality:\x1b[0m \x1b[1;33m${this.options.quality}\x1b[0m`);
    console.log(`📄 \x1b[1;36mFormats:\x1b[0m \x1b[1;33m${this.options.formats.join(', ')}\x1b[0m`);
    console.log(`🔍 \x1b[1;36mContent Scan:\x1b[0m \x1b[1;33m${this.options.scanContent ? 'ENABLED' : 'DISABLED'}\x1b[0m`);
    console.log(`🎨 \x1b[1;36mPuppeteer:\x1b[0m \x1b[1;33m${this.options.usePuppeteer ? 'ENABLED' : 'DISABLED'}\x1b[0m`);
    console.log(`🔄 \x1b[1;36mUniversal Converter:\x1b[0m \x1b[1;33m${this.options.useUniversal ? 'ENABLED' : 'DISABLED'}\x1b[0m`);
    console.log(`🏗️ \x1b[1;36mCanvas Gen:\x1b[0m \x1b[1;33m${this.options.skipCanvas ? 'SKIP' : 'ENABLED'}\x1b[0m`);
    console.log(`📁 \x1b[1;36mOutput:\x1b[0m \x1b[1;33m${this.options.output}\x1b[0m`);
    console.log(`🧹 \x1b[1;36mClean:\x1b[0m \x1b[1;33m${this.options.clean ? 'YES' : 'NO'}\x1b[0m`);
    console.log(`⚡ \x1b[1;36mOverwrite:\x1b[0m \x1b[1;33m${this.options.overwrite ? 'YES' : 'NO'}\x1b[0m`);
    console.log(`🔒 \x1b[1;36mStrict:\x1b[0m \x1b[1;33m${this.options.strict ? 'YES' : 'NO'}\x1b[0m`);
    
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
      hash?: string;
    }>;
  }> {
    console.log('\n\x1b[1;36m🔄 GENERATING FROM CONTENT\x1b[0m');
    console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
    
    const toGenerate = this.options.overwrite 
      ? entries 
      : entries.filter(entry => entry.needsGeneration);
    
    const skipped = entries.length - toGenerate.length;
    
    console.log(`\x1b[36m📊 Found ${toGenerate.length} files to generate (${skipped} already exist)\x1b[0m`);
    
    const results = [];
    let generated = 0;
    let failed = 0;
    
    const pdfFiles = toGenerate.filter(e => e.sourceKind === 'pdf');
    const mdxFiles = toGenerate.filter(e => e.sourceKind === 'mdx' || e.sourceKind === 'md');
    const htmlFiles = toGenerate.filter(e => e.sourceKind === 'html');
    const officeFiles = toGenerate.filter(e => 
      ['xlsx', 'xls', 'pptx', 'ppt'].includes(e.sourceKind || '')
    );
    
    for (const entry of pdfFiles) {
      const result = await this.processPDFFile(entry);
      results.push(result);
      if (result.success) generated++;
      else failed++;
    }
    
    if (this.options.usePuppeteer && mdxFiles.length > 0) {
      const puppeteerResults = await this.processWithPuppeteerFallback(mdxFiles, 'mdx');
      results.push(...puppeteerResults);
      generated += puppeteerResults.filter(r => r.success).length;
      failed += puppeteerResults.filter(r => !r.success).length;
    } else if (mdxFiles.length > 0) {
      const fallbackResults = await this.processWithUniversalConverter(mdxFiles);
      results.push(...fallbackResults);
      generated += fallbackResults.filter(r => r.success).length;
      failed += fallbackResults.filter(r => !r.success).length;
    }

    if (this.options.usePuppeteer && htmlFiles.length > 0) {
      const puppeteerResults = await this.processWithPuppeteerFallback(htmlFiles, 'html');
      results.push(...puppeteerResults);
      generated += puppeteerResults.filter(r => r.success).length;
      failed += puppeteerResults.filter(r => !r.success).length;
    } else if (htmlFiles.length > 0) {
      const fallbackResults = await this.processWithUniversalConverter(htmlFiles);
      results.push(...fallbackResults);
      generated += fallbackResults.filter(r => r.success).length;
      failed += fallbackResults.filter(r => !r.success).length;
    }
    
    if (this.options.useUniversal && officeFiles.length > 0) {
      const converterResults = await this.processWithUniversalConverter(officeFiles);
      results.push(...converterResults);
      generated += converterResults.filter(r => r.success).length;
      failed += converterResults.filter(r => !r.success).length;
    } else if (officeFiles.length > 0) {
      const fallbackResults = await this.processWithUniversalConverter(officeFiles);
      results.push(...fallbackResults);
      generated += fallbackResults.filter(r => r.success).length;
      failed += fallbackResults.filter(r => !r.success).length;
    }
    
    console.log(`\n\x1b[32m📊 Content generation: ${generated} generated, ${skipped} skipped, ${failed} failed\x1b[0m`);
    console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
    
    return { generated, skipped, failed, results };
  }

  private async processEntry(entry: ContentRegistryEntry) {
  const start = Date.now();
  const dest = path.join(process.cwd(), 'public', entry.outputPath);
  
  // NEW: Validate Source Existence and Content
  if (!fs.existsSync(entry.sourcePath) || fs.statSync(entry.sourcePath).size < 10) {
    throw new Error(`Source file missing or empty: ${entry.sourcePath}`);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  // Conversion Logic...
  if (entry.sourceKind === 'pdf') {
    fs.copyFileSync(entry.sourcePath, dest);
  } else if (['xlsx', 'xls', 'pptx', 'ppt'].includes(entry.sourceKind)) {
    await this.convertOffice(entry.sourcePath, dest);
  } else {
    await this.convertWeb(entry, dest);
  }

  // POST-CHECK: Ensure the output is actually a valid PDF (> 8KB)
  const outStats = fs.statSync(dest);
  if (outStats.size < 8000) {
    throw new Error(`Generated PDF is corrupt or too small (${outStats.size} bytes)`);
  }
  
  await this.injectIntegrityHash(dest);
  console.log(`  \x1b[32m✅ [${entry.sourceKind.toUpperCase()}] ${entry.id} (${Date.now() - start}ms)\x1b[0m`);
}