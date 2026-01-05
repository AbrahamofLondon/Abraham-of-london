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

  static shouldLog(level) {
    const levels = ['silent', 'error', 'warn', 'info', 'debug'];
    const currentLevel = levels.indexOf(CONFIG.logLevel);
    const targetLevel = levels.indexOf(level);
    return targetLevel <= currentLevel;
  }

  static formatTime() {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  static log(level, message, color = '') {
    if (!this.shouldLog(level)) return;
    
    const prefix = `[${this.formatTime()}] ${level.toUpperCase().padEnd(5)}`;
    const formattedMessage = color ? `${color}${message}${this.colors.reset}` : message;
    
    switch (level) {
      case 'error': console.error(prefix, formattedMessage); break;
      case 'warn': console.warn(prefix, formattedMessage); break;
      default: console.log(prefix, formattedMessage);
    }
  }

  static info(message) { this.log('info', message, this.colors.cyan); }
  static success(message) { this.log('info', message, this.colors.green); }
  static warn(message) { this.log('warn', message, this.colors.yellow); }
  static error(message) { this.log('error', message, this.colors.red); }
  static debug(message) { this.log('debug', message, this.colors.gray); }
  static start(name) { this.log('info', `▶️  Starting: ${name}`, this.colors.blue); }
  static complete(name, duration) { 
    const timeStr = duration ? ` (${duration}ms)` : '';
    this.log('info', `✅ Completed: ${name}${timeStr}`, this.colors.green);
  }
  
  // New method for premium branding
  static premium(message) {
    const premiumMsg = `✨ PREMIUM: ${message}`;
    this.log('info', premiumMsg, this.colors.magenta);
  }
}

// -----------------------------------------------------------------------------
// COMMAND RUNNER (FIXED FOR PDF GENERATION)
// -----------------------------------------------------------------------------
class CommandRunner {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.npxCmd = this.isWindows ? 'npx.cmd' : 'npx';
  }

  async runWithRetry(name, script, args = [], options = {}) {
    const { timeout = CONFIG.timeout, cwd = process.cwd() } = options;
    let lastError;
    
    for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
      try {
        if (attempt > 1) {
          Logger.warn(`Retry ${attempt}/${CONFIG.retries} for: ${name}`);
          await this.delay(CONFIG.retryDelay * attempt);
        }
        
        return await this.runCommand(name, script, args, { timeout, cwd });
      } catch (error) {
        lastError = error;
        Logger.warn(`Attempt ${attempt} failed for ${name}: ${error.message}`);
        
        if (error.message.includes('ENOENT') || error.message.includes('not found')) {
          throw error;
        }
      }
    }
    
    throw new Error(`Failed after ${CONFIG.retries} attempts: ${lastError.message}`);
  }

  async runCommand(name, script, args = [], options = {}) {
    const { timeout = CONFIG.timeout, cwd = process.cwd() } = options;
    const startTime = Date.now();
    
    // Build the command
    let command;
    let commandArgs;
    
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
      const process = spawn(command, commandArgs, {
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
      
      if (process.stdout) {
        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }
      
      if (process.stderr) {
        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          Logger.complete(name, duration);
          
          if (CONFIG.logLevel === 'debug' && stdout) {
            Logger.debug(`Output for ${name}:\n${stdout}`);
          }
          
          resolve({ code, stdout, stderr, duration });
        } else {
          const error = new Error(`Process exited with code ${code}`);
          error.code = code;
          error.stdout = stdout;
          error.stderr = stderr;
          error.duration = duration;
          
          Logger.error(`Failed: ${name} (${duration}ms)`);
          if (stderr) {
            Logger.error(`Error output:\n${stderr}`);
          }
          
          reject(error);
        }
      });
      
      process.on('error', (error) => {
        const duration = Date.now() - startTime;
        Logger.error(`Process error for ${name}: ${error.message} (${duration}ms)`);
        reject(error);
      });
      
      if (timeout) {
        setTimeout(() => {
          if (process.exitCode === null) {
            process.kill('SIGTERM');
            reject(new Error(`Timeout after ${timeout}ms`));
          }
        }, timeout);
      }
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkDependencies() {
    Logger.info('Checking dependencies for premium PDF generation...');
    
    const requiredPackages = ['tsx'];
    const missingPackages = [];
    
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
      } catch (error) {
        throw new Error(`Failed to install missing packages: ${error.message}`);
      }
    }
    
    Logger.success('All dependencies are satisfied');
  }
}

// -----------------------------------------------------------------------------
// PDF GENERATION ORCHESTRATOR (FIXED FOR PREMIUM)
// -----------------------------------------------------------------------------
class PDFGenerationOrchestrator {
  constructor() {
    this.runner = new CommandRunner();
    this.results = [];
    this.startTime = Date.now();
  }

  async initialize() {
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

  async runStep(name, script, args = [], options = {}) {
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
    } catch (error) {
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

  async generatePremiumPDFs() {
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

  async verifyGeneratedPDFs() {
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

  async generateStatusReport() {
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

  async cleanup() {
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

  async run() {
    await this.initialize();
    
    try {
      // Step 1: Generate premium PDFs
      await this.generatePremiumPDFs();
      
      // Step 2: Verify and generate report
      const { report, validPdfs } = await this.generateStatusReport();
      
      // Step 3: Cleanup
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
      
    } catch (error) {
      Logger.error('Orchestration failed:', error.message);
      
      try {
        await this.generateStatusReport();
      } catch (reportError) {
        Logger.error('Failed to generate error report:', reportError.message);
      }
      
      throw error;
    }
  }
}

// -----------------------------------------------------------------------------
// ADD THIS TO YOUR package.json
// -----------------------------------------------------------------------------
/*
Add these scripts to your package.json:

{
  "scripts": {
    "pdfs:premium": "node scripts/generate-pdfs.js --quality=premium",
    "pdfs:all": "node scripts/generate-pdfs.js --all-formats",
    "pdfs:build": "npm run pdfs:premium",
    "build:with-pdfs": "npm run build && npm run pdfs:build",
    "preview:with-pdfs": "npm run pdfs:build && npm run preview"
  }
}
*/

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
  CONFIG.quality = options.quality;
  
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
    
  } catch (error) {
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