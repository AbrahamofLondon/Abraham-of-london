// scripts/comprehensive-fix.mjs (already ES module)
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const contentDir = join(process.cwd(), 'content');

function fixAllIssues() {
  console.log('🔧 Comprehensive Content Fix...');
  
  // Fix prints directory
  const printsDir = join(contentDir, 'prints');
  try {
    const printFiles = readdirSync(printsDir).filter(f => f.endsWith('.mdx'));
    printFiles.forEach(file => {
      const filePath = join(printsDir, file);
      let content = readFileSync(filePath, 'utf8');
      
      // Fix type field
      if (content.includes('type: "Resource"') || content.includes("type: 'Resource'") || content.includes('type: Resource')) {
        content = content.replace(/type:\s*["']?Resource["']?/g, 'type: "Print"');
        console.log(`  ✓ Fixed type in: prints/${file}`);
      }
      
      // Ensure date field exists
      if (!content.includes('date:')) {
        const today = new Date().toISOString().split('T')[0];
        content = content.replace(/---\s*\n/, `---\ndate: "${today}"\n`);
        console.log(`  ✓ Added date to: prints/${file}`);
      }
      
      // Fix Windows line endings
      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      writeFileSync(filePath, content, 'utf8');
    });
  } catch (error) {
    console.log('  ⚠ No prints directory or error:', error.message);
  }
  
  // Fix strategy/sample-strategy.mdx
  const strategyFile = join(contentDir, 'strategy', 'sample-strategy.mdx');
  try {
    let content = readFileSync(strategyFile, 'utf8');
    if (!content.includes('date:')) {
      const today = new Date().toISOString().split('T')[0];
      content = content.replace(/---\s*\n/, `---\ndate: "${today}"\n`);
      console.log(`  ✓ Added date to: strategy/sample-strategy.mdx`);
      writeFileSync(strategyFile, content, 'utf8');
    }
  } catch (error) {
    console.log('  ⚠ strategy/sample-strategy.mdx not found');
  }
  
  console.log('\n✅ Fix complete!');
}

fixAllIssues().catch(console.error);