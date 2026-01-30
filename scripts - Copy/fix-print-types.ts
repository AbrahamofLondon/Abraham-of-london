// scripts/fix-print-types.js (CommonJS - works in Windows)
const fs = require('fs');
const path = require('path');

const printsDir = path.join(process.cwd(), 'content/prints');

console.log('🔧 Fixing print file types...');

try {
  const files = fs.readdirSync(printsDir).filter(f => f.endsWith('.mdx'));
  let fixedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(printsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Fix all variations of type: Resource
    content = content.replace(/type:\s*["']?Resource["']?/g, 'type: "Print"');
    content = content.replace(/type:\s*Print["']?/g, 'type: "Print"'); // Ensure consistent quotes
    
    // Also fix if it's on the same line as other fields
    content = content.replace(/type:\s*Resource\s*\n/g, 'type: "Print"\n');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ Fixed: ${file}`);
      fixedCount++;
    }
  });
  
  console.log(`\n✅ Fixed ${fixedCount} print files`);
  
} catch (error) {
  console.error('Error:', error.message);
}
