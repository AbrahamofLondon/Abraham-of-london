// scripts/pdf/generate-all-from-mdx.ts
import { MdxToPdfConverter } from './mdx-pdf-converter/converter';
import { DOCUMENT_REGISTRY, discoverMdxFiles } from './mdx-pdf-converter/config';
import fs from 'fs';
import path from 'path';

class AllMdxPdfGenerator {
  private converter: MdxToPdfConverter;
  
  constructor() {
    this.converter = new MdxToPdfConverter();
  }
  
  async generateAll() {
    console.log('✨ ENTERPRISE MDX-TO-PDF CONVERTER ✨');
    console.log('═'.repeat(60));
    console.log('🚀 Starting batch conversion of all MDX documents');
    console.log('═'.repeat(60));
    
    const startTime = Date.now();
    const results = [];
    
    // Process each document in registry
    for (const doc of DOCUMENT_REGISTRY) {
      if (!fs.existsSync(doc.mdxPath)) {
        console.log(`❌ MDX file not found: ${doc.mdxPath}`);
        continue;
      }
      
      console.log(`\n📚 Processing: ${doc.displayName}`);
      console.log('─'.repeat(40));
      
      // Generate PDFs for each tier
      for (const tier of doc.tiers) {
        if (!tier.generatePdf) continue;
        
        for (const format of tier.formats) {
          for (const quality of tier.quality) {
            const result = await this.converter.convertDocument(doc, tier.slug, format, quality);
            results.push({
              document: doc.pdfName,
              tier: tier.slug,
              format,
              quality,
              ...result
            });
          }
        }
      }
    }
    
    // Auto-discover and process remaining MDX files
    await this.processUndiscoveredMdx();
    
    const duration = Date.now() - startTime;
    const stats = this.converter.getStats();
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 CONVERSION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully processed: ${stats.processed} PDFs`);
    console.log(`❌ Errors: ${stats.errors}`);
    console.log(`⏱️  Total time: ${duration}ms`);
    console.log(`📁 Output directory: public/assets/downloads/`);
    
    if (stats.errors > 0) {
      console.log('\n⚠️  ERRORS:');
      stats.errorMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg}`);
      });
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Check output directory: dir public/assets/downloads/');
    console.log('2. Verify PDF quality and content');
    console.log('3. Update DOCUMENT_REGISTRY for custom configurations');
    console.log('═'.repeat(60));
    
    return { results, stats, duration };
  }
  
  private async processUndiscoveredMdx() {
    const discovered = discoverMdxFiles();
    const registered = DOCUMENT_REGISTRY.map(d => d.mdxPath);
    const unregistered = discovered.filter(path => !registered.includes(path));
    
    if (unregistered.length === 0) return;
    
    console.log(`\n🔍 Processing ${unregistered.length} unregistered MDX files:`);
    
    for (const mdxPath of unregistered) {
      const baseName = path.basename(mdxPath, '.mdx');
      const doc = {
        mdxPath,
        pdfName: baseName,
        displayName: this.formatDisplayName(baseName),
        category: 'Uncategorized',
        description: 'Automatically generated from MDX',
        tiers: [
          { slug: 'free', displayName: 'Free', accessLevel: 'free', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['standard'] }
        ]
      };
      
      console.log(`\n📄 Auto-processing: ${doc.displayName}`);
      
      const result = await this.converter.convertDocument(doc, 'free', 'A4', 'standard');
      
      if (!result.success) {
        console.log(`  ⚠️  Skipped: ${baseName} (generation failed)`);
      }
    }
  }
  
  private formatDisplayName(baseName: string): string {
    return baseName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const generator = new AllMdxPdfGenerator();
  
  generator.generateAll().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { AllMdxPdfGenerator };