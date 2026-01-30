// scripts/fix-prints.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const contentDir = join(process.cwd(), 'content');

function fixPrintFiles() {
  console.log('🔧 Fixing print files...');
  
  // Fix prints directory
  const printsDir = join(contentDir, 'prints');
  
  if (!existsSync(printsDir)) {
    console.log('  ⚠ Prints directory not found:', printsDir);
    return;
  }
  
  const printFiles = readdirSync(printsDir).filter(f => f.endsWith('.mdx'));
  
  if (printFiles.length === 0) {
    console.log('  ⚠ No .mdx files found in prints directory');
    return;
  }
  
  let fixedCount = 0;
  
  for (const file of printFiles) {
    const filePath = join(printsDir, file);
    try {
      let content = readFileSync(filePath, 'utf8');
      const original = content;
      
      console.log(`\n📄 Processing: ${file}`);
      
      // Check current type
      const typeMatch = content.match(/type:\s*(["']?)([^"\'\s\n]+)\1/);
      if (typeMatch) {
        console.log(`  Current type: "${typeMatch[2]}"`);
      } else {
        console.log(`  No type field found`);
      }
      
      // Fix type field from Resource to Print
      if (content.includes('type: "Resource"')) {
        content = content.replace('type: "Resource"', 'type: "Print"');
        console.log('  ✓ Changed type from "Resource" to "Print"');
      } else if (content.includes("type: 'Resource'")) {
        content = content.replace("type: 'Resource'", "type: 'Print'");
        console.log('  ✓ Changed type from Resource to Print');
      } else if (content.includes('type: Resource')) {
        content = content.replace('type: Resource', 'type: Print');
        console.log('  ✓ Changed type from Resource to Print');
      } else if (content.includes('type: "Print"') || content.includes("type: 'Print'") || content.includes('type: Print')) {
        console.log('  ✓ Already has type: Print');
      } else {
        // Add type field if missing
        const today = new Date().toISOString().split('T')[0];
        content = content.replace(/---\s*\n/, `---\ntype: "Print"\ndate: "${today}"\n`);
        console.log('  ✓ Added missing type: "Print" and date');
      }
      
      // Ensure date field exists
      if (!content.includes('date:')) {
        const today = new Date().toISOString().split('T')[0];
        content = content.replace(/---\s*\n/, `---\ndate: "${today}"\n`);
        console.log(`  ✓ Added date: ${today}`);
      }
      
      // Fix Windows line endings
      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      if (content !== original) {
        writeFileSync(filePath, content, 'utf8');
        console.log(`  💾 Saved changes to ${file}`);
        fixedCount++;
      } else {
        console.log(`  ⏭ No changes needed`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} out of ${printFiles.length} print files`);
  
  // Fix strategy file
  const strategyFile = join(contentDir, 'strategy', 'sample-strategy.mdx');
  if (existsSync(strategyFile)) {
    try {
      let content = readFileSync(strategyFile, 'utf8');
      if (!content.includes('date:')) {
        const today = new Date().toISOString().split('T')[0];
        content = content.replace(/---\s*\n/, `---\ndate: "${today}"\n`);
        writeFileSync(strategyFile, content, 'utf8');
        console.log(`\n✅ Added date to strategy/sample-strategy.mdx`);
      }
    } catch (error) {
      console.log('⚠ Could not fix strategy file:', error.message);
    }
  }
}

// Run the fix
try {
  fixPrintFiles();
} catch (error) {
  console.error('Script error:', error);
  process.exit(1);
}
