#!/usr/bin/env tsx
import { getPDFRegistry, getAllPDFs, generatePDF } from '../lib/pdf-registry';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFGenerationPipeline {
  private results: Array<{
    id: string;
    success: boolean;
    error?: string;
    duration: number;
  }> = [];

  async generateSingle(id: string): Promise<typeof this.results[0]> {
    const start = Date.now();
    
    try {
      console.log(`🚀 Generating: ${id}`);
      const result = await generatePDF(id);
      
      return {
        id,
        success: result.success,
        error: result.error,
        duration: Date.now() - start
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

  async generateAll(): Promise<void> {
    console.log('🚀 Starting PDF Generation Pipeline...\n');
    
    const registry = getPDFRegistry();
    const missingPDFs = Object.values(registry).filter(pdf => !pdf.exists && pdf.generationScript);
    
    console.log(`📊 Total PDFs in registry: ${Object.keys(registry).length}`);
    console.log(`📊 Available PDFs: ${Object.values(registry).filter(pdf => pdf.exists).length}`);
    console.log(`📊 Missing PDFs to generate: ${missingPDFs.length}\n`);
    
    if (missingPDFs.length === 0) {
      console.log('✅ All PDFs are already generated.');
      return;
    }
    
    for (const pdf of missingPDFs) {
      const result = await this.generateSingle(pdf.id);
      this.results.push(result);
      
      if (result.success) {
        console.log(`✅ ${pdf.id}: Generated successfully`);
      } else {
        console.log(`❌ ${pdf.id}: ${result.error}`);
      }
    }
    
    this.report();
  }

  async generateByType(type: string): Promise<void> {
    console.log(`🚀 Generating PDFs of type: ${type}\n`);
    
    const registry = getPDFRegistry();
    const pdfsToGenerate = Object.values(registry).filter(pdf => 
      pdf.type === type && !pdf.exists && pdf.generationScript
    );
    
    if (pdfsToGenerate.length === 0) {
      console.log(`✅ No PDFs of type "${type}" need generation.`);
      return;
    }
    
    for (const pdf of pdfsToGenerate) {
      const result = await this.generateSingle(pdf.id);
      this.results.push(result);
      
      if (result.success) {
        console.log(`✅ ${pdf.id}: Generated successfully`);
      } else {
        console.log(`❌ ${pdf.id}: ${result.error}`);
      }
    }
    
    this.report();
  }

  private report(): void {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((acc, r) => acc + r.duration, 0);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 GENERATION REPORT');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(50));
    
    if (failed > 0) {
      console.log('\n❌ FAILED GENERATIONS:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.id}: ${r.error}`);
      });
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📚 PDF Generation Commands:

  npm run pdfs:all              Generate all PDFs
  npm run pdfs:single=<id>      Generate single PDF by ID
  npm run pdfs:type=<type>      Generate PDFs by type
  npm run pdfs:list             List all PDFs in registry
  npm run pdfs:scan             Scan for dynamic assets
  npm run pdfs:missing          Generate missing PDFs only
  npm run pdfs:validate         Validate PDF configurations
  npm run pdfs:legacy           Generate legacy architecture canvas

📋 Available PDF IDs:
${Object.keys(getPDFRegistry()).map(id => `  • ${id}`).join('\n')}

📋 Available Types:
  • editorial
  • framework
  • canvas
  • strategic
  • worksheet
  • tool
  • other
    `);
    return;
  }
  
  if (args.includes('--validate')) {
    console.log('🔍 Validating PDF configurations...\n');
    const registry = getPDFRegistry();
    const issues: string[] = [];
    
    Object.entries(registry).forEach(([id, config]) => {
      if (config.generationScript) {
        const scriptPath = path.resolve(process.cwd(), config.generationScript);
        if (!fs.existsSync(scriptPath)) {
          issues.push(`❌ ${id}: Generation script not found: ${config.generationScript}`);
        }
      }
      
      if (!config.outputPath.startsWith('/')) {
        issues.push(`❌ ${id}: Output path must start with /`);
      }
    });
    
    if (issues.length > 0) {
      console.log('Found issues:\n');
      issues.forEach(issue => console.log(issue));
      process.exit(1);
    } else {
      console.log('✅ All configurations are valid');
    }
    
    return;
  }
  
  if (args.includes('--preview')) {
    console.log('📋 PDF REGISTRY PREVIEW:\n');
    const registry = getPDFRegistry();
    
    Object.entries(registry).forEach(([id, config]) => {
      const status = config.exists ? '✅' : '❌';
      console.log(`${status} ${config.title} (${id})`);
      console.log(`  Type: ${config.type}`);
      console.log(`  Tier: ${config.tier}`);
      console.log(`  Path: ${config.outputPath}`);
      console.log(`  Interactive: ${config.isInteractive ? 'Yes' : 'No'}`);
      if (config.generationScript) {
        console.log(`  Generator: ${config.generationScript}`);
      }
      console.log();
    });
    
    return;
  }
  
  const singleArg = args.find(arg => arg.startsWith('--single='));
  const typeArg = args.find(arg => arg.startsWith('--type='));
  
  const pipeline = new PDFGenerationPipeline();
  
  if (singleArg) {
    const singleId = singleArg.split('=')[1];
    console.log(`🎯 Generating single PDF: ${singleId}`);
    
    const result = await pipeline.generateSingle(singleId);
    
    if (result.success) {
      console.log(`\n✅ Successfully generated: ${singleId}`);
      console.log(`⏱️  Duration: ${result.duration}ms`);
    } else {
      console.error(`\n❌ Failed to generate: ${singleId}`);
      console.error(`💥 Error: ${result.error}`);
      process.exit(1);
    }
    
  } else if (typeArg) {
    const type = typeArg.split('=')[1];
    await pipeline.generateByType(type);
    
  } else {
    await pipeline.generateAll();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('💥 Fatal error in PDF generation pipeline:', error);
    process.exit(1);
  });
}

export { PDFGenerationPipeline };