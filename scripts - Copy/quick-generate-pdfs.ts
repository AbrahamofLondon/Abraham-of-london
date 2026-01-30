// scripts/quick-generate-pdfs.ts
import fs from 'fs';
import path from 'path';
import { convertToPDF } from './pdf/simple-direct-converter';

async function generateAllPDFs() {
  const contentDir = path.join(process.cwd(), 'content/downloads');
  const outputDir = path.join(process.cwd(), 'public/assets/downloads/content-downloads');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Find all MDX files
  const files: string[] = [];
  
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  console.log('🔍 Scanning for MDX/MD files...');
  scanDir(contentDir);
  console.log(`✅ Found ${files.length} files`);
  
  const results = [];
  let success = 0;
  let failed = 0;
  
  for (const file of files) {
    const baseName = path.basename(file, path.extname(file));
    const outputPath = path.join(outputDir, `${baseName}.pdf`);
    
    console.log(`\n📄 Processing: ${path.basename(file)}`);
    
    const result = await convertToPDF(file, outputPath, 'premium');
    
    if (result.success) {
      success++;
      console.log(`  ✅ Generated: ${path.basename(outputPath)} (${(result.size / 1024).toFixed(1)} KB)`);
    } else {
      failed++;
      console.log(`  ❌ Failed: ${result.error}`);
    }
    
    results.push({
      file: path.basename(file),
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
  
  // Save manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    total: files.length,
    success,
    failed,
    results,
  };
  
  const manifestPath = path.join(outputDir, 'quick-generation-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📄 Manifest saved: ${manifestPath}`);
  
  return { success, failed };
}

// Run if called directly
if (require.main === module) {
  generateAllPDFs()
    .then(({ success, failed }) => {
      process.exit(failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}