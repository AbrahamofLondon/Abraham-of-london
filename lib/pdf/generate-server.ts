// lib/pdf/generate-server.ts
'use server';

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  PDFGenerationConfig,
  DEFAULT_CONFIG,
  GenerationResult,
  PDFFile,
  OptimizationResult,
  getStaticScriptConfigs,
  ensureOutputDirectories,
  getPDFFilesInDirectory,
  createMockGenerationResult
} from './generate';

// -----------------------------------------------------------------------------
// SERVER-ONLY LOGGER
// -----------------------------------------------------------------------------
class ServerLogger {
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

  private config: PDFGenerationConfig;

  constructor(config: PDFGenerationConfig) {
    this.config = config;
  }

  private shouldLog(level: string): boolean {
    const levels = ['silent', 'error', 'warn', 'info', 'debug'];
    const currentLevel = levels.indexOf(this.config.logLevel || 'info');
    const targetLevel = levels.indexOf(level);
    return targetLevel <= currentLevel;
  }

  private formatTime(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  private log(level: string, message: string, color: string = ''): void {
    if (!this.shouldLog(level)) return;
    
    const prefix = `[${this.formatTime()}] ${level.toUpperCase().padEnd(5)}`;
    const formattedMessage = color ? `${color}${message}${this.colors.reset}` : message;
    
    switch (level) {
      case 'error': console.error(prefix, formattedMessage); break;
      case 'warn': console.warn(prefix, formattedMessage); break;
      default: console.log(prefix, formattedMessage);
    }
  }

  info(message: string): void { this.log('info', message, ServerLogger.colors.cyan); }
  success(message: string): void { this.log('info', message, ServerLogger.colors.green); }
  warn(message: string): void { this.log('warn', message, ServerLogger.colors.yellow); }
  error(message: string): void { this.log('error', message, ServerLogger.colors.red); }
  debug(message: string): void { this.log('debug', message, ServerLogger.colors.gray); }
  start(name: string): void { this.log('info', `▶️  Starting: ${name}`, ServerLogger.colors.blue); }
  complete(name: string, duration?: number): void { 
    const timeStr = duration ? ` (${duration}ms)` : '';
    this.log('info', `✅ Completed: ${name}${timeStr}`, ServerLogger.colors.green);
  }
}

// -----------------------------------------------------------------------------
// SERVER-ONLY COMMAND RUNNER
// -----------------------------------------------------------------------------
class ServerCommandRunner {
  private isWindows: boolean;
  private npxCmd: string;
  private config: PDFGenerationConfig;
  private logger: ServerLogger;

  constructor(config: PDFGenerationConfig = DEFAULT_CONFIG) {
    this.isWindows = os.platform() === 'win32';
    this.npxCmd = this.isWindows ? 'npx.cmd' : 'npx';
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new ServerLogger(config);
  }

