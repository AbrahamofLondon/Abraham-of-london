// scripts/fix-ts-syntax.ts
import fs from 'fs';
import path from 'path';

function fixFile(filePath: string): boolean {
  console.log(`🔧 Checking ${path.basename(filePath)}...`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  let updated = content;
  
  // Fix 1: Replace wrong regex replacement strings in unescaped entities files
  if (filePath.includes('fix-unescaped-entities') || filePath.includes('repair-smart-quotes')) {
    // Fix: .replace(/"([^"]*)"/g, ""$1"")
    // Should be: .replace(/"([^"]*)"/g, '"$1"')
    const wrongPattern = /\.replace\(\/"([^"]*)"\/g, ""\$1""\)/g;
    const rightReplacement = `.replace(/"([^"]*)"/g, '"$1"')`;
    
    if (wrongPattern.test(updated)) {
      updated = updated.replace(wrongPattern, rightReplacement);
      console.log(`  ✅ Fixed regex in ${path.basename(filePath)}`);
    }
  }
  
  // Fix 2: Fix backslash escaping in all .ts files
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    // Fix raw backslashes before template literals
    updated = updated.replace(/console\.log\\(`[^`]+`\\);/g, (match) => {
      return match.replace(/\\/g, '');
    });
    
    // Fix specific patterns in setup-neon-tables.ts
    if (filePath.includes('setup-neon-tables')) {
      updated = updated.replace(
        /console\.log\\(📄 Schema file loaded \\( characters\\)\\);/,
        'console.log(`📄 Schema file loaded (${schemaSQL.length} characters)`);'
      );
      
      updated = updated.replace(
        /console\.log\\(Found \\ SQL statements to execute\\);/,
        'console.log(`Found ${statements.length} SQL statements to execute`);'
      );
      
      updated = updated.replace(
        /console\.log\\(Executing \(\/\)...\\);/g,
        'console.log(`Executing (${i + 1}/${statements.length})...`);'
      );
      
      updated = updated.replace(
        /console\.log\\(  ✅ Statement \\ executed\\);/g,
        'console.log(`  ✅ Statement ${i + 1} executed`);'
      );
      
      updated = updated.replace(
        /console\.log\\(  ⚠️  Statement \\ failed: \\, error\.message\.split\('\\n'\)\[0\]\);/g,
        'console.log(`  ⚠️  Statement ${i + 1} failed: ${error.message.split(\'\\n\')[0]}`);'
      );
      
      updated = updated.replace(
        /console\.log\\(  • \\\\);/g,
        'console.log(`  • ${row.table_name}`);'
      );
    }
  }
  
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    return true;
  }
  
  return false;
}

async function main() {
  console.log('🔍 Fixing TypeScript syntax errors...\n');
  
  // Get all .ts and .tsx files in scripts directory
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const files: string[] = [];
  
  function scanDir(dir: string) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // Skip node_modules
        if (item.name !== 'node_modules') {
          scanDir(fullPath);
        }
      } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx') || item.name.endsWith('.mjs')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(scriptsDir);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  
  // Also clean up duplicate .mjs files
  console.log('\n🧹 Checking for duplicate .mjs files...');
  let deletedCount = 0;
  
  for (const file of files) {
    if (file.endsWith('.mjs')) {
      const tsFile = file.replace(/\.mjs$/, '.ts');
      if (fs.existsSync(tsFile)) {
        console.log(`  Deleting duplicate: ${path.basename(file)}`);
        fs.unlinkSync(file);
        deletedCount++;
      }
    }
  }
  
  console.log(`✅ Deleted ${deletedCount} duplicate .mjs files`);
}

// Run if called directly
if (import.meta.url.includes('fix-ts-syntax.ts')) {
  main().catch(console.error);
}