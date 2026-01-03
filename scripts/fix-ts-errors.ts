// scripts/fix-ts-errors.ts
import fs from 'fs';
import path from 'path';

function fixFile(filePath: string) {
  console.log(`🔧 Fixing ${path.basename(filePath)}...`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  let updated = content;
  
  // Fix 1: Replace wrong regex replacement strings
  updated = updated.replace(
    /\.replace\("([^"]*)"\/g, ""\$1""\)/g,
    '.replace(/"([^"]*)"/g, \'"$1"\')'
  );
  
  // Fix 2: Replace raw backslashes in setup-neon-tables.ts
  if (filePath.includes('setup-neon-tables')) {
    // Fix console.log statements with raw backslashes
    updated = updated.replace(
      /console\.log\\([^)]+)\\);/g,
      (match, inner) => {
        // Try to reconstruct proper string
        const cleanInner = inner.replace(/\\/g, '');
        return `console.log(${cleanInner});`;
      }
    );
    
    // Fix specific patterns
    updated = updated.replace(
      /console\.log\\(📄 Schema file loaded \\( characters\\)\\);/,
      'console.log(`📄 Schema file loaded (${schema.length} characters)`);'
    );
    
    updated = updated.replace(
      /console\.log\\(Found \\ SQL statements to execute\\);/,
      'console.log(`Found ${statements.length} SQL statements to execute`);'
    );
  }
  
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`  ✅ Fixed ${path.basename(filePath)}`);
    return true;
  }
  
  console.log(`  ⚠️  No changes needed for ${path.basename(filePath)}`);
  return false;
}

async function main() {
  const filesToFix = [
    'scripts/fix-unescaped-entities-safe.mjs',
    'scripts/fix-unescaped-entities-safe.ts',
    'scripts/repair-smart-quotes-in-code.mjs',
    'scripts/repair-smart-quotes-in-code.ts',
    'scripts/setup-neon-tables.ts'
  ];
  
  let fixedCount = 0;
  
  for (const file of filesToFix) {
    if (fs.existsSync(file)) {
      if (fixFile(file)) {
        fixedCount++;
      }
    } else {
      console.log(`  ⚠️  File not found: ${file}`);
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log('\n📝 Next: Run npm run type-check again');
}

// Run if called directly
if (import.meta.url.includes('fix-ts-errors.ts')) {
  main().catch(console.error);
}