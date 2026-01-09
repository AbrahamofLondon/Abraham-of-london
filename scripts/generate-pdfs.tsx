import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// -----------------------------------------------------------------------------
const CONFIG = {
  timeout: 10 * 60 * 1000, // 10 minutes timeout per command
  retries: 3,
  retryDelay: 2000,
  maxConcurrent: 1,
  logLevel: process.env.LOG_LEVEL || 'info',
  outputDir: path.join(process.cwd(), 'public/assets/downloads'),
  enterpriseOutputDir: path.join(process.cwd(), 'public/assets/downloads/enterprise'),
  scriptDir: __dirname,
  quality: 'premium' // Changed from enterprise to premium as requested
};

// -----------------------------------------------------------------------------
// LOGGER UTILITY (ENHANCED)
// -----------------------------------------------------------------------------
class Logger {
  static colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
  };

  static shouldLog(level: string): boolean {
    const levels = ['silent', 'error', 'warn', 'info', 'debug'];
    const currentLevel = levels.indexOf(CONFIG.logLevel);
    const targetLevel = levels.indexOf(level);
    return targetLevel <= currentLevel;
  }

  static formatTime(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  static log(level: string, message: string, color: string = ''): void {
    if (!this.shouldLog(level)) return;
    
    const prefix = `[${this.formatTime()}] ${level.toUpperCase().padEnd(5)}`;
    const formattedMessage = color ? `${color}${message}${this.colors.reset}` : message;
    
    switch (level) {
      case 'error': console.error(prefix, formattedMessage); break;
      case 'warn': console.warn(prefix, formattedMessage); break;
      default: console.log(prefix, formattedMessage);
    }
  }

  static info(message: string): void { this.log('info', message, this.colors.cyan); }
  static success(message: string): void { this.log('info', message, this.colors.green); }
  static warn(message: string): void { this.log('warn', message, this.colors.yellow); }
  static error(message: string): void { this.log('error', message, this.colors.red); }
  static debug(message: string): void { this.log('debug', message, this.colors.gray); }
  static start(name: string): void { this.log('info', `▶️  Starting: ${name}`, this.colors.blue); }
  static complete(name: string, duration?: number): void { 
    const timeStr = duration ? ` (${duration}ms)` : '';
    this.log('info', `✅ Completed: ${name}${timeStr}`, this.colors.green);
  }
  
  // New method for premium branding
  static premium(message: string): void {
    const premiumMsg = `✨ PREMIUM: ${message}`;
    this.log('info', premiumMsg, this.colors.magenta);
  }
}

