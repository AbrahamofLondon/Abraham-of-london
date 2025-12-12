// scripts/check-contentlayer-output.mjs
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatedDir = path.join(process.cwd(), '.contentlayer/generated');

console.log('📦 Checking Contentlayer Generated Output');
console.log('=' .repeat(50));

if (fs.existsSync(generatedDir)) {
  const generatedDirs = fs.readdirSync(generatedDir);
  console.log(`Found ${generatedDirs.length} generated directories:`);
  
  generatedDirs.forEach(dir => {
    const dirPath = path.join(generatedDir, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      const jsonFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
      console.log(`\n📁 ${dir}/: ${jsonFiles.length} documents`);
      
      // Show first 3 documents for each type
      jsonFiles.slice(0, 3).forEach(file => {
        const filePath = path.join(dirPath, file);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          console.log(`  • ${data.title || 'No title'} (${path.basename(file, '.json')})`);
          if (DEBUG) {
            console.log(`    Type: ${data.type || 'No type'}`);
            console.log(`    Date: ${data.date || 'No date'}`);
            console.log(`    Slug: ${data.slug || 'No slug'}`);
          }
        } catch (err) {
          console.log(`  • ERROR reading ${file}: ${err.message}`);
        }
      });
      
      if (jsonFiles.length > 3) {
        console.log(`  ... and ${jsonFiles.length - 3} more`);
      }
    }
  });
  
  // Check specifically for Print documents
  const printDir = path.join(generatedDir, 'Print');
  if (fs.existsSync(printDir)) {
    const printFiles = fs.readdirSync(printDir).filter(f => f.endsWith('.json'));
    console.log('\n✅ SUCCESS: Print documents were generated!');
    console.log(`   Found ${printFiles.length} Print documents`);
    
    printFiles.forEach(file => {
      const filePath = path.join(printDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`   - ${data.title} (type: ${data.type})`);
      } catch (err) {
        console.log(`   - ERROR reading ${file}`);
      }
    });
  } else {
    console.log('\n❌ FAILED: Print directory not generated!');
    
    // Check what files ARE generated
    const allJsonFiles = [];
    generatedDirs.forEach(dir => {
      const dirPath = path.join(generatedDir, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        const jsonFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
        allJsonFiles.push(...jsonFiles.map(f => path.join(dir, f)));
      }
    });
    
    console.log(`\n📊 Total generated documents: ${allJsonFiles.length}`);
    if (allJsonFiles.length > 0) {
      console.log('Generated files:');
      allJsonFiles.slice(0, 10).forEach(file => console.log(`  ${file}`));
      if (allJsonFiles.length > 10) {
        console.log(`  ... and ${allJsonFiles.length - 10} more`);
      }
    }
  }
} else {
  console.log('❌ .contentlayer/generated directory not found!');
  console.log('\nPossible issues:');
  console.log('1. Contentlayer build failed');
  console.log('2. Build is still in progress');
  console.log('3. Different output directory configured');
}

console.log('\n✅ Diagnostic complete.');