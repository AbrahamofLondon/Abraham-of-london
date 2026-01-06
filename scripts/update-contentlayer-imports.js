/* scripts/update-contentlayer-imports.js - AUTOMATIC IMPORT UPDATER */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define all dynamic page patterns to check
const DYNAMIC_PAGE_PATTERNS = [
  'pages/blog/[slug].tsx',
  'pages/books/[slug].tsx',
  'pages/events/[slug].tsx',
  'pages/downloads/[slug].tsx',
  'pages/shorts/[slug].tsx',
  'pages/canon/[slug].tsx',
  'pages/resources/[...slug].tsx',
  'pages/strategy/[slug].tsx',
  'pages/prints/[slug].tsx',
];

// Define old import patterns to replace
const OLD_IMPORT_PATTERNS = [
  /import\s*{([^}]*)}\s*from\s*["']@\/lib\/server\/content["']/g,
  /import\s*{([^}]*)}\s*from\s*["']@\/lib\/contentlayer-compat["']/g,
  /import\s*{([^}]*)}\s*from\s*["']@\/lib\/contentlayer-helper\.server["']/g,
];

// New import replacement
const NEW_IMPORT = `import { $1 } from "@/lib/contentlayer";`;

// Helper functions to find imports
function findImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  OLD_IMPORT_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      imports.push({
        fullMatch: match[0],
        importList: match[1].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  });
  
  return imports;
}

function updateFileImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  let updated = false;
  
  OLD_IMPORT_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      updatedContent = content.replace(pattern, NEW_IMPORT);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ Updated imports in: ${filePath}`);
    return true;
  }
  
  return false;
}

// Find all dynamic pages in the project
function findDynamicPages() {
  const pagesDir = path.join(process.cwd(), 'pages');
  const dynamicPages = [];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        // Check if it's a dynamic page (contains [slug] or [...slug])
        if (fullPath.includes('[slug]') || fullPath.includes('[...slug]')) {
          dynamicPages.push(fullPath);
        }
        // Also check for API routes that might use content imports
        if (fullPath.includes('api/') && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
          dynamicPages.push(fullPath);
        }
      }
    });
  }
  
  walkDir(pagesDir);
  return dynamicPages;
}

// Main execution
async function main() {
  console.log('🔍 Scanning for dynamic pages with old contentlayer imports...');
  
  const dynamicPages = findDynamicPages();
  console.log(`📁 Found ${dynamicPages.length} dynamic pages/API routes`);
  
  let updatedFiles = 0;
  let totalImportsFound = 0;
  
  dynamicPages.forEach(filePath => {
    const imports = findImportsInFile(filePath);
    
    if (imports.length > 0) {
      console.log(`\n📄 ${filePath}`);
      imports.forEach(imp => {
        console.log(`   • Found import: ${imp.importList}`);
        totalImportsFound++;
      });
      
      if (updateFileImports(filePath)) {
        updatedFiles++;
      }
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESULTS:`);
  console.log(`   Files scanned: ${dynamicPages.length}`);
  console.log(`   Imports found: ${totalImportsFound}`);
  console.log(`   Files updated: ${updatedFiles}`);
  
  if (updatedFiles > 0) {
    console.log('\n✅ Successfully updated all imports!');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Run the type checker: npx tsc --noEmit');
    console.log('   2. Test the build: npm run build');
    console.log('   3. If any issues, check the updated files manually');
  } else {
    console.log('\n✅ No outdated imports found!');
  }
}

// Run the script
main().catch(console.error);