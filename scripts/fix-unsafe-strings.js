// scripts/fix-unsafe-strings.cjs
const fs = require('fs');
const path = require('path');

// SAFE replacement patterns - each pattern handles the FULL unsafe expression
const REPLACEMENTS = [
  // Pattern 1: Full capitalization pattern (charAt + slice)
  {
    pattern: /(\w+)\.charAt\(0\)\.toUpperCase\(\)\s*\+\s*\1\.slice\(1\)/g,
    replacement: 'safeCapitalize($1)',
    import: 'import { safeCapitalize } from "@/lib/utils/safe";'
  },
  {
    pattern: /(\w+)\.charAt\(0\)\.toUpperCase\(\)\s*\+\s*\1\.slice\(1\)\.toLowerCase\(\)/g,
    replacement: 'safeCapitalize($1)',
    import: 'import { safeCapitalize } from "@/lib/utils/safe";'
  },
  
  // Pattern 2: Partial fixes that were broken
  {
    pattern: /safeFirstChar\((\w+)\)\.toUpperCase\(\)\s*\+\s*\1\.slice\(1\)/g,
    replacement: 'safeCapitalize($1)',
    import: 'import { safeCapitalize } from "@/lib/utils/safe";'
  },
  
  // Pattern 3: .slice() on strings
  {
    pattern: /(\w+)\.slice\(([^)]*)\)/g,
    checkContext: (match, variable) => {
      // Only replace .slice() on variables that are likely strings
      // Check if it's NOT likely an array (no .map, .filter, .includes after)
      const afterMatch = match.slice(match.indexOf('.slice('));
      return !afterMatch.includes('.map') && 
             !afterMatch.includes('.filter') && 
             !afterMatch.includes('.includes');
    },
    replacement: (match, variable, args) => {
      const argList = args.trim();
      if (argList === '') {
        return `safeSlice(${variable})`;
      } else if (argList.includes(',')) {
        const [start, end] = argList.split(',').map(s => s.trim());
        return `safeSlice(${variable}, ${start}, ${end})`;
      } else {
        return `safeSlice(${variable}, ${argList})`;
      }
    },
    import: 'import { safeSlice } from "@/lib/utils/safe";'
  },
  
  // Pattern 4: .slice() on arrays
  {
    pattern: /(\w+)\.slice\(([^)]*)\)/g,
    checkContext: (match, variable) => {
      // Check if it's likely an array (has .map, .filter, .includes after)
      const afterMatch = match.slice(match.indexOf('.slice('));
      return afterMatch.includes('.map') || 
             afterMatch.includes('.filter') || 
             afterMatch.includes('.includes') ||
             variable.includes('tags') ||
             variable.includes('items') ||
             variable.includes('array');
    },
    replacement: (match, variable, args) => {
      const argList = args.trim();
      if (argList === '') {
        return `safeArraySlice(${variable})`;
      } else if (argList.includes(',')) {
        const [start, end] = argList.split(',').map(s => s.trim());
        return `safeArraySlice(${variable}, ${start}, ${end})`;
      } else {
        return `safeArraySlice(${variable}, ${argList})`;
      }
    },
    import: 'import { safeArraySlice } from "@/lib/utils/safe";'
  },
  
  // Pattern 5: String().slice() or new Date().toISOString().slice()
  {
    pattern: /(?:String\(|new Date\(\)\.toISOString\(\)|\.toISOString\(\))\.slice\(([^)]*)\)/g,
    replacement: (match, args) => {
      const argList = args.trim();
      if (argList.includes(',')) {
        const [start, end] = argList.split(',').map(s => s.trim());
        return `safeSlice(${match.includes('String(') ? '' : 'new Date().toISOString()'}, ${start}, ${end})`;
      } else {
        return `safeSlice(${match.includes('String(') ? '' : 'new Date().toISOString()'}, ${argList})`;
      }
    },
    import: 'import { safeSlice, safeDateSlice } from "@/lib/utils/safe";'
  },
  
  // Pattern 6: Direct .charAt() calls
  {
    pattern: /(\w+)\.charAt\((\d+)\)/g,
    replacement: 'safeCharAt($1, $2)',
    import: 'import { safeCharAt } from "@/lib/utils/safe";'
  },
  
  // Pattern 7: Direct .charAt(0) calls
  {
    pattern: /(\w+)\.charAt\(0\)/g,
    replacement: 'safeFirstChar($1)',
    import: 'import { safeFirstChar } from "@/lib/utils/safe";'
  }
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const importsNeeded = new Set();
  
  // Create backup first (safety measure)
  const backupPath = filePath + '.bak';
  fs.writeFileSync(backupPath, content);
  
  REPLACEMENTS.forEach(({ pattern, replacement, import: importStmt, checkContext }) => {
    // Find all matches
    const matches = [];
    let match;
    const regex = new RegExp(pattern.source, 'g');
    
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        fullMatch: match[0],
        groups: match.slice(1),
        index: match.index
      });
    }
    
    // Process matches in reverse order (to preserve indices)
    for (let i = matches.length - 1; i >= 0; i--) {
      const { fullMatch, groups, index } = matches[i];
      
      // Check context if needed
      if (checkContext && !checkContext(fullMatch, groups[0])) {
        continue;
      }
      
      // Apply replacement
      let newText;
      if (typeof replacement === 'function') {
        newText = replacement(fullMatch, ...groups);
      } else {
        newText = replacement;
      }
      
      // Only replace if different
      if (newText !== fullMatch) {
        content = content.substring(0, index) + 
                  newText + 
                  content.substring(index + fullMatch.length);
        
        importsNeeded.add(importStmt);
        changed = true;
      }
    }
  });
  
  if (changed) {
    // Remove duplicate imports
    const uniqueImports = Array.from(new Set(importsNeeded));
    
    // Check if imports already exist
    const existingImports = new Set();
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('from "@/lib/utils/safe"')) {
        existingImports.add(line.trim());
      }
    }
    
    // Add missing imports
    const importsToAdd = uniqueImports.filter(imp => !existingImports.has(imp));
    
    if (importsToAdd.length > 0) {
      // Find where to insert imports
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        // Insert after last import
        lines.splice(lastImportIndex + 1, 0, ...importsToAdd);
      } else {
        // Insert at the top (after any shebang or comment)
        let insertIndex = 0;
        while (insertIndex < lines.length && 
               (lines[insertIndex].startsWith('#!') || 
                lines[insertIndex].startsWith('//') ||
                lines[insertIndex].startsWith('/*'))) {
          insertIndex++;
        }
        lines.splice(insertIndex, 0, ...importsToAdd);
      }
      
      content = lines.join('\n');
    }
    
    // Write the file
    fs.writeFileSync(filePath, content);
    
    // Verify the fix didn't break anything
    try {
      // Simple syntax check - count parentheses
      const openParen = (content.match(/\(/g) || []).length;
      const closeParen = (content.match(/\)/g) || []).length;
      
      if (openParen !== closeParen) {
        console.error(`❌ BROKEN: ${filePath} - Mismatched parentheses!`);
        console.error(`   Restoring from backup...`);
        fs.writeFileSync(filePath, fs.readFileSync(backupPath, 'utf8'));
        fs.unlinkSync(backupPath);
        return false;
      }
      
      console.log(`✅ Fixed: ${filePath}`);
      fs.unlinkSync(backupPath);
      return true;
    } catch (error) {
      console.error(`❌ ERROR: ${filePath} - ${error.message}`);
      console.error(`   Restoring from backup...`);
      fs.writeFileSync(filePath, fs.readFileSync(backupPath, 'utf8'));
      fs.unlinkSync(backupPath);
      return false;
    }
  } else {
    // No changes needed, remove backup
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  }
  
  return changed;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let fixedCount = 0;
  let totalChecked = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      fixedCount += walkDir(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
      totalChecked++;
      if (fixFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Main execution
console.log('🔧 SAFELY fixing unsafe string methods...\n');
console.log('⚠️  Creating backups for safety (.bak files)...\n');

// Get directories from command line or use defaults
const directories = process.argv.slice(2);
const dirsToFix = directories.length > 0 ? directories : ['components', 'pages', 'lib'];

let totalFixed = 0;
let totalChecked = 0;

dirsToFix.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Fixing ${dir}/...`);
    const fixed = walkDir(dir);
    totalFixed += fixed;
    console.log(`  → Fixed ${fixed} files\n`);
  }
});

console.log(`\n🎉 SAFELY COMPLETED! Fixed ${totalFixed} files.`);
console.log('💾 Backups have been removed for successfully fixed files.');
console.log('🔍 Run "pnpm check:unsafe-strings" to verify fixes.');