  async runWithRetry(name: string, script: string, args: string[] = [], options: any = {}): Promise<any> {
    const { timeout = this.config.timeout, cwd = process.cwd() } = options;
    let lastError: any;
    
    for (let attempt = 1; attempt <= (this.config.retries || 3); attempt++) {
      try {
        if (attempt > 1) {
          this.logger.warn(`Retry ${attempt}/${this.config.retries} for: ${name}`);
          await this.delay((this.config.retryDelay || 2000) * attempt);
        }
        
        return await this.runCommand(name, script, args, { timeout, cwd });
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt} failed for ${name}: ${error.message}`);
        
        if (error.message.includes('ENOENT') || error.message.includes('not found')) {
          throw error;
        }
      }
    }
    
    throw new Error(`Failed after ${this.config.retries} attempts: ${lastError.message}`);
  }

  async runCommand(name: string, script: string, args: string[] = [], options: any = {}): Promise<any> {
    const { timeout = this.config.timeout, cwd = process.cwd() } = options;
    const startTime = Date.now();
    
    // Build the command
    let command: string;
    let commandArgs: string[];
    
    if (script.endsWith('.ts') || script.endsWith('.tsx')) {
      command = this.npxCmd;
      commandArgs = ['tsx', script, ...args];
    } else if (script.endsWith('.js')) {
      command = 'node';
      commandArgs = [script, ...args];
    } else {
      command = script;
      commandArgs = args;
    }
    
    this.logger.start(name);
    this.logger.debug(`Command: ${command} ${commandArgs.join(' ')}`);
    
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, commandArgs, {
        stdio: 'inherit',
        shell: true,
        cwd,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
          NODE_OPTIONS: '--max-old-space-size=4096',
          PDF_QUALITY: this.config.quality || 'premium'
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
          this.logger.complete(name, duration);
          
          if (this.config.logLevel === 'debug' && stdout) {
            this.logger.debug(`Output for ${name}:\n${stdout}`);
          }
          
          resolve({ code, stdout, stderr, duration });
        } else {
          const error = new Error(`Process exited with code ${code}`);
          (error as any).code = code;
          (error as any).stdout = stdout;
          (error as any).stderr = stderr;
          (error as any).duration = duration;
          
          this.logger.error(`Failed: ${name} (${duration}ms)`);
          if (stderr) {
            this.logger.error(`Error output:\n${stderr}`);
          }
          
          reject(error);
        }
      });
      
      childProcess.on('error', (error) => {
        const duration = Date.now() - startTime;
        this.logger.error(`Process error for ${name}: ${error.message} (${duration}ms)`);
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
    this.logger.info('Checking dependencies for PDF generation...');
    
    const requiredPackages = ['tsx'];
    const missingPackages: string[] = [];
    
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
        this.logger.debug(`✓ ${pkg} is available`);
      } catch {
        missingPackages.push(pkg);
        this.logger.warn(`✗ ${pkg} is missing`);
      }
    }
    
    if (missingPackages.length > 0) {
      this.logger.warn(`Missing packages: ${missingPackages.join(', ')}`);
      this.logger.info('Attempting to install missing packages...');
      
      try {
        execSync(`npm install ${missingPackages.join(' ')} --no-save`, {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        this.logger.success('Missing packages installed successfully');
      } catch (error: any) {
        throw new Error(`Failed to install missing packages: ${error.message}`);
      }
    }
    
    this.logger.success('All dependencies are satisfied');
  }
}

// -----------------------------------------------------------------------------
// SERVER-ONLY PDF QUALITY OPTIMIZER
// -----------------------------------------------------------------------------
class ServerPDFQualityOptimizer {
  private isWindows: boolean;
  private ghostscriptAvailable: boolean;
  private config: PDFGenerationConfig;
  private logger: ServerLogger;

  constructor(config: PDFGenerationConfig = DEFAULT_CONFIG) {
    this.isWindows = os.platform() === 'win32';
    this.ghostscriptAvailable = this.checkGhostscript();
    this.config = config;
    this.logger = new ServerLogger(config);
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
      this.logger.warn('Ghostscript not available. PDF optimization will be limited.');
      return false;
    }
  }

  async optimizePDF(sourcePath: string, targetPath: string): Promise<OptimizationResult> {
    const startTime = Date.now();
    const quality = this.config.quality || 'premium';
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source PDF not found: ${sourcePath}`);
    }

    const stats = fs.statSync(sourcePath);
    const originalSize = stats.size;
    
    this.logger.info(`Optimizing: ${path.basename(sourcePath)} (${(originalSize / 1024).toFixed(1)}KB)`);
    
    try {
      const tempPath = `${targetPath}.tmp`;
      let optimizationMethod = 'copy';
      let qualityGain = 0;
      
      if (this.ghostscriptAvailable && originalSize > 102400) {
        const optimized = await this.optimizeWithGhostscript(sourcePath, tempPath, quality);
        
        if (optimized.success) {
          const newStats = fs.statSync(tempPath);
          const newSize = newStats.size;
          qualityGain = ((originalSize - newSize) / originalSize) * 100;
          
          if (newSize > 1000 && newSize < originalSize * 1.5) {
            optimizationMethod = 'ghostscript';
            this.logger.debug(`Ghostscript reduced by ${qualityGain.toFixed(1)}%`);
          }
        }
      }
      
      if (optimizationMethod === 'copy') {
        const cleaned = await this.cleanPDFMetadata(sourcePath, tempPath);
        if (cleaned.success) {
          optimizationMethod = 'metadata_clean';
          const newStats = fs.statSync(tempPath);
          qualityGain = ((originalSize - newStats.size) / originalSize) * 100;
        }
      }
      
      const isValid = await this.validatePDF(tempPath);
      
      if (isValid) {
        if (fs.existsSync(targetPath)) {
          const backupPath = `${targetPath}.backup-${Date.now()}`;
          fs.copyFileSync(targetPath, backupPath);
          this.logger.debug(`Created backup: ${backupPath}`);
          this.cleanupOldBackups(targetPath);
        }
        
        fs.renameSync(tempPath, targetPath);
        const finalStats = fs.statSync(targetPath);
        const duration = Date.now() - startTime;
        
        this.logger.success(`Optimized ${path.basename(sourcePath)}: ${optimizationMethod} (${duration}ms)`);
        
        return {
          success: true,
          optimized: optimizationMethod !== 'copy',
          originalSize,
          newSize: finalStats.size,
          qualityGain: optimizationMethod !== 'copy' ? qualityGain : undefined,
          method: optimizationMethod
        };
      } else {
        this.logger.warn(`Optimized PDF invalid, using original for ${path.basename(sourcePath)}`);
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
      this.logger.error(`PDF optimization failed for ${path.basename(sourcePath)}: ${error.message}`);
      
      fs.copyFileSync(sourcePath, targetPath);
      
      return {
        success: true,
        optimized: false,
        originalSize,
        newSize: originalSize,
        method: 'copy_error_fallback'
      };
    }
  }

