// scripts/generate-pdfs.ts — ENHANCED WITH CONTENT SCANNING
import { spawn, execSync, spawnSync } from "child_process";
import path from "path";
import os from "os";
import crypto from "crypto";
import { fileURLToPath } from "url";
import fs from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import matter from "gray-matter";

const fsp = fs.promises;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------
type LogLevel = "silent" | "error" | "warn" | "info" | "debug";
type Quality = "premium" | "enterprise" | "draft";
type Tier = "public" | "basic" | "premium" | "enterprise" | "restricted";
type Format = "A4" | "Letter" | "A3" | "bundle";
type PDFType = "editorial" | "framework" | "academic" | "strategic" | "tool" | "canvas" | "worksheet" | "assessment" | "journal" | "tracker" | "bundle" | "other";
type SourceKind = "mdx" | "md" | "xlsx" | "xls" | "pptx" | "ppt" | "pdf";

const FORMAT_ALIASES: Record<string, Format> = {
  a4: "A4",
  letter: "Letter",
  a3: "A3",
  bundle: "bundle",
};

const TIER_SLUG: Record<Tier, string> = {
  public: "free",
  basic: "member",
  premium: "architect",
  enterprise: "enterprise",
  restricted: "restricted",
};

const TIER_DISPLAY: Record<Tier, string> = {
  public: "Public",
  basic: "Inner Circle",
  premium: "Inner Circle Plus",
  enterprise: "Inner Circle Elite",
  restricted: "Private",
};

const CONFIG = {
  timeout: 10 * 60 * 1000,
  retries: 3,
  retryDelay: 1500,
  maxConcurrent: 1,

  logLevel: (process.env.LOG_LEVEL as LogLevel) || "info",

  outputDir: path.join(process.cwd(), "public/assets/downloads"),
  libDir: path.join(process.cwd(), "lib/pdfs"),
  scriptDir: __dirname,
  
  // Content scanning directories
  contentDir: path.join(process.cwd(), "content/downloads"),
  sourceLibDir: path.join(process.cwd(), "lib/pdf"),

  quality: ((process.env.PDF_QUALITY as Quality) || "premium") as Quality,
  tier: ((process.env.PDF_TIER as Tier) || "premium") as Tier,

  // Safer: Only clean files older than 30 minutes
  maxOldFileAge: 30 * 60 * 1000,
  
  // Content scanning
  enableContentScan: process.env.ENABLE_CONTENT_SCAN !== "false",
  scanRecursive: true,
} as const;

// ----------------------------------------------------------------------------
// ENHANCED LOGGER (keep existing)
class Logger {
  private static colors = {
    reset: "\x1b[0m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",
  };

  private static symbols = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
    debug: "🔍",
    start: "🚀",
    file: "📄",
    folder: "📁",
    clock: "⏱️",
    check: "✅",
    cross: "❌",
    warning2: "⚠️",
    rocket: "🚀",
    magnify: "🔎",
    gear: "⚙️",
    scan: "🔍",
    database: "🗄️",
    sync: "🔄",
  };

  static shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["silent", "error", "warn", "info", "debug"];
    return levels.indexOf(level) <= levels.indexOf(CONFIG.logLevel);
  }

  static timestamp(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  }

  static format(level: Exclude<LogLevel, "silent">, message: string, icon?: string, color?: string): void {
    if (!Logger.shouldLog(level)) return;
    
    const timestamp = `\x1b[90m${Logger.timestamp()}\x1b[0m`;
    const levelColor = {
      error: Logger.colors.brightRed,
      warn: Logger.colors.brightYellow,
      info: Logger.colors.brightCyan,
      debug: Logger.colors.gray,
    }[level];
    
    const levelText = `${levelColor}${level.toUpperCase().padEnd(5)}\x1b[0m`;
    const iconText = icon ? `${icon} ` : '';
    const messageText = color ? `${color}${message}\x1b[0m` : message;
    
    const line = `${timestamp} ${levelText} ${iconText}${messageText}`;
    
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  static header(title: string): void {
    console.log(`\n${Logger.colors.brightMagenta}╔${'═'.repeat(title.length + 2)}╗\x1b[0m`);
    console.log(`${Logger.colors.brightMagenta}║ ${Logger.colors.brightWhite}${title}${Logger.colors.brightMagenta} ║\x1b[0m`);
    console.log(`${Logger.colors.brightMagenta}╚${'═'.repeat(title.length + 2)}╝\x1b[0m\n`);
  }

  static separator(length = 60): void {
    console.log(`${Logger.colors.gray}${'─'.repeat(length)}\x1b[0m`);
  }

  static success(message: string): void { 
    Logger.format("info", message, Logger.symbols.success, Logger.colors.brightGreen); 
  }
  
  static info(message: string): void { 
    Logger.format("info", message, Logger.symbols.info, Logger.colors.brightCyan); 
  }
  
  static warn(message: string): void { 
    Logger.format("warn", message, Logger.symbols.warning, Logger.colors.brightYellow); 
  }
  
  static error(message: string): void { 
    Logger.format("error", message, Logger.symbols.error, Logger.colors.brightRed); 
  }
  
  static debug(message: string): void { 
    Logger.format("debug", message, Logger.symbols.debug, Logger.colors.gray); 
  }
  
  static start(message: string): void { 
    Logger.format("info", message, Logger.symbols.rocket, Logger.colors.brightMagenta); 
  }
  
  static file(message: string): void { 
    Logger.format("info", message, Logger.symbols.file, Logger.colors.brightBlue); 
  }
  
  static folder(message: string): void { 
    Logger.format("info", message, Logger.symbols.folder, Logger.colors.brightBlue); 
  }
  
  static time(message: string): void { 
    Logger.format("info", message, Logger.symbols.clock, Logger.colors.brightYellow); 
  }
  
  static scan(message: string): void { 
    Logger.format("info", message, Logger.symbols.scan, Logger.colors.brightMagenta); 
  }
  
  static sync(message: string): void { 
    Logger.format("info", message, Logger.symbols.sync, Logger.colors.brightBlue); 
  }
  
  static db(message: string): void { 
    Logger.format("info", message, Logger.symbols.database, Logger.colors.brightCyan); 
  }
}

