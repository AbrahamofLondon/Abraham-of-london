// scripts/fix-unsafe-strings.cjs (CommonJS version)
const fs = require('fs');
const path = require('path');

// Replacement patterns
const REPLACEMENTS = [
  // Pattern 1: .charAt(0) -> safeFirstChar()
  {
    pattern: /(\w+)\.charAt\(0\)/g,
    replacement: 'safeFirstChar($1)',
    import: 'safeFirstChar'
  },
  
  // Pattern 2: .charAt(index) -> safeCharAt()
  {
    pattern: /(\w+)\.charAt\((\d+)\)/g,
    replacement: 'safeCharAt($1, $2)',
    import: 'safeCharAt'
  },
  
  // Pattern 3: .slice() on strings -> safeSlice()
  {
    pattern: /(\w+)\.slice\(([^)]*)\)/g,
    replacement: (match, str, args) => {
      // Check if it's likely a string (not an array)
      const argsStr = args.trim();
      if (argsStr.includes(',') || argsStr === '') {
        return `safeSlice(${str}, ${args})`;
      }
      return match; // Don't replace if we're not sure
    },
    import: 'safeSlice'
  },
  
  // Pattern 4: .slice() on arrays -> safeArraySlice()
  {
    pattern: /(\w+)\.slice\(([^)]*)\)/g,
    context: ['tags', 'items', 'array', 'arr', 'list', 'posts', 'events'],
    replacement: (match, arr, args) => {
      return `safeArraySlice(${arr}, ${args})`;
    },
    import: 'safeArraySlice'
  },
  
  // Pattern 5: Capitalization pattern
  {
    pattern: /(\w+)\.charAt\(0\)\.toUpperCase\(\)\s*\+\s*\1\.slice\(1\)/g,
    replacement: 'safeCapitalize($1)',
    import: 'safeCapitalize'
  },
  
  // Pattern 6: .toISOString().slice()
  {
    pattern: /(\w+)\.toISOString\(\)\.slice\(([^)]*)\)/g,
    replacement: 'safeDateSlice($1, $2)',
    import: 'safeDateSlice'
  }
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const importsNeeded = new Set();
  
  REPLACEMENTS.forEach(({ pattern, replacement, import: importName, context }) => {
    // Check if pattern exists
    const matches = content.match(pattern);
    if (!matches) return;
    
    // Apply replacement
    if (typeof replacement === 'function') {
      content = content.replace(pattern, (match, ...args) => {
        // If context is specified, check variable name
        if (context && !context.includes(args[0])) {
          return match; // Skip if variable doesn't match context
        }
        importsNeeded.add(importName);
        changed = true;
        return replacement(match, ...args);
      });
    } else {
      content = content.replace(pattern, replacement);
      importsNeeded.add(importName);
      changed = true;
    }
  });
  
  if (changed && importsNeeded.size > 0) {
    // Add import statement
    const importStatement = `import { ${Array.from(importsNeeded).join(', ')} } from "@/lib/utils/safe";\n`;
    
    // Find where to insert import
    const lines = content.split('\n');
    
    // Look for existing safe import
    const hasSafeImport = lines.some(line => line.includes('@/lib/utils/safe'));
    
    if (!hasSafeImport) {
      // Insert after the last import statement
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, importStatement);
      } else {
        // No imports found, add at the top
        lines.unshift(importStatement);
      }
      
      content = lines.join('\n');
    }
    
    // Write the file
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
  
  return changed;
}

// Walk directory
function walkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let fixedCount = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      fixedCount += walkDir(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
      if (fixFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Main execution
console.log('🔧 Fixing unsafe string methods...\n');

// Get directories from command line or use defaults
const directories = process.argv.slice(2);
const dirsToFix = directories.length > 0 ? directories : ['components', 'pages', 'lib'];

let totalFixed = 0;
dirsToFix.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Fixing ${dir}/...`);
    const fixed = walkDir(dir);
    totalFixed += fixed;
    console.log(`  → Fixed ${fixed} files\n`);
  }
});

console.log(`\n🎉 Done! Fixed ${totalFixed} files.`);