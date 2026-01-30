// scripts/pdf/generate-all-documents.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const contentDir = path.join(process.cwd(), 'content/downloads');
const outputDir = path.join(process.cwd(), 'public/assets/downloads');

interface DocumentConfig {
  mdxFile: string;
  pdfName: string;
  tiers: string[]; // ['architect', 'member', 'free']
  generateFromMdx: boolean;
}

class AllDocumentGenerator {
  async generate() {
    console.log('✨ GENERATING ALL DOCUMENT PDFs ✨');
    console.log('═'.repeat(60));

    // Ensure output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get all MDX files
    const mdxFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));
    console.log(`📚 Found ${mdxFiles.length} MDX documents\n`);

    // For now, copy existing PDFs from lib/pdf
    await this.copyExistingPdfs();

    // Generate tier-based versions for key documents
    await this.generateTierDocuments();

    console.log('═'.repeat(60));
    console.log('✅ Document generation complete!');
    console.log('   Run: dir public/assets/downloads/');
    console.log('═'.repeat(60));
  }

  async copyExistingPdfs() {
    const libPdfDir = path.join(process.cwd(), 'lib/pdf');
    
    if (!fs.existsSync(libPdfDir)) return;

    const pdfFiles = fs.readdirSync(libPdfDir).filter(f => f.endsWith('.pdf'));
    
    console.log('📋 Copying existing PDFs from lib/pdf:');
    
    for (const file of pdfFiles) {
      const source = path.join(libPdfDir, file);
      const dest = path.join(outputDir, file);
      
      try {
        fs.copyFileSync(source, dest);
        const stats = fs.statSync(dest);
        console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
      } catch (error: any) {
        console.log(`  ❌ ${file}: ${error.message}`);
      }
    }
    console.log('');
  }

  async generateTierDocuments() {
    const tiers = ['architect', 'member', 'free'];
    const formats = ['A4', 'Letter', 'A3'];
    
    console.log('🏗️ Generating tier-based documents:');
    
    for (const tier of tiers) {
      console.log(`\n🎯 Tier: ${tier.toUpperCase()}`);
      
      // Check if legacy canvas needs generation
      const hasLegacyCanvas = formats.every(format => {
        const pdfName = `legacy-architecture-canvas-${format.toLowerCase()}-premium-${tier}.pdf`;
        const pdfPath = path.join(outputDir, pdfName);
        return fs.existsSync(pdfPath);
      });

      if (!hasLegacyCanvas) {
        console.log(`  ⚠️ Missing legacy canvas - running generator...`);
        try {
          execSync(`npx tsx scripts/generate-legacy-canvas.ts all premium ${tier}`, {
            stdio: 'inherit',
            cwd: process.cwd()
          });
        } catch (error: any) {
          console.log(`  ❌ Failed to generate for tier ${tier}: ${error.message}`);
        }
      } else {
        console.log(`  ✅ Legacy canvas already exists`);
      }
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const generator = new AllDocumentGenerator();
  generator.generate().catch(console.error);
}

export { AllDocumentGenerator };