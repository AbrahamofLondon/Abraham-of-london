import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// -----------------------------------------------------------------------------
// TYPES & EXPORTS
// -----------------------------------------------------------------------------

export interface PDFGenerationConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  quality?: 'draft' | 'standard' | 'premium' | 'enterprise';
  outputDir?: string;
  enterpriseOutputDir?: string;
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug';
}

export interface GenerationResult {
  name: string;
  success: boolean;
  duration: number;
  size?: number;
  error?: string;
  timestamp: string;
}

export interface PDFFile {
  source: string;
  target: string;
}

export interface OptimizationResult {
  success: boolean;
  optimized: boolean;
  originalSize: number;
  newSize: number;
  qualityGain?: number;
  method: string;
}

/**
 * EXPORTED CONSTANTS (Fixes build worker error 10:3)
 */
export const DEFAULT_CONFIG: PDFGenerationConfig = {
  timeout: 10 * 60 * 1000, // 10 minutes
  retries: 3,
  retryDelay: 2000,
  quality: 'premium',
  outputDir: path.join(process.cwd(), 'public/assets/downloads'),
  enterpriseOutputDir: path.join(process.cwd(), 'public/assets/downloads/enterprise'),
  logLevel: 'info'
};

// -----------------------------------------------------------------------------
// INSTITUTIONAL LOGGER
// -----------------------------------------------------------------------------

class Logger {
  static colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
  };

  private static config: PDFGenerationConfig = DEFAULT_CONFIG;

  static setConfig(config: PDFGenerationConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private static shouldLog(level: string): boolean {
    const levels = ['silent', 'error', 'warn', 'info', 'debug'];
    const currentLevel = levels.indexOf(this.config.logLevel || 'info');
    const targetLevel = levels.indexOf(level);
    return targetLevel <= currentLevel;
  }

  private static formatTime(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  private static log(level: string, message: string, color: string = ''): void {
    if (!this.shouldLog(level)) return;
    const prefix = `[${this.formatTime()}] ${level.toUpperCase().padEnd(5)}`;
    const formatted = color ? `${color}${message}${this.colors.reset}` : message;
    
    switch (level) {
      case 'error': console.error(prefix, formatted); break;
      case 'warn': console.warn(prefix, formatted); break;
      default: console.log(prefix, formatted);
    }
  }

  static info(message: string): void { this.log('info', message, this.colors.cyan); }
  static success(message: string): void { this.log('info', message, this.colors.green); }
  static warn(message: string): void { this.log('warn', message, this.colors.yellow); }
  static error(message: string): void { this.log('error', message, this.colors.red); }
  static debug(message: string): void { this.log('debug', message, this.colors.gray); }
  static start(name: string): void { this.log('info', `▶️ Starting: ${name}`, this.colors.blue); }
  static complete(name: string, dur?: number): void { 
    this.log('info', `✅ Completed: ${name}${dur ? ` (${dur}ms)` : ''}`, this.colors.green); 
  }
}

// -----------------------------------------------------------------------------
// COMMAND RUNNER (Sovereign Execution)
// -----------------------------------------------------------------------------

export class CommandRunner {
  private isWindows: boolean;
  private npxCmd: string;
  private config: PDFGenerationConfig;

  constructor(config: PDFGenerationConfig = DEFAULT_CONFIG) {
    this.isWindows = os.platform() === 'win32';
    this.npxCmd = this.isWindows ? 'npx.cmd' : 'npx';
    this.config = { ...DEFAULT_CONFIG, ...config };
    Logger.setConfig(this.config);
  }

  async runWithRetry(name: string, script: string, args: string[] = [], options: any = {}): Promise<any> {
    const { timeout = this.config.timeout } = options;
    let lastError: any;
    
    for (let attempt = 1; attempt <= (this.config.retries || 3); attempt++) {
      try {
        if (attempt > 1) {
          Logger.warn(`Retry ${attempt}/${this.config.retries} for: ${name}`);
          await new Promise(r => setTimeout(r, (this.config.retryDelay || 2000) * attempt));
        }
        return await this.runCommand(name, script, args, options);
      } catch (error: any) {
        lastError = error;
        if (error.message.includes('ENOENT')) throw error;
      }
    }
    throw new Error(`Failed after ${this.config.retries} attempts: ${lastError.message}`);
  }

  async runCommand(name: string, script: string, args: string[] = [], options: any = {}): Promise<any> {
    const { timeout = this.config.timeout, cwd = process.cwd() } = options;
    const startTime = Date.now();
    
    let command = script;
    let commandArgs = args;

    if (script.endsWith('.ts') || script.endsWith('.tsx')) {
      command = this.npxCmd;
      commandArgs = ['tsx', script, ...args];
    } else if (script.endsWith('.js')) {
      command = 'node';
      commandArgs = [script, ...args];
    }

    Logger.start(name);
    
    return new Promise((resolve, reject) => {
      const child = spawn(command, commandArgs, {
        stdio: 'inherit',
        shell: true,
        cwd,
        env: { ...process.env, PDF_QUALITY: this.config.quality || 'premium' },
        timeout
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        if (code === 0) {
          Logger.complete(name, duration);
          resolve({ code, duration });
        } else {
          Logger.error(`Process failed: ${name} (Code: ${code})`);
          reject(new Error(`Exit code ${code}`));
        }
      });

      child.on('error', (err) => reject(err));
    });
  }

  async checkDependencies(): Promise<void> {
    Logger.info('Verifying Environment Dependencies...');
    try {
      execSync(`${this.npxCmd} tsx --version`, { stdio: 'ignore' });
      Logger.success('✓ Core dependencies verified.');
    } catch {
      Logger.warn('! tsx missing. Attempting critical recovery...');
      execSync('npm install tsx --no-save', { stdio: 'inherit' });
    }
  }
}

// -----------------------------------------------------------------------------
// PDF QUALITY OPTIMIZER (Ghostscript Implementation)
// -----------------------------------------------------------------------------

export class PDFQualityOptimizer {
  private isWindows: boolean;
  private gsAvailable: boolean;
  private config: PDFGenerationConfig;

  constructor(config: PDFGenerationConfig = DEFAULT_CONFIG) {
    this.isWindows = os.platform() === 'win32';
    this.config = config;
    this.gsAvailable = this.checkGS();
  }

  private checkGS(): boolean {
    try {
      const cmd = this.isWindows ? 'gswin64c --version' : 'gs --version';
      execSync(cmd, { stdio: 'ignore' });
      return true;
    } catch {
      Logger.warn('Ghostscript not found. Skipping advanced compression.');
      return false;
    }
  }

  async optimizePDF(source: string, target: string): Promise<OptimizationResult> {
    const originalSize = fs.statSync(source).size;
    const tempPath = `${target}.tmp`;

    if (!this.gsAvailable || originalSize < 100 * 1024) {
      return { success: true, optimized: false, originalSize, newSize: originalSize, method: 'skipped' };
    }

    try {
      const gsCmd = this.isWindows ? 'gswin64c' : 'gs';
      const qualityMap = {
        draft: '/screen',
        standard: '/ebook',
        premium: '/printer',
        enterprise: '/prepress'
      };

      const args = [
        '-q -dNOPAUSE -dBATCH -dSAFER',
        '-sDEVICE=pdfwrite',
        `-dPDFSETTINGS=${qualityMap[this.config.quality || 'premium']}`,
        `-sOutputFile="${tempPath}"`,
        `"${source}"`
      ];

      execSync(`${gsCmd} ${args.join(' ')}`, { stdio: 'pipe' });

      const newSize = fs.statSync(tempPath).size;
      if (newSize < originalSize) {
        fs.renameSync(tempPath, target);
        return { 
          success: true, 
          optimized: true, 
          originalSize, 
          newSize, 
          qualityGain: ((originalSize - newSize) / originalSize) * 100,
          method: 'ghostscript' 
        };
      }
      fs.unlinkSync(tempPath);
      return { success: true, optimized: false, originalSize, newSize: originalSize, method: 'original_better' };
    } catch (e) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return { success: false, optimized: false, originalSize, newSize: originalSize, method: 'error' };
    }
  }

  async optimizeBatch(files: PDFFile[]) {
    Logger.info(`⚖️ Optimizing ${files.length} assets...`);
    let savings = 0;
    for (const file of files) {
      const res = await this.optimizePDF(file.source, file.target);
      if (res.optimized) savings += (res.originalSize - res.newSize);
    }
    Logger.success(`Optimization complete. Total saved: ${(savings / 1024 / 1024).toFixed(2)} MB`);
  }
}