// ----------------------------------------------------------------------------
// CONTENT SCANNER MODULE
// ----------------------------------------------------------------------------
interface SourceFile {
  absPath: string;
  relPath: string;
  kind: SourceKind;
  baseName: string;
  mtimeMs: number;
  size: number;
  from: "content/downloads" | "lib/pdf";
}

interface ContentRegistryEntry {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;
  type: PDFType;
  format: "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
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
      Logger.warn(`Source directory does not exist: ${root}`);
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
      } catch (error: any) {
        Logger.error(`Error scanning directory ${dir}: ${error.message}`);
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
      Logger.warn(`Could not extract metadata from ${filePath}: ${error.message}`);
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

  static detectType(id: string, kind: SourceKind, metadata?: Record<string, any>): PDFType {
    if (metadata?.type && [
      'editorial', 'framework', 'academic', 'strategic', 'tool', 'canvas', 
      'worksheet', 'assessment', 'journal', 'tracker', 'bundle', 'other'
    ].includes(metadata.type)) {
      return metadata.type as PDFType;
    }
    
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
    
    if (kind === 'pdf') return 'tool';
    if (kind === 'xlsx' || kind === 'xls') return 'worksheet';
    if (kind === 'pptx' || kind === 'ppt') return 'strategic';
    
    return 'other';
  }

  static detectTier(id: string, metadata?: Record<string, any>): Tier {
    if (metadata?.tier && ['public', 'basic', 'premium', 'enterprise', 'restricted'].includes(metadata.tier)) {
      return metadata.tier as Tier;
    }
    
    const idLower = id.toLowerCase();
    if (idLower.includes('premium') || idLower.includes('architect') || idLower.includes('inner-circle')) {
      return 'premium';
    }
    if (idLower.includes('member') || idLower.includes('pro') || idLower.includes('basic')) {
      return 'basic';
    }
    if (idLower.includes('enterprise') || idLower.includes('elite')) {
      return 'enterprise';
    }
    if (idLower.includes('restricted') || idLower.includes('private')) {
      return 'restricted';
    }
    if (idLower.includes('free') || idLower.includes('public')) {
      return 'public';
    }
    
    if (idLower.includes('legacy-architecture')) return 'premium';
    if (idLower.includes('canvas') || idLower.includes('framework')) return 'basic';
    
    return 'public';
  }

  static detectFormats(id: string, kind: SourceKind): Format[] {
    const idLower = id.toLowerCase();
    const formats: Format[] = [];
    
    if (idLower.includes('a4') || idLower.includes('premium')) formats.push('A4');
    if (idLower.includes('letter')) formats.push('Letter');
    if (idLower.includes('a3')) formats.push('A3');
    if (idLower.includes('bundle') || kind === 'xlsx' || kind === 'xls') formats.push('bundle');
    
    return formats.length > 0 ? formats : ['A4'];
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
    const type = ContentScanner.detectType(id, sourceFile.kind, metadata);
    const tier = ContentScanner.detectTier(id, metadata);
    const formats = ContentScanner.detectFormats(id, sourceFile.kind);
    
    const isFillable = id.toLowerCase().includes('fillable') || sourceFile.kind === 'xlsx' || sourceFile.kind === 'xls';
    const isInteractive = id.toLowerCase().includes('interactive') || isFillable;
    
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
      fileSize = ContentScanner.formatFileSize(stats.size);
    }
    
    // Check if generation is needed
    let needsGeneration = !pdfExists;
    if (pdfExists && sourceFile.mtimeMs) {
      try {
        const pdfStats = fs.statSync(outputAbsPath);
        needsGeneration = sourceFile.mtimeMs > pdfStats.mtimeMs + 1000; // Source is newer
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
      type,
      format: sourceFile.kind === 'pdf' ? 'PDF' : 
              (sourceFile.kind === 'xlsx' || sourceFile.kind === 'xls') ? 'EXCEL' :
              (sourceFile.kind === 'pptx' || sourceFile.kind === 'ppt') ? 'POWERPOINT' : 'PDF',
      isInteractive,
      isFillable,
      category,
      tier,
      formats,
      fileSize,
      lastModified: new Date(sourceFile.mtimeMs).toISOString(),
      exists: pdfExists,
      tags,
      requiresAuth: tier !== 'public',
      version: metadata.version || '1.0.0',
      priority: metadata.priority || (tier === 'premium' ? 5 : 10),
      preload: metadata.preload || false,
      placeholder: metadata.placeholder,
      md5: undefined, // Will be calculated after generation
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

  static async scanAllContent(): Promise<{
    entries: ContentRegistryEntry[];
    summary: {
      total: number;
      contentFiles: number;
      libFiles: number;
      needGeneration: number;
      byTier: Record<Tier, number>;
      byType: Record<PDFType, number>;
    };
  }> {
    Logger.scan("Scanning content directories...");
    
    const contentFiles = await ContentScanner.discoverFiles(CONFIG.contentDir, 'content/downloads', CONFIG.scanRecursive);
    const libFiles = await ContentScanner.discoverFiles(CONFIG.sourceLibDir, 'lib/pdf', CONFIG.scanRecursive);
    
    Logger.info(`Found ${contentFiles.length} content files`);
    Logger.info(`Found ${libFiles.length} library PDF files`);
    
    const allEntries: ContentRegistryEntry[] = [];
    const existingIds = new Set<string>();
    
    // Process content files first
    for (const file of contentFiles) {
      try {
        const entry = ContentScanner.sourceFileToRegistryEntry(file);
        allEntries.push(entry);
        existingIds.add(entry.id);
        Logger.debug(`Scanned: ${file.kind} -> ${entry.id} (${entry.needsGeneration ? 'needs gen' : 'exists'})`);
      } catch (error: any) {
        Logger.error(`Error processing ${file.absPath}: ${error.message}`);
      }
    }
    
    // Process library PDFs (skip duplicates)
    for (const file of libFiles) {
      const entryId = ContentScanner.generateId(file.baseName);
      if (existingIds.has(entryId)) {
        Logger.debug(`Skipping duplicate: ${file.baseName}`);
        continue;
      }
      
      try {
        const entry = ContentScanner.sourceFileToRegistryEntry(file);
        allEntries.push(entry);
        Logger.debug(`Scanned: ${file.kind} -> ${entry.id} (${entry.needsGeneration ? 'needs gen' : 'exists'})`);
      } catch (error: any) {
        Logger.error(`Error processing ${file.absPath}: ${error.message}`);
      }
    }
    
    // Generate summary
    const byTier: Record<Tier, number> = {
      public: 0, basic: 0, premium: 0, enterprise: 0, restricted: 0
    };
    
    const byType: Record<PDFType, number> = {
      editorial: 0, framework: 0, academic: 0, strategic: 0, tool: 0,
      canvas: 0, worksheet: 0, assessment: 0, journal: 0, tracker: 0,
      bundle: 0, other: 0
    };
    
    let needGeneration = 0;
    
    for (const entry of allEntries) {
      byTier[entry.tier] = (byTier[entry.tier] || 0) + 1;
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      if (entry.needsGeneration) needGeneration++;
    }
    
    const summary = {
      total: allEntries.length,
      contentFiles: contentFiles.length,
      libFiles: libFiles.length,
      needGeneration,
      byTier,
      byType,
    };
    
    Logger.success(`Content scan complete: ${allEntries.length} entries, ${needGeneration} need generation`);
    
    return { entries: allEntries, summary };
  }
}

// ----------------------------------------------------------------------------
// ENHANCED FILE MANAGER (keep existing with additions)
class FileManager {
  static async exists(p: string): Promise<boolean> {
    try {
      await fsp.access(p);
      return true;
    } catch {
      return false;
    }
  }

  static async ensureDir(p: string): Promise<void> {
    if (!(await FileManager.exists(p))) {
      await fsp.mkdir(p, { recursive: true });
      Logger.folder(`Created directory: ${p}`);
    }
  }

  static async safeCleanup(): Promise<{ cleanedCount: number; backupDir: string; backupCount: number }> {
    Logger.start("Performing safe cleanup...");
    const now = Date.now();
    let cleanedCount = 0;
    let backupCount = 0;

    // Create backup directory
    const backupDir = path.join(os.tmpdir(), `pdf-backup-${Date.now()}`);
    await FileManager.ensureDir(backupDir);

    // Clean downloads directory
    if (await FileManager.exists(CONFIG.outputDir)) {
      const files = await fsp.readdir(CONFIG.outputDir).catch(() => []);
      
      for (const file of files) {
        const filePath = path.join(CONFIG.outputDir, file);
        
        // CRITICAL: DO NOT DELETE ZIP FILES
        if (file.endsWith('.zip')) {
          Logger.debug(`Skipping ZIP file: ${file}`);
          continue;
        }
        
        const stat = await fsp.stat(filePath).catch(() => null);
        if (!stat) continue;

        const isTarget = file.endsWith(".pdf") || file.endsWith(".json");
        if (!isTarget) continue;

        const fileAge = now - stat.mtimeMs;
        
        if (fileAge > CONFIG.maxOldFileAge) {
          // Backup before deletion
          const backupPath = path.join(backupDir, file);
          await fsp.copyFile(filePath, backupPath);
          backupCount++;
          
          await fsp.unlink(filePath).catch(() => {});
          cleanedCount++;
          Logger.debug(`Removed (backed up): ${file} (${Math.round(fileAge / 60000)}min old)`);
        } else if (fileAge > 5 * 60 * 1000) { // Older than 5 minutes
          Logger.debug(`Skipped (recent): ${file} (${Math.round(fileAge / 60000)}min old)`);
        }
      }
    }

    if (backupCount > 0) {
      Logger.info(`Backup created at: ${backupDir}`);
    }

    Logger.success(`Safe cleanup: ${cleanedCount} files removed, ${backupCount} backed up`);
    return { cleanedCount, backupDir, backupCount };
  }

  static async validateFiles(): Promise<{ validFiles: string[]; issues: string[]; total: number }> {
    Logger.start("Validating generated files...");
    const issues: string[] = [];
    const validFiles: string[] = [];

    const downloadsFiles = await fsp.readdir(CONFIG.outputDir).catch(() => []);
    const pdfFiles = downloadsFiles.filter((f) => f.endsWith(".pdf"));

    for (const pdf of pdfFiles) {
      const filePath = path.join(CONFIG.outputDir, pdf);
      const stat = await fsp.stat(filePath).catch(() => null);

      if (!stat) {
        issues.push(`Cannot stat file: ${pdf}`);
        continue;
      }

      // Quality-based validation
      let minSize: number;
      switch (CONFIG.quality) {
        case 'enterprise':
          minSize = 50000; // 50KB
          break;
        case 'premium':
          minSize = 30000; // 30KB
          break;
        default:
          minSize = 20000; // 20KB
      }

      if (stat.size < minSize) {
        issues.push(`Suspiciously small: ${pdf} (${stat.size} bytes < ${minSize} min)`);
      } else if (stat.size > 10 * 1024 * 1024) { // 10MB max
        issues.push(`Suspiciously large: ${pdf} (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);
      } else {
        validFiles.push(pdf);
      }
    }

    if (issues.length > 0) {
      Logger.warn(`Found ${issues.length} issues:`);
      issues.forEach((issue) => Logger.warn(`  ${issue}`));
    }

    Logger.success(`Validation: ${validFiles.length} valid PDFs, ${issues.length} issues`);
    return { validFiles, issues, total: pdfFiles.length };
  }

  static checksum16(filePath: string): string | null {
    try {
      const buf = fs.readFileSync(filePath);
      return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
    } catch {
      return null;
    }
  }
}

// ----------------------------------------------------------------------------
// CONTENT GENERATION HANDLER
class ContentGenerationHandler {
  private isWindows = os.platform() === "win32";
  private npxCmd = this.isWindows ? "npx.cmd" : "npx";

  async generateFromContentEntry(entry: ContentRegistryEntry): Promise<{
    success: boolean;
    method: string;
    error?: string;
    size?: number;
    duration: number;
  }> {
    const startTime = Date.now();
    const outputAbsPath = path.join(process.cwd(), 'public', entry.outputPath);
    
    try {
      await FileManager.ensureDir(path.dirname(outputAbsPath));
      
      // Choose generation method based on source type
      if (entry.sourceKind === 'pdf') {
        // Copy PDF directly
        fs.copyFileSync(entry.sourcePath!, outputAbsPath);
        const stats = fs.statSync(outputAbsPath);
        return {
          success: true,
          method: 'copy',
          size: stats.size,
          duration: Date.now() - startTime,
        };
      }
      
      if (entry.sourceKind === 'mdx' || entry.sourceKind === 'md') {
        // Use universal-converter for MDX/MD
        const result = await this.runUniversalConverter(entry.sourcePath!, outputAbsPath);
        return {
          success: result.success,
          method: 'universal-converter',
          error: result.error,
          size: result.size,
          duration: Date.now() - startTime,
        };
      }
      
      if (['xlsx', 'xls', 'pptx', 'ppt'].includes(entry.sourceKind!)) {
        // Use universal-converter for office files
        const result = await this.runUniversalConverter(entry.sourcePath!, outputAbsPath);
        return {
          success: result.success,
          method: 'universal-converter',
          error: result.error,
          size: result.size,
          duration: Date.now() - startTime,
        };
      }
      
      // Unknown type - create placeholder
      return await this.generatePlaceholderPDF(entry, outputAbsPath);
      
    } catch (error: any) {
      return {
        success: false,
        method: 'error',
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  private async runUniversalConverter(sourcePath: string, outputPath: string): Promise<{
  success: boolean;
  error?: string;
  size?: number;
}> {
  try {
    const { quickConvertToPDF } = await import('./quick-converter');
    const result = await quickConvertToPDF(sourcePath, outputPath, CONFIG.quality);
    
    return {
      success: result.success,
      error: result.error,
      size: result.size,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Quick converter failed: ${error.message}`,
    };
  }
}

  private async generatePlaceholderPDF(entry: ContentRegistryEntry, outputPath: string): Promise<{
    success: boolean;
    method: string;
    error?: string;
    size?: number;
    duration: number;
  }> {
    const startTime = Date.now();
    
    try {
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
      
      // Description
      page.drawText(entry.description, {
        x: 50,
        y: 700,
        size: 12,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
        maxWidth: 500,
      });
      
      // Metadata
      page.drawText(`Type: ${entry.type} | Tier: ${TIER_DISPLAY[entry.tier]} | Category: ${entry.category}`, {
        x: 50,
        y: 650,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText(`Generated: ${new Date().toLocaleString()}`, {
        x: 50,
        y: 630,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText("Note: This is a placeholder PDF. The actual content will be available soon.", {
        x: 50,
        y: 600,
        size: 10,
        font: font,
        color: rgb(0.7, 0.2, 0.2),
      });
      
      // Footer
      page.drawText("Abraham of London - Content Generation System", {
        x: 50,
        y: 50,
        size: 9,
        font: font,
        color: rgb(0.6, 0.6, 0.6),
      });
      
      const pdfBytes = await doc.save();
      fs.writeFileSync(outputPath, pdfBytes);
      
      const stats = fs.statSync(outputPath);
      return {
        success: true,
        method: 'placeholder',
        size: stats.size,
        duration: Date.now() - startTime,
      };
      
    } catch (error: any) {
      return {
        success: false,
        method: 'placeholder-error',
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
}

// ----------------------------------------------------------------------------
// REGISTRY GENERATION
class RegistryGenerator {
  static async generateRegistryFile(entries: ContentRegistryEntry[]): Promise<string> {
    const registryPath = path.join(CONFIG.scriptDir, "pdf", "pdf-registry.generated.ts");
    const now = new Date().toISOString();
    
    // Update MD5 checksums for existing files
    const updatedEntries = await Promise.all(
      entries.map(async (entry) => {
        if (entry.exists) {
          const filePath = path.join(process.cwd(), 'public', entry.outputPath);
          try {
            const buf = fs.readFileSync(filePath);
            entry.md5 = crypto.createHash('md5').update(buf).digest('hex');
          } catch {
            // Keep existing md5 or leave undefined
          }
        }
        return entry;
      })
    );
    
    const configs = updatedEntries.map(entry => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      excerpt: entry.excerpt,
      outputPath: entry.outputPath,
      type: entry.type,
      format: entry.format,
      isInteractive: entry.isInteractive,
      isFillable: entry.isFillable,
      category: entry.category,
      tier: TIER_SLUG[entry.tier] as any,
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
    
    await FileManager.ensureDir(path.dirname(registryPath));
    fs.writeFileSync(registryPath, registryContent, 'utf-8');
    
    Logger.file(`Generated registry: ${registryPath} (${configs.length} entries)`);
    return registryPath;
  }
}

// ----------------------------------------------------------------------------
// ENHANCED PDF GENERATION ORCHESTRATOR (with content scanning)
class PDFGenerationOrchestrator {
  private runner = new CommandRunner();
  private steps: Array<{
    name: string;
    ok: boolean;
    duration: number;
    error?: string;
    fallback?: boolean;
    at: string;
  }> = [];
  
  private start = Date.now();
  private generatedFiles: string[] = [];
  private contentHandler = new ContentGenerationHandler();
  
  async initialize(): Promise<{
    cleanedCount: number;
    backupDir: string;
    backupCount: number;
    contentScan?: {
      entries: ContentRegistryEntry[];
      summary: any;
    };
  }> {
    Logger.header("PDF GENERATION SYSTEM");
    Logger.info(`Platform: ${os.platform()} ${os.arch()}`);
    Logger.info(`Node: ${process.version}`);
    Logger.info(`Quality: ${CONFIG.quality}`);
    Logger.info(`Tier: ${TIER_DISPLAY[CONFIG.tier]} (${TIER_SLUG[CONFIG.tier]})`);
    Logger.info(`Output: ${CONFIG.outputDir}`);
    Logger.info(`Lib: ${CONFIG.libDir}`);
    Logger.separator();

    const cleanup = await FileManager.safeCleanup();
    await FileManager.ensureDir(CONFIG.outputDir);
    await FileManager.ensureDir(CONFIG.libDir);
    await this.runner.checkDependencies();
    
    // Scan content if enabled
    let contentScan;
    if (CONFIG.enableContentScan) {
      contentScan = await ContentScanner.scanAllContent();
    }

    Logger.success("Initialization complete");
    return { ...cleanup, contentScan };
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
    Logger.header("GENERATING FROM CONTENT");
    
    const toGenerate = entries.filter(entry => entry.needsGeneration);
    const skipped = entries.length - toGenerate.length;
    
    Logger.info(`Found ${toGenerate.length} files to generate (${skipped} already exist)`);
    
    const results = [];
    let generated = 0;
    let failed = 0;
    
    for (const entry of toGenerate) {
      Logger.start(`Generating: ${entry.title} (${entry.id})`);
      
      const result = await this.contentHandler.generateFromContentEntry(entry);
      
      results.push({
        id: entry.id,
        success: result.success,
        method: result.method,
        duration: result.duration,
        error: result.error,
        size: result.size,
      });
      
      if (result.success) {
        generated++;
        const size = result.size ? ` (${Math.round(result.size / 1024)}KB)` : '';
        Logger.success(`Generated: ${entry.title} via ${result.method}${size}`);
        this.generatedFiles.push(entry.id);
      } else {
        failed++;
        Logger.error(`Failed: ${entry.title}: ${result.error}`);
      }
    }
    
    return { generated, skipped, failed, results };
  }
  
  // ... Keep the rest of your existing methods (generateLegacyCanvas, runAdditionalGenerators, etc.)
  // Make sure to integrate them with the content scanning
  
  async run(formats: Format[], enableContent: boolean = true): Promise<{
    success: boolean;
    content?: {
      generated: number;
      skipped: number;
      failed: number;
      results: any[];
    };
    legacy?: any;
    validation: { validFiles: string[]; issues: string[]; total: number };
    cleanup: { cleanedCount: number; backupDir: string; backupCount: number };
  }> {
    const init = await this.initialize();
    
    let contentResults;
    if (enableContent && init.contentScan) {
      contentResults = await this.generateFromContent(init.contentScan.entries);
      
      // Generate registry file after content generation
      if (contentResults.generated > 0) {
        await RegistryGenerator.generateRegistryFile(init.contentScan.entries);
      }
    }
    
    // Run your existing legacy canvas generation here
    // await this.generateLegacyCanvas(formats);
    // await this.runAdditionalGenerators();
    
    const validation = await FileManager.validateFiles();
    
    return {
      success: contentResults ? contentResults.failed === 0 : true,
      content: contentResults,
      validation,
      cleanup: {
        cleanedCount: init.cleanedCount,
        backupDir: init.backupDir,
        backupCount: init.backupCount,
      },
    };
  }
}

// ----------------------------------------------------------------------------
// COMMAND RUNNER (keep existing)
class CommandRunner {
  private isWindows = os.platform() === "win32";
  private npxCmd = this.isWindows ? "npx.cmd" : "npx";

  async delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  async runWithRetry(
    name: string,
    script: string,
    args: string[] = [],
    options: { timeout?: number; cwd?: string; tier?: Tier; quality?: Quality; format?: Format } = {}
  ): Promise<{ code: number; duration: number; fallback?: boolean }> {
    let lastError: any;

    for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
      try {
        if (attempt > 1) {
          Logger.warn(`Retry ${attempt}/${CONFIG.retries}: ${name}`);
          await this.delay(CONFIG.retryDelay * attempt);
        }
        return await this.runCommand(name, script, args, options);
      } catch (e: any) {
        lastError = e;
        const msg = (e?.message || String(e)).toLowerCase();
        Logger.warn(`${name} failed: ${e?.message || String(e)}`);
        
        // If it's a missing script or dependency, don't retry
        if (msg.includes("enoent") || msg.includes("not found")) {
          throw e;
        }
        
        // Fallback logic (keep existing)
        if (attempt === CONFIG.retries && options.tier && options.quality && options.format) {
          // Your existing fallback logic
        }
      }
    }

    throw new Error(
      `Failed after ${CONFIG.retries} attempts: ${lastError?.message || String(lastError)}`
    );
  }

  async runCommand(
    name: string,
    script: string,
    args: string[] = [],
    options: { timeout?: number; cwd?: string } = {}
  ): Promise<{ code: number; duration: number }> {
    // Your existing implementation
    const { timeout = CONFIG.timeout, cwd = process.cwd() } = options;
    const start = Date.now();

    let command = script;
    let commandArgs = args;

    const lower = script.toLowerCase();
    if (lower.endsWith(".ts") || lower.endsWith(".tsx")) {
      command = this.npxCmd;
      commandArgs = ["tsx", script, ...args];
    }

    return new Promise<{ code: number; duration: number }>((resolve, reject) => {
      const child = spawn(command, commandArgs, {
        stdio: "inherit",
        shell: true,
        cwd,
        env: {
          ...process.env,
          NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=4096",
          PDF_QUALITY: CONFIG.quality,
          PDF_TIER: CONFIG.tier,
          PDF_CLEANUP: "true",
          FORCE_COLOR: "1",
        },
      });

      const timer =
        timeout && timeout > 0
          ? setTimeout(() => {
              if (child.exitCode === null) {
                try { child.kill("SIGTERM"); } catch {}
                reject(new Error(`Timeout after ${timeout}ms`));
              }
            }, timeout)
          : null;

      child.on("close", (code) => {
        if (timer) clearTimeout(timer);
        const duration = Date.now() - start;
        if (code === 0) {
          Logger.success(`Completed: ${name} (${duration}ms)`);
          resolve({ code: 0, duration });
        } else {
          Logger.error(`Failed: ${name} (${duration}ms)`);
          reject(Object.assign(new Error(`Exit code ${code}`), { code, duration }));
        }
      });

      child.on("error", (err) => {
        if (timer) clearTimeout(timer);
        Logger.error(`Error: ${name}: ${err.message}`);
        reject(err);
      });
    });
  }

  async checkDependencies(): Promise<void> {
    const missing: string[] = [];

    try { await import("tsx"); } catch { missing.push("tsx"); }
    try { await import("pdf-lib"); } catch { missing.push("pdf-lib"); }
    try { await import("gray-matter"); } catch { missing.push("gray-matter"); }

    if (!missing.length) {
      Logger.success("Dependencies OK (tsx, pdf-lib, gray-matter)");
      return;
    }

    Logger.warn(`Missing dependencies: ${missing.join(", ")}; attempting install...`);
    try {
      execSync(`npm install ${missing.join(" ")} --no-save`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      Logger.success("Dependencies installed");
    } catch (error: any) {
      Logger.error(`Failed to install dependencies: ${error?.message || String(error)}`);
      throw error;
    }
  }
}

// ----------------------------------------------------------------------------
// CLI ENTRY (with content scanning option)
async function cliMain(): Promise<void> {
  const args = process.argv.slice(2);

  let formatsArg = "all";
  let qualityArg: string | undefined;
  let tierArg: string | undefined;
  let forceClean = false;
  let skipContent = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === "--formats" || a.startsWith("--formats=")) {
      formatsArg = a.includes("=") ? a.split("=")[1] : (args[++i] || "all");
      continue;
    }
    if (a === "--quality" || a.startsWith("--quality=")) {
      qualityArg = a.includes("=") ? a.split("=")[1] : args[++i];
      continue;
    }
    if (a === "--tier" || a.startsWith("--tier=")) {
      tierArg = a.includes("=") ? a.split("=")[1] : args[++i];
      continue;
    }
    if (a === "--verbose" || a === "-v") {
      (CONFIG as any).logLevel = "debug";
      continue;
    }
    if (a === "--silent" || a === "-s") {
      (CONFIG as any).logLevel = "error";
      continue;
    }
    if (a === "--force-clean" || a === "-f") {
      forceClean = true;
      continue;
    }
    if (a === "--no-content" || a === "-nc") {
      skipContent = true;
      continue;
    }
    if (a === "--help" || a === "-h") {
      console.log(`
${Logger.colors.brightMagenta}╔══════════════════════════════════════════════════════════════╗
║         ENHANCED PDF GENERATION WITH CONTENT SCANNING        ║
╚══════════════════════════════════════════════════════════════╝${Logger.colors.reset}

${Logger.colors.brightCyan}Usage:${Logger.colors.reset}
  pnpm tsx scripts/generate-pdfs.ts [options]

${Logger.colors.brightCyan}Options:${Logger.colors.reset}
  --formats <all|a4|letter|a3|bundle>    Paper formats to generate
  --quality <premium|enterprise|draft>   Output quality level
  --tier <public|basic|premium|enterprise|restricted>  Access tier
  --force-clean, -f                      Force clean all outputs
  --no-content, -nc                      Skip content scanning/generation
  --verbose, -v                          Detailed debug output
  --silent, -s                           Minimal error-only output
  --help, -h                             Show this help

${Logger.colors.brightCyan}Examples:${Logger.colors.reset}
  ${Logger.colors.gray}# Full generation with content scanning${Logger.colors.reset}
  pnpm tsx scripts/generate-pdfs.ts
  
  ${Logger.colors.gray}# Generate with content scanning only${Logger.colors.reset}
  pnpm tsx scripts/generate-pdfs.ts --no-content
  
  ${Logger.colors.gray}# Enterprise quality for enterprise tier${Logger.colors.reset}
  pnpm tsx scripts/generate-pdfs.ts --quality enterprise --tier enterprise
`);
      process.exit(0);
    }
  }

  (CONFIG as any).quality = parseQuality(qualityArg);
  (CONFIG as any).tier = parseTier(tierArg);
  (CONFIG as any).enableContentScan = !skipContent;

  if (forceClean) {
    Logger.warn("FORCE CLEAN ENABLED - This will delete ALL PDF files!");
    for (const dir of [CONFIG.outputDir, CONFIG.libDir]) {
      if (await FileManager.exists(dir)) {
        const files = await fsp.readdir(dir).catch(() => []);
        for (const file of files) {
          if (file.endsWith(".pdf") || file.endsWith(".json")) {
            await fsp.unlink(path.join(dir, file)).catch(() => {});
          }
        }
      }
    }
    Logger.success("Force cleaned all PDF + JSON outputs");
  }

  const formats = parseFormats(formatsArg);
  const orchestrator = new PDFGenerationOrchestrator();

  try {
    const result = await orchestrator.run(formats, !skipContent);

    Logger.header("GENERATION COMPLETE");
    
    if (result.content) {
      Logger.info(`Content: ${result.content.generated} generated, ${result.content.skipped} skipped, ${result.content.failed} failed`);
    }
    
    Logger.info(`Validation: ${result.validation.validFiles.length}/${result.validation.total} valid PDFs`);
    
    if (result.success) {
      Logger.success(`${Logger.colors.brightGreen}🎉 PDF generation completed successfully!${Logger.colors.reset}`);
    } else {
      Logger.warn(`Completed with some failures`);
    }

    process.exit(result.success ? 0 : 1);
  } catch (error: any) {
    Logger.error(`Fatal error: ${error?.message || String(error)}`);
    process.exit(1);
  }
}

// Helper functions (keep existing)
function parseFormats(arg?: string): Format[] {
  const v = (arg || "all").toLowerCase().trim();
  if (v === "all") return ["A4", "Letter", "A3", "bundle"];
  const single = FORMAT_ALIASES[v];
  if (!single) return ["A4", "Letter", "A3", "bundle"];
  return [single];
}

function parseTier(v?: string): Tier {
  const s = (v || CONFIG.tier).toLowerCase();
  if (s === "public") return "public";
  if (s === "basic") return "basic";
  if (s === "premium") return "premium";
  if (s === "enterprise") return "enterprise";
  if (s === "restricted") return "restricted";
  return CONFIG.tier;
}

function parseQuality(v?: string): Quality {
  const s = (v || CONFIG.quality).toLowerCase();
  if (s === "enterprise") return "enterprise";
  if (s === "draft") return "draft";
  return "premium";
}

// ESM-safe: run only when invoked directly
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const here = path.resolve(__filename);
  return argv1 === here;
})();

if (invokedAsScript) {
  cliMain();
}

export { 
  PDFGenerationOrchestrator, 
  CommandRunner, 
  Logger, 
  FileManager, 
  ContentScanner,
  ContentGenerationHandler,
  RegistryGenerator 
};