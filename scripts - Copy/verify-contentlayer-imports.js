/* scripts/verify-contentlayer-imports.js - IMPORT VERIFICATION SCRIPT */

const fs = require('fs');
const path = require('path');

// Allowed import patterns (correct ones)
const ALLOWED_IMPORTS = [
  '@/lib/contentlayer',
  '@/lib/contentlayer-helper',
  '@/lib/server/md-utils',
  '@/lib/server/content', // Still allowed for backwards compatibility
];

// Forbidden import patterns (old ones)
const FORBIDDEN_IMPORTS = [
  '@/lib/contentlayer-compat',
  '@/lib/contentlayer-helper.server',
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /from\s+["']([^"']+)["']/g;
  let match;
  const issues = [];
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Check if it's a forbidden import
    if (FORBIDDEN_IMPORTS.some(forbidden => importPath.includes(forbidden))) {
      issues.push(`❌ Forbidden import: ${importPath}`);
    }
    
    // Check if it's a contentlayer import but not from allowed paths
    if (importPath.includes('contentlayer') && 
        !ALLOWED_IMPORTS.some(allowed => importPath.includes(allowed))) {
      issues.push(`⚠️  Suspicious contentlayer import: ${importPath}`);
    }
  }
  
  return issues;
}

async function main() {
  console.log('🔍 Verifying contentlayer imports across the project...');
  
  const pagesDir = path.join(process.cwd(), 'pages');
  const libDir = path.join(process.cwd(), 'lib');
  
  const filesToCheck = [];
  
  // Find all .tsx and .ts files
  function collectFiles(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        collectFiles(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        filesToCheck.push(fullPath);
      }
    });
  }
  
  collectFiles(pagesDir);
  collectFiles(libDir);
  
  console.log(`📁 Found ${filesToCheck.length} TypeScript files to check\n`);
  
  let totalIssues = 0;
  let filesWithIssues = 0;
  
  filesToCheck.forEach(filePath => {
    const issues = checkFile(filePath);
    
    if (issues.length > 0) {
      filesWithIssues++;
      totalIssues += issues.length;
      
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`📄 ${relativePath}:`);
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('');
    }
  });
  
  console.log('='.repeat(50));
  console.log(`📊 VERIFICATION RESULTS:`);
  console.log(`   Files checked: ${filesToCheck.length}`);
  console.log(`   Files with issues: ${filesWithIssues}`);
  console.log(`   Total issues: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n✅ All imports are correct!');
    process.exit(0);
  } else {
    console.log('\n❌ Found import issues that need to be fixed.');
    console.log('\nRun this command to fix them automatically:');
    console.log('   node scripts/update-contentlayer-imports.js');
    process.exit(1);
  }
}

main().catch(console.error);