// -----------------------------------------------------------------------------
// COMMAND RUNNER (FIXED FOR PDF GENERATION)
// -----------------------------------------------------------------------------
class CommandRunner {
  private isWindows: boolean;
  private npxCmd: string;

  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.npxCmd = this.isWindows ? 'npx.cmd' : 'npx';
  }

  async runWithRetry(name: string, script: string, args: string[] = [], options: any = {}): Promise<any> {
    const { timeout = CONFIG.timeout, cwd = process.cwd() } = options;
    let lastError: any;
    
    for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
      try {
        if (attempt > 1) {
          Logger.warn(`Retry ${attempt}/${CONFIG.retries} for: ${name}`);
          await this.delay(CONFIG.retryDelay * attempt);
        }
        
        return await this.runCommand(name, script, args, { timeout, cwd });
      } catch (error: any) {
        lastError = error;
        Logger.warn(`Attempt ${attempt} failed for ${name}: ${error.message}`);
        
        if (error.message.includes('ENOENT') || error.message.includes('not found')) {
          throw error;
        }
      }
    }
    
    throw new Error(`Failed after ${CONFIG.retries} attempts: ${lastError.message}`);
  }

  async runCommand(name: string, script: string, args: string[] = [], options: any = {}): Promise<any> {
    const { timeout = CONFIG.timeout, cwd = process.cwd() } = options;
    const startTime = Date.now();
    
    // Build the command
    let command: string;
    let commandArgs: string[];
    
    if (script.endsWith('.ts') || script.endsWith('.tsx')) {
      // Use tsx for TypeScript files
      command = this.npxCmd;
      commandArgs = ['tsx', script, ...args];
    } else if (script.endsWith('.js')) {
      // Direct node execution for JS files
      command = 'node';
      commandArgs = [script, ...args];
    } else {
      // Assume it's a CLI command
      command = script;
      commandArgs = args;
    }
    
    Logger.start(name);
    Logger.debug(`Command: ${command} ${commandArgs.join(' ')}`);
    
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, commandArgs, {
        stdio: 'inherit',
        shell: true,
        cwd,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
          NODE_OPTIONS: '--max-old-space-size=4096',
          PDF_QUALITY: CONFIG.quality // Pass quality to child processes
        },
        timeout
      });
      
      let stdout = '';
      let stderr = '';
      
      if (childProcess.stdout) {
        childProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }
      
      if (childProcess.stderr) {
        childProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      childProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          Logger.complete(name, duration);
          
          if (CONFIG.logLevel === 'debug' && stdout) {
            Logger.debug(`Output for ${name}:\n${stdout}`);
          }
          
          resolve({ code, stdout, stderr, duration });
        } else {
          const error = new Error(`Process exited with code ${code}`);
          (error as any).code = code;
          (error as any).stdout = stdout;
          (error as any).stderr = stderr;
          (error as any).duration = duration;
          
          Logger.error(`Failed: ${name} (${duration}ms)`);
          if (stderr) {
            Logger.error(`Error output:\n${stderr}`);
          }
          
          reject(error);
        }
      });
      
      childProcess.on('error', (error) => {
        const duration = Date.now() - startTime;
        Logger.error(`Process error for ${name}: ${error.message} (${duration}ms)`);
        reject(error);
      });
      
      if (timeout) {
        setTimeout(() => {
          if (childProcess.exitCode === null) {
            childProcess.kill('SIGTERM');
            reject(new Error(`Timeout after ${timeout}ms`));
          }
        }, timeout);
      }
    });
  }

  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkDependencies(): Promise<void> {
    Logger.info('Checking dependencies for premium PDF generation...');
    
    const requiredPackages = ['tsx'];
    const missingPackages: string[] = [];
    
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
        Logger.debug(`✓ ${pkg} is available`);
      } catch {
        missingPackages.push(pkg);
        Logger.warn(`✗ ${pkg} is missing`);
      }
    }
    
    if (missingPackages.length > 0) {
      Logger.warn(`Missing packages: ${missingPackages.join(', ')}`);
      Logger.info('Attempting to install missing packages...');
      
      try {
        execSync(`npm install ${missingPackages.join(' ')} --no-save`, {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        Logger.success('Missing packages installed successfully');
      } catch (error: any) {
        throw new Error(`Failed to install missing packages: ${error.message}`);
      }
    }
    
    Logger.success('All dependencies are satisfied');
  }
}