  private async optimizeWithGhostscript(sourcePath: string, targetPath: string, quality: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const gsCommand = this.isWindows ? 'gswin64c' : 'gs';
      
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
        timeout: 30000
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ghostscript optimization failed'
      };
    }
  }

  private async cleanPDFMetadata(sourcePath: string, targetPath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
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
    } catch {
      return {
        success: false,
        error: 'Metadata cleaning failed'
      };
    }
  }

  private async validatePDF(filePath: string): Promise<boolean> {
    try {
      const stats = fs.statSync(filePath);
      
      if (stats.size < 1000) {
        return false;
      }
      
      const buffer = Buffer.alloc(5);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);
      
      const header = buffer.toString();
      if (!header.startsWith('%PDF-')) {
        return false;
      }
      
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
        .sort((a, b) => b.time - a.time);
      
      if (backupFiles.length > 3) {
        for (let i = 3; i < backupFiles.length; i++) {
          fs.unlinkSync(backupFiles[i].path);
          this.logger.debug(`Cleaned up old backup: ${backupFiles[i].name}`);
        }
      }
    } catch (error: any) {
      this.logger.debug(`Backup cleanup failed: ${error.message}`);
    }
  }

  async optimizeBatch(files: PDFFile[]): Promise<{
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
    this.logger.info(`Starting batch optimization of ${files.length} PDFs`);
    
    const results = [];
    let optimizedCount = 0;
    let totalSavings = 0;
    
    for (const file of files) {
      const result = await this.optimizePDF(file.source, file.target);
      
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
    
    this.logger.success(`Batch complete: ${optimizedCount}/${files.length} optimized, saved ${(totalSavings / 1024).toFixed(1)}KB`);
    
    return {
      total: files.length,
      optimized: optimizedCount,
      totalSavings,
      results
    };
  }
}

// -----------------------------------------------------------------------------
// MAIN GENERATION FUNCTION (SERVER-ONLY)
// -----------------------------------------------------------------------------
export async function generatePDFBatch(config: PDFGenerationConfig = DEFAULT_CONFIG): Promise<{
  success: boolean;
  results: GenerationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalDuration: number;
  };
}> {
  const startTime = Date.now();
  const results: GenerationResult[] = [];
  const runner = new ServerCommandRunner(config);
  const optimizer = new ServerPDFQualityOptimizer(config);
  const logger = new ServerLogger(config);
  
  // Ensure output directories exist
  const outputDir = config.outputDir || DEFAULT_CONFIG.outputDir!;
  const enterpriseOutputDir = config.enterpriseOutputDir || DEFAULT_CONFIG.enterpriseOutputDir!;
  
  [outputDir, enterpriseOutputDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
  
  // Check dependencies
  await runner.checkDependencies();
  
  logger.info(`Starting PDF generation (${config.quality || 'premium'} quality)`);
  
  try {
    // Generate PDFs - using static script paths
    const scripts = getStaticScriptConfigs(config.quality || 'premium');
    
    for (const { name, script, args } of scripts) {
      const stepStartTime = Date.now();
      
      if (fs.existsSync(script)) {
        try {
          const result = await runner.runWithRetry(name, script, args, {
            timeout: 5 * 60 * 1000 // 5 minutes
          });
          
          results.push({
            name,
            success: true,
            duration: result.duration,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          results.push({
            name,
            success: false,
            error: error.message,
            duration: Date.now() - stepStartTime,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        logger.warn(`Script not found: ${script}`);
        results.push({
          name,
          success: false,
          error: 'Script not found',
          duration: 0,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Optimize generated PDFs
    const pdfFiles = getPDFFilesInDirectory(outputDir);
    
    if (pdfFiles.length > 0) {
      await optimizer.optimizeBatch(pdfFiles);
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = Date.now() - startTime;
    
    logger.success(`Generation complete: ${successful} successful, ${failed} failed`);
    
    return {
      success: failed === 0,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        totalDuration
      }
    };
    
  } catch (error: any) {
    logger.error('PDF generation failed:', error.message);
    
    return {
      success: false,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalDuration: Date.now() - startTime
      }
    };
  }
}

// -----------------------------------------------------------------------------
// HELPER FUNCTION FOR API ROUTES
// -----------------------------------------------------------------------------
export async function generatePDFsForAPI(config: PDFGenerationConfig = DEFAULT_CONFIG) {
  try {
    const result = await generatePDFBatch(config);
    return {
      success: result.success,
      summary: result.summary,
      details: result.results.map(r => ({
        name: r.name,
        success: r.success,
        duration: r.duration,
        error: r.error
      }))
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      details: []
    };
  }
}