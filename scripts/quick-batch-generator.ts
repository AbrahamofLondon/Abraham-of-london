// scripts/quick-batch-generator.ts
import fs from 'fs';
import path from 'path';
import { quickConvertToPDF } from './pdf/quick-converter';

async function generateAllPDFs() {
  console.log('🚀 QUICK PDF BATCH GENERATOR');
  console.log('='.repeat(50));
  
  const contentDir = path.join(process.cwd(), 'content/downloads');
  const outputDir = path.join(process.cwd(), 'public/assets/downloads/content-downloads');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }
  
  // Find all files
  const files: string[] = [];
  
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md') || 
                 entry.name.endsWith('.pdf') || 
                 entry.name.endsWith('.xlsx') || entry.name.endsWith('.xls') ||
                 entry.name.endsWith('.pptx') || entry.name.endsWith('.ppt')) {
        files.push(fullPath);
      }
    }
  }
  
  console.log('🔍 Scanning for source files...');
  scanDir(contentDir);
  console.log(`✅ Found ${files.length} files`);
  
  const results = [];
  let success = 0;
  let failed = 0;
  
  for (const file of files) {
    const baseName = path.basename(file, path.extname(file));
    const outputPath = path.join(outputDir, `${baseName}.pdf`);
    
    console.log(`\n📄 [${success + failed + 1}/${files.length}] ${path.basename(file)}`);
    
    const result = await quickConvertToPDF(file, outputPath, 'premium');
    
    if (result.success) {
      success++;
      console.log(`  ✅ Generated: ${path.basename(outputPath)} (${(result.size / 1024).toFixed(1)} KB)`);
    } else {
      failed++;
      console.log(`  ❌ Failed: ${result.error}`);
    }
    
    results.push({
      file: path.basename(file),
      output: path.basename(outputPath),
      success: result.success,
      size: result.size,
      method: result.method,
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log('='.repeat(50));
  
  // Check what was generated
  const generatedFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.pdf'));
  console.log(`\n📄 Generated PDFs in directory: ${generatedFiles.length}`);
  
  if (generatedFiles.length > 0) {
    console.log('\nGenerated files:');
    generatedFiles.forEach((file, i) => {
      const stats = fs.statSync(path.join(outputDir, file));
      console.log(`  ${i + 1}. ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    });
  }
  
  // Save manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalFiles: files.length,
    success,
    failed,
    outputDir,
    results,
  };
  
  const manifestPath = path.join(outputDir, 'quick-batch-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📄 Manifest saved: ${manifestPath}`);
  
  return { success, failed };
}

// Run if called directly
if (require.main === module) {
  generateAllPDFs()
    .then(({ success, failed }) => {
      console.log(failed === 0 ? '\n🎉 All PDFs generated successfully!' : '\n⚠️ Some PDFs failed to generate');
      process.exit(failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export { generateAllPDFs };