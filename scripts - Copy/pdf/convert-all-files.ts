// scripts/pdf/convert-all-files.ts
import { FILE_REGISTRY, discoverAllFiles, FileDocument } from './file-pdf-converter/config';
import { MdxConverter } from './file-pdf-converter/converters/mdx-converter';
import { ExcelConverter } from './file-pdf-converter/converters/excel-converter';
import { PowerpointConverter } from './file-pdf-converter/converters/powerpoint-converter';
import { BaseConverter } from './file-pdf-converter/converters/base-converter';
import fs from 'fs';
import path from 'path';

class AllFilesConverter {
  private converters: Map<string, BaseConverter> = new Map();
  private results: Array<any> = [];
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
    this.initializeConverters();
  }
  
  private initializeConverters() {
    this.converters.set('mdx', new MdxConverter());
    this.converters.set('xlsx', new ExcelConverter());
    this.converters.set('pptx', new PowerpointConverter());
    // Add more converters as needed
  }
  
  private getConverter(fileType: string): BaseConverter | undefined {
    return this.converters.get(fileType);
  }
  
  async convertAll() {
    console.log('✨ ENTERPRISE FILE-TO-PDF CONVERTER ✨');
    console.log('═'.repeat(60));
    console.log('🚀 Converting ALL file types to PDF');
    console.log('═'.repeat(60));
    
    // Combine registered and discovered files
    const allFiles = [...FILE_REGISTRY, ...discoverAllFiles()];
    
    console.log(`📁 Total files to process: ${allFiles.length}`);
    console.log('═'.repeat(60));
    
    let totalConversions = 0;
    let successfulConversions = 0;
    
    // Process each file
    for (const [index, document] of allFiles.entries()) {
      console.log(`\n📄 [${index + 1}/${allFiles.length}] ${document.displayName}`);
      console.log(`   Type: ${document.fileType.toUpperCase()}, Source: ${path.basename(document.sourcePath)}`);
      
      // Check if source file exists
      if (!fs.existsSync(document.sourcePath)) {
        console.log(`   ❌ Source file not found: ${document.sourcePath}`);
        continue;
      }
      
      // Get appropriate converter
      const converter = this.getConverter(document.fileType);
      if (!converter) {
        console.log(`   ⚠️  No converter available for file type: ${document.fileType}`);
        continue;
      }
      
      // Process each tier configuration
      for (const tier of document.tiers) {
        if (!tier.generatePdf) continue;
        
        for (const format of tier.formats) {
          for (const quality of tier.quality) {
            totalConversions++;
            
            const result = await converter.convert(document, tier, format, quality);
            this.results.push({
              document: document.pdfName,
              fileType: document.fileType,
              tier: tier.slug,
              format,
              quality,
              ...result
            });
            
            if (result.success) {
              successfulConversions++;
              console.log(`   ✅ ${tier.slug}/${format}/${quality}: ${(result.size / 1024).toFixed(1)} KB`);
            } else {
              console.log(`   ❌ ${tier.slug}/${format}/${quality}: ${result.error}`);
            }
          }
        }
      }
    }
    
    this.generateReport(totalConversions, successfulConversions);
    
    return {
      totalFiles: allFiles.length,
      totalConversions,
      successfulConversions,
      results: this.results
    };
  }
  
  private generateReport(totalConversions: number, successfulConversions: number) {
    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 CONVERSION REPORT');
    console.log('═'.repeat(60));
    
    // Summary by file type
    const byType: Record<string, { total: number; success: number }> = {};
    this.results.forEach(result => {
      if (!byType[result.fileType]) {
        byType[result.fileType] = { total: 0, success: 0 };
      }
      byType[result.fileType].total++;
      if (result.success) byType[result.fileType].success++;
    });
    
    console.log('\n📈 BY FILE TYPE:');
    Object.entries(byType).forEach(([type, stats]) => {
      const percent = ((stats.success / stats.total) * 100).toFixed(1);
      console.log(`   ${type.toUpperCase().padEnd(8)}: ${stats.success}/${stats.total} (${percent}%)`);
    });
    
    // Summary by tier
    const byTier: Record<string, number> = {};
    this.results.forEach(result => {
      byTier[result.tier] = (byTier[result.tier] || 0) + 1;
    });
    
    console.log('\n🏷️  BY TIER:');
    Object.entries(byTier).forEach(([tier, count]) => {
      console.log(`   ${tier.padEnd(10)}: ${count} PDFs`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Successful: ${successfulConversions}/${totalConversions}`);
    console.log(`⏱️  Time: ${minutes}m ${seconds}s`);
    console.log(`📁 Output: public/assets/downloads/`);
    
    // List generated files
    const outputDir = path.join(process.cwd(), 'public/assets/downloads');
    if (fs.existsSync(outputDir)) {
      const pdfFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.pdf'));
      console.log(`📄 Generated PDFs: ${pdfFiles.length} files`);
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Install LibreOffice for better Excel/PPT conversion');
    console.log('2. Check generated PDFs for quality');
    console.log('3. Update FILE_REGISTRY for custom configurations');
    console.log('═'.repeat(60));
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const converter = new AllFilesConverter();
  
  converter.convertAll().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { AllFilesConverter };