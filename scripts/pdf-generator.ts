#!/usr/bin/env tsx
import { getPDFRegistry, generatePDF } from '../lib/pdf-registry';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import pLimit from 'p-limit'; // Recommended: pnpm add p-limit

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Concurrency limit to prevent memory spikes during PDF rendering
const limit = pLimit(3); 

interface PipelineResult {
  id: string;
  success: boolean;
  error?: string;
  duration: number;
  path?: string;
}

class PDFGenerationPipeline {
  private results: PipelineResult[] = [];

  /**
   * Generates a single asset with strict validation
   */
  async generateSingle(id: string): Promise<PipelineResult> {
    const start = Date.now();
    try {
      const result = await generatePDF(id);
      
      // Physical Verification Post-Generation
      const registry = getPDFRegistry();
      const config = registry[id];
      const physicalPath = path.join(process.cwd(), 'public', config.outputPath);
      const exists = fs.existsSync(physicalPath);

      return {
        id,
        success: result.success && exists,
        error: !exists ? 'Physical file not found after generation' : result.error,
        duration: Date.now() - start,
        path: config.outputPath
      };
    } catch (error: any) {
      return {
        id,
        success: false,
        error: error.message,
        duration: Date.now() - start
      };
    }
  }

  /**
   * Orchestrates the batch with parallel execution
   */
  async runBatch(ids: string[]): Promise<void> {
    console.log(chalk.blue.bold(`\n🚀 ORCHESTRATING ${ids.length} ASSETS...`));
    
    const tasks = ids.map(id => limit(async () => {
      const res = await this.generateSingle(id);
      this.results.push(res);
      if (res.success) {
        console.log(`${chalk.green('✅')} ${chalk.white(id.padEnd(30))} ${chalk.gray(res.duration + 'ms')}`);
      } else {
        console.log(`${chalk.red('❌')} ${chalk.red(id.padEnd(30))} ${chalk.yellow(res.error)}`);
      }
    }));

    await Promise.all(tasks);
    this.report();
  }

  private report(): void {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((acc, r) => acc + r.duration, 0);
    
    console.log(chalk.blue('\n' + '='.repeat(60)));
    console.log(chalk.blue.bold('📊 INSTITUTIONAL GENERATION REPORT'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(`${chalk.green('✔ Success:')}    ${successful}`);
    console.log(`${chalk.red('✘ Failed:')}     ${failed}`);
    console.log(`${chalk.cyan('⏱ Total Time:')} ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(chalk.blue('='.repeat(60)));
    
    if (failed > 0) process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const registry = getPDFRegistry();
  const pipeline = new PDFGenerationPipeline();

  // --- COMMAND LOGIC ---

  if (args.includes('--validate')) {
    console.log(chalk.cyan('🔍 Validating Registry Integrity...'));
    let hasIssues = false;
    Object.entries(registry).forEach(([id, config]) => {
      if (!config.outputPath.startsWith('/')) {
        console.error(chalk.red(`❌ ${id}: outputPath must be absolute (start with /)`));
        hasIssues = true;
      }
    });
    if (hasIssues) process.exit(1);
    console.log(chalk.green('✅ Registry valid.'));
    return;
  }

  const singleArg = args.find(a => a.startsWith('--single='));
  const typeArg = args.find(a => a.startsWith('--type='));

  if (singleArg) {
    const id = singleArg.split('=')[1];
    await pipeline.runBatch([id]);
  } else if (typeArg) {
    const type = typeArg.split('=')[1];
    const ids = Object.values(registry)
      .filter(pdf => pdf.type === type && pdf.generationScript)
      .map(pdf => pdf.id);
    await pipeline.runBatch(ids);
  } else {
    // Default: Generate all missing or all scripted
    const ids = Object.values(registry)
      .filter(pdf => pdf.generationScript)
      .map(pdf => pdf.id);
    await pipeline.runBatch(ids);
  }
}

main().catch(err => {
  console.error(chalk.red('💥 Pipeline Crash:'), err);
  process.exit(1);
});