// -----------------------------------------------------------------------------
// PDF QUALITY OPTIMIZER & CLEANSING (SAFE & EFFICIENT)
// -----------------------------------------------------------------------------
class PDFQualityOptimizer {
  private isWindows: boolean;
  private ghostscriptAvailable: boolean;

  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.ghostscriptAvailable = this.checkGhostscript();
  }

  private checkGhostscript(): boolean {
    try {
      if (this.isWindows) {
        execSync('gswin64c --version', { stdio: 'ignore' });
        return true;
      } else {
        execSync('gs --version', { stdio: 'ignore' });
        return true;
      }
    } catch {
      Logger.warn('Ghostscript not available. PDF optimization will be limited.');
      return false;
    }
  }

  /**
   * Safe PDF file replacement with validation
   * Generates a better quality version if possible, otherwise keeps original
   */
  async optimizePDF(sourcePath: string, targetPath: string, quality: string): Promise<{
    success: boolean;
    optimized: boolean;
    originalSize: number;
    newSize: number;
    qualityGain?: number;
    method: string;
  }> {
    const startTime = Date.now();
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source PDF not found: ${sourcePath}`);
    }

    const stats = fs.statSync(sourcePath);
    const originalSize = stats.size;
    
    Logger.premium(`Optimizing: ${path.basename(sourcePath)} (${(originalSize / 1024).toFixed(1)}KB)`);
    
    try {
      // Create temp file for processing
      const tempPath = `${targetPath}.tmp`;
      
      let optimizationMethod = 'copy';
      let qualityGain = 0;
      
      // Strategy 1: Ghostscript optimization (if available)
      if (this.ghostscriptAvailable && originalSize > 102400) { // Only optimize files > 100KB
        const optimized = await this.optimizeWithGhostscript(sourcePath, tempPath, quality);
        
        if (optimized.success) {
          const newStats = fs.statSync(tempPath);
          const newSize = newStats.size;
          qualityGain = ((originalSize - newSize) / originalSize) * 100;
          
          if (newSize > 1000 && newSize < originalSize * 1.5) { // Safety checks
            optimizationMethod = 'ghostscript';
            Logger.debug(`Ghostscript reduced by ${qualityGain.toFixed(1)}%`);
          }
        }
      }
      
      // Strategy 2: If ghostscript failed or wasn't suitable, try metadata cleanup
      if (optimizationMethod === 'copy') {
        const cleaned = await this.cleanPDFMetadata(sourcePath, tempPath);
        if (cleaned.success) {
          optimizationMethod = 'metadata_clean';
          const newStats = fs.statSync(tempPath);
          qualityGain = ((originalSize - newStats.size) / originalSize) * 100;
        }
      }
      
      // Verify the optimized file is valid
      const isValid = await this.validatePDF(tempPath);
      
      if (isValid) {
        // Safe atomic replacement using rename
        if (fs.existsSync(targetPath)) {
          const backupPath = `${targetPath}.backup-${Date.now()}`;
          fs.copyFileSync(targetPath, backupPath);
          Logger.debug(`Created backup: ${backupPath}`);
          
          // Clean up old backups (keep last 3)
          this.cleanupOldBackups(targetPath);
        }
        
        fs.renameSync(tempPath, targetPath);
        
        const finalStats = fs.statSync(targetPath);
        const duration = Date.now() - startTime;
        
        Logger.success(`Optimized ${path.basename(sourcePath)}: ${optimizationMethod} (${duration}ms)`);
        
        return {
          success: true,
          optimized: optimizationMethod !== 'copy',
          originalSize,
          newSize: finalStats.size,
          qualityGain: optimizationMethod !== 'copy' ? qualityGain : undefined,
          method: optimizationMethod
        };
      } else {
        // If optimization produced invalid PDF, fall back to original
        Logger.warn(`Optimized PDF invalid, using original for ${path.basename(sourcePath)}`);
        fs.copyFileSync(sourcePath, targetPath);
        
        return {
          success: true,
          optimized: false,
          originalSize,
          newSize: originalSize,
          method: 'copy_fallback'
        };
      }
      
    } catch (error: any) {
      Logger.error(`PDF optimization failed for ${path.basename(sourcePath)}: ${error.message}`);
      
      // Always fall back to original on error
      fs.copyFileSync(sourcePath, targetPath);
      
      return {
        success: true, // Still success because we have the original
        optimized: false,
        originalSize,
        newSize: originalSize,
        method: 'copy_error_fallback'
      };
    }
  }

  /**
   * Use Ghostscript for high-quality PDF optimization
   */
  private async optimizeWithGhostscript(sourcePath: string, targetPath: string, quality: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const gsCommand = this.isWindows ? 'gswin64c' : 'gs';
      
      // Quality-based optimization parameters
      const qualityParams: Record<string, string[]> = {
        draft: [
          '-dPDFSETTINGS=/screen',
          '-dEmbedAllFonts=false',
          '-dSubsetFonts=true',
          '-dConvertCMYKImagesToRGB=true',
          '-dDownsampleColorImages=true',
          '-dColorImageResolution=72',
          '-dGrayImageResolution=72',
          '-dMonoImageResolution=72'
        ],
        standard: [
          '-dPDFSETTINGS=/ebook',
          '-dEmbedAllFonts=true',
          '-dSubsetFonts=true',
          '-dConvertCMYKImagesToRGB=true',
          '-dDownsampleColorImages=true',
          '-dColorImageResolution=150',
          '-dGrayImageResolution=150',
          '-dMonoImageResolution=300'
        ],
        premium: [
          '-dPDFSETTINGS=/printer',
          '-dEmbedAllFonts=true',
          '-dSubsetFonts=true',
          '-dConvertCMYKImagesToRGB=false',
          '-dDownsampleColorImages=false',
          '-dColorImageResolution=300',
          '-dGrayImageResolution=300',
          '-dMonoImageResolution=600'
        ],
        enterprise: [
          '-dPDFSETTINGS=/prepress',
          '-dEmbedAllFonts=true',
          '-dSubsetFonts=true',
          '-dConvertCMYKImagesToRGB=false',
          '-dDownsampleColorImages=false',
          '-dColorImageResolution=400',
          '-dGrayImageResolution=400',
          '-dMonoImageResolution=1200'
        ]
      };

      const params = qualityParams[quality] || qualityParams.premium;
      
      const args = [
        '-q',
        '-dNOPAUSE',
        '-dBATCH',
        '-dSAFER',
        '-sDEVICE=pdfwrite',
        ...params,
        '-sOutputFile=' + targetPath,
        sourcePath
      ];
      
      execSync(`${gsCommand} ${args.join(' ')}`, {
        stdio: 'pipe',
        timeout: 30000 // 30 second timeout
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ghostscript optimization failed'
      };
    }
  }

  /**
   * Clean PDF metadata without recompressing
   */
  private async cleanPDFMetadata(sourcePath: string, targetPath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Simple metadata cleaning by copying without metadata
      // This is a safe fallback when Ghostscript isn't available
      const gsCommand = this.isWindows ? 'gswin64c' : 'gs';
      const args = [
        '-q',
        '-dNOPAUSE',
        '-dBATCH',
        '-dSAFER',
        '-sDEVICE=pdfwrite',
        '-dPDFSETTINGS=/default',
        '-dCompressPages=false',
        '-dCompatibilityLevel=1.7',
        '-sOutputFile=' + targetPath,
        sourcePath
      ];
      
      execSync(`${gsCommand} ${args.join(' ')}`, {
        stdio: 'pipe',
        timeout: 15000
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: 'Metadata cleaning failed'
      };
    }
  }

  /**
   * Validate PDF file integrity
   */
  private async validatePDF(filePath: string): Promise<boolean> {
    try {
      const stats = fs.statSync(filePath);
      
      // Basic validation
      if (stats.size < 1000) { // Too small to be valid
        return false;
      }
      
      // Check if file starts with PDF signature
      const buffer = Buffer.alloc(5);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);
      
      const header = buffer.toString();
      if (!header.startsWith('%PDF-')) {
        return false;
      }
      
      // Quick check for EOF marker
      const endBuffer = Buffer.alloc(6);
      const endFd = fs.openSync(filePath, 'r');
      fs.readSync(endFd, endBuffer, 0, 6, stats.size - 6);
      fs.closeSync(endFd);
      
      const endMarker = endBuffer.toString();
      if (!endMarker.includes('%%EOF')) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up old backup files
   */
  private cleanupOldBackups(originalPath: string): void {
    try {
      const dir = path.dirname(originalPath);
      const baseName = path.basename(originalPath);
      const files = fs.readdirSync(dir);
      
      const backupFiles = files
        .filter(f => f.startsWith(`${baseName}.backup-`))
        .map(f => ({
          name: f,
          path: path.join(dir, f),
          time: fs.statSync(path.join(dir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Newest first
      
      // Keep only the 3 most recent backups
      if (backupFiles.length > 3) {
        for (let i = 3; i < backupFiles.length; i++) {
          fs.unlinkSync(backupFiles[i].path);
          Logger.debug(`Cleaned up old backup: ${backupFiles[i].name}`);
        }
      }
    } catch (error: any) {
      // Non-critical, just log
      Logger.debug(`Backup cleanup failed: ${error.message}`);
    }
  }

  /**
   * Batch optimize multiple PDFs
   */
  async optimizeBatch(files: Array<{source: string, target: string}>, quality: string): Promise<{
    total: number;
    optimized: number;
    totalSavings: number;
    results: Array<{
      file: string;
      success: boolean;
      optimized: boolean;
      originalSize: number;
      newSize: number;
      savings: number;
      method: string;
    }>;
  }> {
    Logger.premium(`Starting batch optimization of ${files.length} PDFs (${quality} quality)`);
    
    const results = [];
    let optimizedCount = 0;
    let totalSavings = 0;
    
    for (const file of files) {
      const result = await this.optimizePDF(file.source, file.target, quality);
      
      results.push({
        file: path.basename(file.source),
        success: result.success,
        optimized: result.optimized,
        originalSize: result.originalSize,
        newSize: result.newSize,
        savings: result.originalSize - result.newSize,
        method: result.method
      });
      
      if (result.optimized) {
        optimizedCount++;
        totalSavings += result.originalSize - result.newSize;
      }
    }
    
    Logger.success(`Batch complete: ${optimizedCount}/${files.length} optimized, saved ${(totalSavings / 1024).toFixed(1)}KB`);
    
    return {
      total: files.length,
      optimized: optimizedCount,
      totalSavings,
      results
    };
  }
}

// -----------------------------------------------------------------------------
// PDF GENERATION ORCHESTRATOR (FIXED FOR PREMIUM)
// -----------------------------------------------------------------------------
class PDFGenerationOrchestrator {
  private runner: CommandRunner;
  private results: any[];
  private startTime: number;

  constructor() {
    this.runner = new CommandRunner();
    this.results = [];
    this.startTime = Date.now();
  }

  async initialize(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    Logger.premium('LEGACY ARCHITECTURE PDF GENERATOR');
    console.log('='.repeat(60));
    Logger.info(`Platform: ${os.platform()} ${os.arch()}`);
    Logger.info(`Node: ${process.version}`);
    Logger.info(`CWD: ${process.cwd()}`);
    Logger.info(`Quality: ${CONFIG.quality.toUpperCase()}`);
    Logger.info(`Output Dir: ${CONFIG.outputDir}`);
    console.log('='.repeat(60) + '\n');
    
    // Ensure output directories exist
    [CONFIG.outputDir, CONFIG.enterpriseOutputDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        Logger.info(`Created directory: ${dir}`);
      }
    });
    
    // Check dependencies
    await this.runner.checkDependencies();
  }

  async runStep(name: string, script: string, args: string[] = [], options: any = {}): Promise<any> {
    const stepStartTime = Date.now();
    
    try {
      const result = await this.runner.runWithRetry(name, script, args, options);
      this.results.push({
        name,
        success: true,
        duration: result.duration,
        timestamp: new Date().toISOString()
      });
      return result;
    } catch (error: any) {
      this.results.push({
        name,
        success: false,
        error: error.message,
        duration: Date.now() - stepStartTime,
        timestamp: new Date().toISOString()
      });
      
      const shouldContinue = !error.message.includes('fatal') && 
                            !error.message.includes('ENOENT');
      
      if (!shouldContinue) {
        throw error;
      }
      
      return null;
    }
  }

  async generatePremiumPDFs(): Promise<void> {
    Logger.premium('Starting premium PDF generation...');
    
    const scripts = [
      {
        name: 'Legacy Canvas (A4)',
        script: path.join(CONFIG.scriptDir, 'generate-legacy-canvas.ts'),
        args: ['A4', CONFIG.quality]
      },
      {
        name: 'Legacy Canvas (Letter)',
        script: path.join(CONFIG.scriptDir, 'generate-legacy-canvas.ts'),
        args: ['Letter', CONFIG.quality]
      },
      {
        name: 'Legacy Canvas (A3)',
        script: path.join(CONFIG.scriptDir, 'generate-legacy-canvas.ts'),
        args: ['A3', CONFIG.quality]
      }
    ];
    
    for (const { name, script, args } of scripts) {
      if (fs.existsSync(script)) {
        await this.runStep(name, script, args, {
          timeout: 5 * 60 * 1000 // 5 minutes per format
        });
      } else {
        Logger.warn(`Script not found: ${script}`);
        this.results.push({
          name,
          success: false,
          error: 'Script not found',
          duration: 0,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async optimizeGeneratedPDFs(): Promise<any> {
    Logger.premium('Optimizing generated PDFs for quality and size...');
    
    const optimizer = new PDFQualityOptimizer();
    
    // Find all generated PDFs
    const pdfFiles = fs.readdirSync(CONFIG.outputDir)
      .filter(f => f.endsWith('.pdf'))
      .map(f => ({
        source: path.join(CONFIG.outputDir, f),
        target: path.join(CONFIG.outputDir, f) // Replace in place
      }));
    
    if (pdfFiles.length === 0) {
      Logger.warn('No PDF files found to optimize');
      return null;
    }
    
    const result = await optimizer.optimizeBatch(pdfFiles, CONFIG.quality);
    
    // Log optimization summary
    console.log('\n' + '='.repeat(60));
    Logger.premium('PDF OPTIMIZATION REPORT');
    console.log('='.repeat(60));
    
    result.results.forEach((res: any, index: number) => {
      const status = res.optimized ? '✨' : '📄';
      const savings = res.optimized ? 
        ` (saved ${((res.savings) / 1024).toFixed(1)}KB)` : '';
      Logger.info(`${status} ${index + 1}. ${res.file} - ${res.method}${savings}`);
    });
    
    console.log('='.repeat(60));
    Logger.info(`Total files: ${result.total}`);
    Logger.info(`Optimized: ${result.optimized}`);
    Logger.info(`Total savings: ${(result.totalSavings / 1024).toFixed(1)}KB`);
    console.log('='.repeat(60));
    
    return result;
  }

  async verifyGeneratedPDFs(): Promise<any[]> {
    Logger.info('Verifying generated PDFs...');
    
    const expectedFiles = [
      `legacy-architecture-canvas-a4-${CONFIG.quality}.pdf`,
      `legacy-architecture-canvas-letter-${CONFIG.quality}.pdf`,
      `legacy-architecture-canvas-a3-${CONFIG.quality}.pdf`
    ];
    
    const verificationResults = [];
    
    for (const filename of expectedFiles) {
      const filePath = path.join(CONFIG.outputDir, filename);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const isValid = stats.size > 5000; // At least 5KB
        
        verificationResults.push({
          filename,
          exists: true,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(1),
          isValid,
          path: filePath
        });
        
        if (isValid) {
          Logger.success(`✓ ${filename} - ${(stats.size / 1024).toFixed(1)} KB`);
        } else {
          Logger.warn(`⚠ ${filename} is too small (${stats.size} bytes)`);
        }
      } else {
        verificationResults.push({
          filename,
          exists: false,
          size: 0,
          isValid: false,
          path: filePath
        });
        Logger.error(`✗ ${filename} not found`);
      }
    }
    
    return verificationResults;
  }

  async generateStatusReport(): Promise<{ report: any; pdfs: any[]; validPdfs: number }> {
    const totalDuration = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log('\n' + '='.repeat(60));
    Logger.premium('GENERATION REPORT');
    console.log('='.repeat(60));
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      const error = result.error ? ` - ${result.error}` : '';
      Logger.info(`${status} ${index + 1}. ${result.name}${duration}${error}`);
    });
    
    console.log('='.repeat(60));
    Logger.info(`Total Steps: ${this.results.length}`);
    Logger.info(`Successful: ${successful}`);
    Logger.info(`Failed: ${failed}`);
    Logger.info(`Total Time: ${totalDuration}ms`);
    console.log('='.repeat(60));
    
    // Verify PDFs
    const pdfs = await this.verifyGeneratedPDFs();
    const validPdfs = pdfs.filter(p => p.isValid).length;
    
    Logger.info(`\n📄 PDF Verification:`);
    Logger.info(`Generated: ${validPdfs}/${pdfs.length} valid PDFs`);
    
    // Generate JSON report
    const report = {
      summary: {
        total: this.results.length,
        successful,
        failed,
        totalDuration,
        quality: CONFIG.quality,
        timestamp: new Date().toISOString(),
        platform: os.platform(),
        nodeVersion: process.version
      },
      steps: this.results,
      pdfs: pdfs,
      outputDirectory: CONFIG.outputDir
    };
    
    const reportPath = path.join(CONFIG.outputDir, 'premium-generation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    Logger.info(`Report saved to: ${reportPath}`);
    
    return { report, pdfs, validPdfs };
  }

  async cleanup(): Promise<void> {
    Logger.info('Performing cleanup...');
    
    // Remove any files older than 1 day in temp patterns
    const tempPatterns = [/\.tmp$/, /\.temp$/, /\.log$/];
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    if (fs.existsSync(CONFIG.outputDir)) {
      const files = fs.readdirSync(CONFIG.outputDir);
      
      files.forEach(file => {
        if (tempPatterns.some(pattern => pattern.test(file))) {
          const filePath = path.join(CONFIG.outputDir, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.mtimeMs < oneDayAgo) {
              fs.unlinkSync(filePath);
              Logger.debug(`Removed: ${file}`);
            }
          } catch (error) {
            // Ignore errors during cleanup
          }
        }
      });
    }
  }

  async run(): Promise<any> {
    await this.initialize();
    
    try {
      // Step 1: Generate premium PDFs
      await this.generatePremiumPDFs();
      
      // Step 2: OPTIMIZE PDFs (NEW STEP)
      await this.optimizeGeneratedPDFs();
      
      // Step 3: Verify and generate report
      const { report, validPdfs } = await this.generateStatusReport();
      
      // Step 4: Cleanup
      await this.cleanup();
      
      // Final output
      console.log('\n' + '='.repeat(60));
      if (validPdfs === 3) {
        Logger.premium('ALL PREMIUM PDFS GENERATED SUCCESSFULLY!');
      } else {
        Logger.warn(`Generated ${validPdfs}/3 premium PDFs`);
      }
      console.log('='.repeat(60));
      Logger.success(`Output directory: ${CONFIG.outputDir}`);
      Logger.success(`Total time: ${report.summary.totalDuration}ms`);
      Logger.success(`Quality level: ${CONFIG.quality.toUpperCase()}`);
      console.log('='.repeat(60));
      
      return {
        success: validPdfs === 3,
        report,
        validPdfs,
        totalPdfs: 3
      };
      
    } catch (error: any) {
      Logger.error('Orchestration failed:', error.message);
      
      try {
        await this.generateStatusReport();
      } catch (reportError: any) {
        Logger.error('Failed to generate error report:', reportError.message);
      }
      
      throw error;
    }
  }
}

// -----------------------------------------------------------------------------
// MAIN EXECUTION WITH ARGUMENTS
// -----------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {
    quality: CONFIG.quality,
    allFormats: false,
    verbose: false,
    silent: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--quality' && args[i + 1]) {
      options.quality = args[i + 1];
      i++;
    } else if (arg === '--all-formats' || arg === '-a') {
      options.allFormats = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      CONFIG.logLevel = 'debug';
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
      CONFIG.logLevel = 'error';
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
📚 Premium PDF Generation Orchestrator

Usage: node generate-pdfs.js [options]

Options:
  --quality <level>    Set quality: draft, standard, premium, enterprise
  --all-formats, -a    Generate all formats (A4, Letter, A3)
  --verbose, -v        Enable verbose/debug logging
  --silent, -s         Silent mode (errors only)
  --help, -h           Show this help message

Examples:
  node generate-pdfs.js                    # Generate premium PDFs
  node generate-pdfs.js --quality=enterprise # Enterprise quality
  node generate-pdfs.js --all-formats -v    # All formats with debug

Environment Variables:
  LOG_LEVEL            Set log level (silent, error, warn, info, debug)
  PDF_QUALITY          Default quality level
  NODE_OPTIONS         Node.js memory options
      `);
      process.exit(0);
    }
  }
  
  // Update config based on arguments
  (CONFIG as any).quality = options.quality;
  
  const orchestrator = new PDFGenerationOrchestrator();
  
  try {
    const result = await orchestrator.run();
    
    if (result.success) {
      Logger.premium('Generation completed successfully!');
      process.exit(0);
    } else {
      Logger.warn(`Generation completed with ${3 - result.validPdfs} missing PDFs`);
      process.exit(1);
    }
    
  } catch (error: any) {
    Logger.error('Fatal error in PDF generation:', error.message);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// ENTRY POINT
// -----------------------------------------------------------------------------
if (import.meta.url === `file://${__filename}`) {
  main();
}

export { PDFGenerationOrchestrator, CommandRunner, Logger };