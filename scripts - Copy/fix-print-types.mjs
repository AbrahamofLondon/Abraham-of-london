// scripts/fix-print-types.mjs
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const printsDir = join(process.cwd(), 'content/prints');

function fixPrintFiles() {
  console.log('🔧 Fixing print file types...');
  
  const files = readdirSync(printsDir).filter(f => f.endsWith('.mdx'));
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = join(printsDir, file);
    try {
      let content = readFileSync(filePath, 'utf8');
      
      // Fix type from "Resource" to "Print"
      if (content.includes('type: "Resource"')) {
        content = content.replace('type: "Resource"', 'type: "Print"');
        console.log(`  ✓ Fixed type in: ${file}`);
        fixedCount++;
      } else if (content.includes("type: 'Resource'")) {
        content = content.replace("type: 'Resource'", "type: 'Print'");
        console.log(`  ✓ Fixed type in: ${file}`);
        fixedCount++;
      } else if (content.includes('type: Resource')) {
        content = content.replace('type: Resource', 'type: Print');
        console.log(`  ✓ Fixed type in: ${file}`);
        fixedCount++;
      }
      
      // Ensure there's a date field
      if (!content.includes('date:')) {
        const today = new Date().toISOString().split('T')[0];
        content = content.replace(/(---\s*\ntitle:)/, `---\ndate: "${today}"\n$1`);
        console.log(`  ✓ Added date to: ${file}`);
      }
      
      writeFileSync(filePath, content, 'utf8');
      
    } catch (error) {
      console.log(`  ✗ Error fixing ${file}:`, error.message);
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} print files`);
}

fixPrintFiles().catch(console.error);