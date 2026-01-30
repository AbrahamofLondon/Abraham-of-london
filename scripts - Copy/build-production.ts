// scripts/build-production.ts
/**
 * Production Build Script for Abraham of London
 * Handles all pre-build tasks with proper error handling
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionBuild {
  private readonly steps = [
    { name: 'Clean Build Artifacts', command: 'npm run clean:build' },
    { name: 'Generate Prisma Client', command: 'npm run prisma:generate' },
    { name: 'Validate Environment', command: 'npm run env:check' },
    { name: 'Build Content', command: 'npm run content:full' },
    { name: 'Generate Missing PDFs', command: 'npm run pdfs:generate' },
    { name: 'Type Check', command: 'npm run type-check' },
    { name: 'Lint Code', command: 'npm run lint' },
    { name: 'Build Next.js', command: 'npm run build:production' }
  ];

  async run() {
    console.log('🚀 Starting Production Build for Abraham of London\n');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`💻 Node: ${process.version}`);
    console.log(`📦 Platform: ${process.platform}\n`);

    const results = [];

    for (const [index, step] of this.steps.entries()) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`STEP ${index + 1}/${this.steps.length}: ${step.name}`);
      console.log(`${'='.repeat(60)}`);

      try {
        const startTime = Date.now();
        
        if (step.name === 'Generate Missing PDFs') {
          // Special handling for PDF generation with timeout
          await this.runPDFGeneration();
        } else {
          execSync(step.command, {
            stdio: 'inherit',
            encoding: 'utf8',
            timeout: 300000 // 5 minutes per step
          });
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ ${step.name} completed in ${duration}s`);
        
        results.push({
          step: step.name,
          success: true,
          duration: `${duration}s`
        });

      } catch (error: any) {
        console.error(`❌ ${step.name} failed:`);
        console.error(error.message);
        
        results.push({
          step: step.name,
          success: false,
          error: error.message
        });

        // Don't continue if critical step fails
        if (this.isCriticalStep(step.name)) {
          console.error('\n💥 Critical step failed, stopping build.');
          this.report(results);
          process.exit(1);
        } else {
          console.warn(`⚠️  Non-critical step failed, continuing...`);
        }
      }
    }

    this.report(results);
    
    if (results.every(r => r.success)) {
      console.log('\n✨ Production build completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Build completed with warnings.');
      process.exit(0); // Exit with 0 since non-critical steps might fail
    }
  }

  private isCriticalStep(stepName: string): boolean {
    const criticalSteps = [
      'Generate Prisma Client',
      'Build Content',
      'Build Next.js'
    ];
    return criticalSteps.includes(stepName);
  }

  private async runPDFGeneration(): Promise<void> {
    // Import and run PDF generation
    const { generateMissingPDFs } = await import('./pdf-registry');
    const results = await generateMissingPDFs();
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (failed > 0) {
      console.warn(`⚠️  PDF generation: ${successful} succeeded, ${failed} failed`);
      results.filter(r => !r.success).forEach(r => {
        console.warn(`  ❌ ${r.id}: ${r.error}`);
      });
    } else {
      console.log(`✅ Generated ${successful} PDFs successfully`);
    }
  }

  private report(results: any[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BUILD REPORT');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    
    if (failed > 0) {
      console.log('\nFailed steps:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  • ${r.step}: ${r.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  // Verification methods
  private verifyBuild(): boolean {
    console.log('\n🔍 Verifying build artifacts...');
    
    const artifactsToCheck = [
      '.next/BUILD_ID',
      '.next/static/chunks',
      '.next/server',
      'public/assets/downloads'
    ];
    
    let allGood = true;
    
    for (const artifact of artifactsToCheck) {
      const artifactPath = path.join(process.cwd(), artifact);
      
      if (fs.existsSync(artifactPath)) {
        console.log(`✅ ${artifact}`);
      } else {
        console.log(`❌ ${artifact} - MISSING`);
        allGood = false;
      }
    }
    
    return allGood;
  }
}

// Run build
const build = new ProductionBuild();
build.run().catch(error => {
  console.error('💥 Fatal build error:', error);
  process.exit(1);
});