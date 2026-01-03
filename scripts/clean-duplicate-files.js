// scripts/clean-duplicate-files.js
const fs = require('fs');
const path = require('path');

async function cleanDuplicates() {
  console.log('🧹 Cleaning duplicate files in scripts folder...\n');
  
  const scriptsDir = path.join(__dirname, '..', 'scripts');
  const files = fs.readdirSync(scriptsDir);
  
  let deletedCount = 0;
  
  // First pass: delete .mjs files that have .ts counterparts
  for (const file of files) {
    if (file.endsWith('.mjs')) {
      const baseName = file.replace(/\.mjs$/, '');
      const tsFile = `${baseName}.ts`;
      
      if (files.includes(tsFile)) {
        const mjsPath = path.join(scriptsDir, file);
        console.log(`  Deleting: ${file} (has .ts version: ${tsFile})`);
        fs.unlinkSync(mjsPath);
        deletedCount++;
      }
    }
  }
  
  // Second pass: delete .js files that have .ts counterparts (excluding test files)
  for (const file of files) {
    if (file.endsWith('.js') && !file.includes('.test.') && !file.includes('.spec.')) {
      const baseName = file.replace(/\.js$/, '');
      const tsFile = `${baseName}.ts`;
      
      if (files.includes(tsFile)) {
        const jsPath = path.join(scriptsDir, file);
        console.log(`  Deleting: ${file} (has .ts version: ${tsFile})`);
        fs.unlinkSync(jsPath);
        deletedCount++;
      }
    }
  }
  
  console.log(`\n✅ Deleted ${deletedCount} duplicate files`);
  console.log('\n📝 Note: Update package.json scripts to use .ts files with tsx');
}

cleanDuplicates().catch(console.error);