#!/usr/bin/env node
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
  timeout: 5 * 60 * 1000, // 5 minutes timeout per command
  retries: 3,
  retryDelay: 2000,
  maxConcurrent: 1, // Run commands sequentially for PDF generation
  logLevel: process.env.LOG_LEVEL || 'info', // 'silent', 'error', 'warn', 'info', 'debug'
  outputDir: path.join(process.cwd(), 'public/assets/downloads'),
  scriptDir: __dirname
};

// -----------------------------------------------------------------------------
// LOGGER UTILITY
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
}

// -----------------------------------------------------------------------------
// COMMAND RUNNER (ENHANCED)
// -----------------------------------------------------------------------------
class CommandRunner {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.npxCmd = this.isWindows ? 'npx.cmd' : 'npx';
    this.tsxPath = this.getTsxPath();
  }

  getTsxPath() {
    try {
      // Try to find tsx in node_modules
      const tsxPackage = require.resolve('tsx/package.json');
      return path.dirname(tsxPackage);
    } catch {
      return null;
    }
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
        
        // Don't retry on certain errors
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
    
    // Resolve script path
    let scriptPath;
    if (path.isAbsolute(script)) {
      scriptPath = script;
    } else if (script.startsWith('./') || script.startsWith('../')) {
      scriptPath = path.resolve(cwd, script);
    } else {
      scriptPath = path.resolve(CONFIG.scriptDir, script);
    }
    
    // Verify script exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script not found: ${scriptPath}`);
    }
    
    Logger.start(name);
    Logger.debug(`Command: ${this.npxCmd} tsx ${scriptPath} ${args.join(' ')}`);
    
    return new Promise((resolve, reject) => {
      const commandArgs = ['tsx', scriptPath, ...args];
      
      const process = spawn(this.npxCmd, commandArgs, {
        stdio: 'inherit',
        shell: true,
        cwd,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
          NODE_OPTIONS: '--max-old-space-size=4096',
          PDF_GENERATION: 'true'
        },
        timeout
      });
      
      let stdout = '';
      let stderr = '';
      
      // Capture output for debugging
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
          
          // Log debug output if needed
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
      
      // Handle timeout
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
    Logger.info('Checking dependencies...');
    
    const requiredPackages = ['tsx', 'pdf-lib', '@pdf-lib/fontkit'];
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
// PDF GENERATION ORCHESTRATOR
// -----------------------------------------------------------------------------
class PDFGenerationOrchestrator {
  constructor() {
    this.runner = new CommandRunner();
    this.results = [];
    this.startTime = Date.now();
  }

  async initialize() {
    Logger.info('='.repeat(60));
    Logger.info('PDF GENERATION ORCHESTRATOR');
    Logger.info('='.repeat(60));
    Logger.info(`Platform: ${os.platform()} ${os.arch()}`);
    Logger.info(`Node: ${process.version}`);
    Logger.info(`CWD: ${process.cwd()}`);
    Logger.info(`Output Dir: ${CONFIG.outputDir}`);
    Logger.info(`Script Dir: ${CONFIG.scriptDir}`);
    Logger.info('='.repeat(60));
    
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
      Logger.info(`Created output directory: ${CONFIG.outputDir}`);
    }
    
    // Check dependencies
    await this.runner.checkDependencies();
  }

  async runStep(name, script, args = [], options = {}) {
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
        duration: Date.now() - (this.currentStepStart || Date.now()),
        timestamp: new Date().toISOString()
      });
      
      // Decide whether to continue based on error
      const shouldContinue = !error.message.includes('fatal') && 
                            !error.message.includes('ENOENT');
      
      if (!shouldContinue) {
        throw error;
      }
      
      return null;
    }
  }

  async generateStatusReport() {
    const totalDuration = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    Logger.info('='.repeat(60));
    Logger.info('GENERATION REPORT');
    Logger.info('='.repeat(60));
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      const error = result.error ? ` - ${result.error}` : '';
      Logger.info(`${status} ${index + 1}. ${result.name}${duration}${error}`);
    });
    
    Logger.info('='.repeat(60));
    Logger.info(`Total Steps: ${this.results.length}`);
    Logger.info(`Successful: ${successful}`);
    Logger.info(`Failed: ${failed}`);
    Logger.info(`Total Time: ${totalDuration}ms`);
    Logger.info('='.repeat(60));
    
    // Generate JSON report
    const report = {
      summary: {
        total: this.results.length,
        successful,
        failed,
        totalDuration,
        timestamp: new Date().toISOString(),
        platform: os.platform(),
        nodeVersion: process.version
      },
      steps: this.results,
      outputDirectory: CONFIG.outputDir
    };
    
    const reportPath = path.join(CONFIG.outputDir, 'generation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    Logger.info(`Report saved to: ${reportPath}`);
    
    return report;
  }

  async scanForGeneratedFiles() {
    Logger.info('Scanning for generated files...');
    
    if (!fs.existsSync(CONFIG.outputDir)) {
      Logger.warn('Output directory does not exist');
      return [];
    }
    
    const files = fs.readdirSync(CONFIG.outputDir)
      .filter(file => file.endsWith('.pdf') || file.endsWith('.md') || file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(CONFIG.outputDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(1),
          modified: stats.mtime
        };
      });
    
    Logger.info(`Found ${files.length} generated files`);
    
    if (CONFIG.logLevel === 'debug') {
      files.forEach(file => {
        Logger.debug(`📄 ${file.name} - ${file.sizeKB} KB`);
      });
    }
    
    return files;
  }

  async cleanupOldFiles() {
    Logger.info('Cleaning up old temporary files...');
    
    const tempPatterns = ['*.tmp', '*.temp', '*.log', '*.bak'];
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    if (fs.existsSync(CONFIG.outputDir)) {
      const files = fs.readdirSync(CONFIG.outputDir);
      
      files.forEach(file => {
        if (tempPatterns.some(pattern => file.match(new RegExp(pattern.replace('*', '.*'))))) {
          const filePath = path.join(CONFIG.outputDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtimeMs < sevenDaysAgo) {
            try {
              fs.unlinkSync(filePath);
              Logger.debug(`Removed old temp file: ${file}`);
            } catch (error) {
              Logger.warn(`Failed to remove ${file}: ${error.message}`);
            }
          }
        }
      });
    }
  }

  async verifyAssets() {
    Logger.info('Verifying generated assets...');
    
    // Check if main PDFs exist
    const requiredFiles = [
      'legacy-architecture-canvas-a4.pdf',
      'legacy-architecture-canvas-letter.pdf',
      'legacy-architecture-canvas-a3.pdf'
    ];
    
    const missingFiles = [];
    const verifiedFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(CONFIG.outputDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > 1000) { // At least 1KB
          verifiedFiles.push({ file, size: stats.size });
          Logger.debug(`✓ ${file} verified (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
          missingFiles.push(`${file} (too small: ${stats.size} bytes)`);
          Logger.warn(`✗ ${file} is too small`);
        }
      } else {
        missingFiles.push(file);
        Logger.warn(`✗ ${file} not found`);
      }
    }
    
    if (missingFiles.length > 0) {
      Logger.warn(`Missing/Invalid files: ${missingFiles.join(', ')}`);
      return false;
    }
    
    Logger.success(`All ${verifiedFiles.length} required assets verified`);
    return true;
  }

  async run() {
    await this.initialize();
    
    try {
      // Step 1: Initial status check
      await this.runStep('Status Check', 'pdf-registry.ts', ['--status']);
      
      // Step 2: Generate legacy canvas (highest priority)
      await this.runStep('Generate Legacy Canvas', 'generate-legacy-canvas.tsx', [], {
        timeout: 10 * 60 * 1000 // 10 minutes for canvas generation
      });
      
      // Step 3: Generate missing PDFs
      await this.runStep('Generate Missing PDFs', 'pdf-registry.ts', ['--generate-missing']);
      
      // Step 4: Verify assets
      const verification = await this.verifyAssets();
      if (!verification) {
        Logger.warn('Asset verification failed, but continuing...');
      }
      
      // Step 5: Scan for generated files
      const generatedFiles = await this.scanForGeneratedFiles();
      
      // Step 6: Final status
      await this.runStep('Final Status', 'pdf-registry.ts', ['--status']);
      
      // Step 7: Cleanup
      await this.cleanupOldFiles();
      
      // Generate report
      const report = await this.generateStatusReport();
      
      // Final output
      Logger.success('='.repeat(60));
      Logger.success('PDF GENERATION COMPLETE!');
      Logger.success('='.repeat(60));
      Logger.success(`Generated ${generatedFiles.length} files`);
      Logger.success(`Total time: ${report.summary.totalDuration}ms`);
      Logger.success(`Output directory: ${CONFIG.outputDir}`);
      Logger.success('='.repeat(60));
      
      return {
        success: report.summary.failed === 0,
        report,
        files: generatedFiles
      };
      
    } catch (error) {
      Logger.error('Orchestration failed:', error.message);
      
      // Try to generate report even on failure
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
// MAIN EXECUTION
// -----------------------------------------------------------------------------
async function main() {
  const orchestrator = new PDFGenerationOrchestrator();
  
  try {
    const result = await orchestrator.run();
    
    if (result.success) {
      Logger.success('All processes completed successfully!');
      process.exit(0);
    } else {
      Logger.warn('Process completed with warnings');
      process.exit(1);
    }
    
  } catch (error) {
    Logger.error('Fatal error in PDF generation process:', error.message);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// CLI ARGUMENT PARSING
// -----------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    verbose: false,
    silent: false,
    quick: false,
    force: false,
    help: false
  };
  
  for (const arg of args) {
    if (arg === '-v' || arg === '--verbose') {
      parsed.verbose = true;
      CONFIG.logLevel = 'debug';
    } else if (arg === '-s' || arg === '--silent') {
      parsed.silent = true;
      CONFIG.logLevel = 'error';
    } else if (arg === '-q' || arg === '--quick') {
      parsed.quick = true;
      CONFIG.timeout = 2 * 60 * 1000; // 2 minutes
    } else if (arg === '-f' || arg === '--force') {
      parsed.force = true;
      process.env.FORCE_REGENERATION = 'true';
    } else if (arg === '-h' || arg === '--help') {
      parsed.help = true;
    }
  }
  
  return parsed;
}

// -----------------------------------------------------------------------------
// ENTRY POINT
// -----------------------------------------------------------------------------
if (import.meta.url === `file://${__filename}`) {
  const args = parseArgs();
  
  if (args.help) {
    console.log(`
📚 PDF Generation Orchestrator

Usage: node generate-pdfs.js [options]

Options:
  -v, --verbose    Enable verbose/debug logging
  -s, --silent     Silent mode (errors only)
  -q, --quick      Quick mode with shorter timeouts
  -f, --force      Force regeneration of all PDFs
  -h, --help       Show this help message

Examples:
  node generate-pdfs.js                 # Normal generation
  node generate-pdfs.js --verbose       # Debug output
  node generate-pdfs.js --quick --force # Quick forced regeneration

Environment Variables:
  LOG_LEVEL        Set log level (silent, error, warn, info, debug)
  FORCE_COLOR      Force color output (1 = yes, 0 = no)
  NODE_OPTIONS     Node.js options (e.g., --max-old-space-size=4096)
    `);
    process.exit(0);
  }
  
  main();
}

export { PDFGenerationOrchestrator, CommandRunner, Logger };