// -----------------------------------------------------------------------------
// MAIN EXECUTION LOGIC
// -----------------------------------------------------------------------------

export async function generatePDFBatch(config: PDFGenerationConfig = DEFAULT_CONFIG) {
  const startTime = Date.now();
  const runner = new CommandRunner(config);
  const optimizer = new PDFQualityOptimizer(config);
  const results: GenerationResult[] = [];

  const out = config.outputDir || DEFAULT_CONFIG.outputDir!;
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

  await runner.checkDependencies();

  const taskList = [
    { name: 'Canvas (A4)', script: 'scripts/generate-legacy-canvas.ts', args: ['A4'] },
    { name: 'Canvas (Letter)', script: 'scripts/generate-legacy-canvas.ts', args: ['Letter'] },
    { name: 'Canvas (A3)', script: 'scripts/generate-legacy-canvas.ts', args: ['A3'] }
  ];

  for (const task of taskList) {
    const fullScriptPath = path.join(process.cwd(), task.script);
    if (!fs.existsSync(fullScriptPath)) continue;

    try {
      const res = await runner.runWithRetry(task.name, fullScriptPath, task.args);
      results.push({
        name: task.name,
        success: true,
        duration: res.duration,
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      results.push({
        name: task.name,
        success: false,
        duration: 0,
        error: e.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  const pdfFiles = fs.readdirSync(out)
    .filter(f => f.endsWith('.pdf'))
    .map(f => ({ source: path.join(out, f), target: path.join(out, f) }));

  await optimizer.optimizeBatch(pdfFiles);

  return {
    success: results.every(r => r.success),
    results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalDuration: Date.now() - startTime
    }
  };
}

export async function verifyGeneratedPDFs(config: PDFGenerationConfig = DEFAULT_CONFIG) {
  const out = config.outputDir || DEFAULT_CONFIG.outputDir!;
  const files = fs.readdirSync(out).filter(f => f.endsWith('.pdf'));
  
  return files.map(f => {
    const stats = fs.statSync(path.join(out, f));
    return {
      filename: f,
      exists: true,
      sizeKB: (stats.size / 1024).toFixed(1),
      isValid: stats.size > 5000,
      path: path.join(out, f)
    };
  });
}