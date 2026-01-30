// scripts/fix-unsafe-strings-surgical.cjs - FINAL VERSION
const fs = require('fs');
const path = require('path');

console.log('🔪 FINAL SURGICAL FIX - Targeting all remaining unsafe methods\n');

// COMPLETE PATTERNS BASED ON ALL ERRORS
const SURGICAL_PATTERNS = [
  // ====== 1. SIMPLE .slice() PATTERNS (most common) ======
  {
    // .slice(0, N) - generic pattern
    pattern: /\.slice\(0,\s*(\d+)\)/g,
    replacement: (match, count, line) => {
      // Check context to decide between safeSlice or safeArraySlice
      if (line.includes('.map(') || line.includes('.filter(') || 
          line.includes('tags') || line.includes('items') || 
          line.includes('posts') || line.includes('events') ||
          line.includes('prints') || line.includes('shorts') ||
          line.includes('books') || line.includes('pdfs')) {
        return `.slice(0, ${count})`; // Will be handled by specific patterns
      }
      return `.slice(0, ${count})`; // Default - will be caught by other patterns
    },
    import: 'safeSlice,safeArraySlice'
  },
  
  // ====== 2. ARRAY SLICE PATTERNS ======
  {
    // tags?.slice(0, 3).map
    pattern: /(\w+)\?\.slice\(0,\s*(\d+)\)\.map/g,
    replacement: 'safeArraySlice($1, 0, $2)?.map',
    import: 'safeArraySlice'
  },
  {
    // tags.slice(0, 3).map
    pattern: /(\w+)\.slice\(0,\s*(\d+)\)\.map/g,
    test: (variable) => variable.includes('tags') || variable === 'asset',
    replacement: (match, variable, count) => `safeArraySlice(${variable}, 0, ${count}).map`,
    import: 'safeArraySlice'
  },
  {
    // .slice(0, N); (array slice)
    pattern: /\.slice\(0,\s*(\d+)\)\s*;/g,
    context: ['tags', 'items', 'posts', 'events', 'pdfs', 'shorts', 'books'],
    replacement: (match, count) => `safeArraySlice(..., 0, ${count});`,
    import: 'safeArraySlice'
  },
  {
    // .slice() - empty array slice
    pattern: /(\w+)\.slice\(\)/g,
    test: (variable) => variable.includes('items') || variable === 'arr' || variable === 'DEFAULT_ITEMS',
    replacement: 'safeArraySlice($1)',
    import: 'safeArraySlice'
  },
  {
    // .slice(start) on arrays
    pattern: /(\w+)\.slice\((\d+)\)/g,
    test: (variable) => variable.includes('brandValues') || variable === 'NAV_ITEMS',
    replacement: 'safeArraySlice($1, $2)',
    import: 'safeArraySlice'
  },
  {
    // Array.from(...).slice()
    pattern: /Array\.from\([^)]+\)\.slice\(0,\s*(\d+)\)/g,
    replacement: 'safeArraySlice(Array.from(...), 0, $1)',
    import: 'safeArraySlice'
  },
  {
    // .flatMap().slice()
    pattern: /\.flatMap\([^)]+\)\.slice\(0,\s*(\d+)\)/g,
    replacement: (match, count, line) => {
      // Extract the variable before .flatMap
      const beforeFlatMap = line.split('.flatMap')[0];
      return `safeArraySlice(${beforeFlatMap}.flatMap(...), 0, ${count})`;
    },
    import: 'safeArraySlice'
  },
  {
    // .filter().slice()
    pattern: /\.filter\([^)]+\)\.slice\(0,\s*(\d+)\)/g,
    replacement: (match, count, line) => {
      const beforeFilter = line.split('.filter')[0];
      return `safeArraySlice(${beforeFilter}.filter(...), 0, ${count})`;
    },
    import: 'safeArraySlice'
  },
  {
    // ['a', 'b'].slice()
    pattern: /(\[[^\]]+\])\.slice\(0,\s*(\d+)\)/g,
    replacement: 'safeArraySlice($1, 0, $2)',
    import: 'safeArraySlice'
  },
  {
    // getX().slice()
    pattern: /(get\w+\(\))\.slice\(0,\s*(\d+)\)/g,
    replacement: 'safeArraySlice($1, 0, $2)',
    import: 'safeArraySlice'
  },
  
  // ====== 3. STRING SLICE PATTERNS ======
  {
    // .slice() - empty string slice
    pattern: /\.slice\(\)/g,
    context: ['stdout', 'metric', 'text', 'str'],
    replacement: 'safeSlice(...)',
    import: 'safeSlice'
  },
  {
    // .slice(0, N) on strings
    pattern: /(\w+)\.slice\(0,\s*(\d+)\)/g,
    test: (variable) => variable === 'name' || variable === 'subject' || 
                       variable === 'reason' || variable === 'body' || 
                       variable === 'auth' || variable === 'p' || 
                       variable === 'filename',
    replacement: 'safeSlice($1, 0, $2)',
    import: 'safeSlice'
  },
  {
    // .slice(start, end) on strings
    pattern: /(\w+)\.slice\((\d+),\s*(\d+)\)/g,
    test: (variable) => variable === 'part' || variable === 'stdout' || 
                       variable === 'stderr' || variable === 'digits',
    replacement: 'safeSlice($1, $2, $3)',
    import: 'safeSlice'
  },
  {
    // .slice(-N) on strings
    pattern: /(\w+)\.slice\((-?\d+)\)/g,
    test: (variable) => variable === 'key' || variable === 'cleaned' || 
                       variable === 'normalized' || variable === 'trimmed' ||
                       variable === 'stdout' || variable === 'stderr' ||
                       variable === 'args' || variable === 'v',
    replacement: 'safeSlice($1, $2)',
    import: 'safeSlice'
  },
  {
    // String().slice()
    pattern: /String\(([^)]+)\)\.slice\(([^)]*)\)/g,
    replacement: 'safeSlice(String($1), $2)',
    import: 'safeSlice'
  },
  {
    // .trim().slice()
    pattern: /\.trim\(\)\.slice\(([^)]*)\)/g,
    replacement: (match, args) => {
      if (args.includes(',')) {
        const [start, end] = args.split(',').map(s => s.trim());
        return `safeTrimSlice(..., ${start}, ${end})`;
      }
      return `safeTrimSlice(..., ${args})`;
    },
    import: 'safeTrimSlice'
  },
  
  // ====== 4. CHARAT PATTERNS ======
  {
    // .charAt(index)
    pattern: /\.charAt\((\d+)\)/g,
    replacement: 'safeCharAt(..., $1)',
    import: 'safeCharAt'
  },
  
  // ====== 5. CAPITALIZATION PATTERNS ======
  {
    // safeFirstChar(x).toUpperCase() + x.slice(1)
    pattern: /safeFirstChar\((\w+)\)\.toUpperCase\(\)\s*\+\s*\1\.slice\(1\)/g,
    replacement: 'safeCapitalize($1)',
    import: 'safeCapitalize'
  },
  {
    // kind.slice(1) in capitalization context
    pattern: /kind\.slice\(1\)/g,
    context: ['safeFirstChar', 'toUpperCase'],
    replacement: 'safeSlice(kind, 1)',
    import: 'safeSlice'
  },
];

// Update safe.ts with ALL needed utilities
function updateSafeUtils() {
  const safePath = 'lib/utils/safe.ts';
  if (!fs.existsSync(safePath)) return;
  
  let content = fs.readFileSync(safePath, 'utf8');
  let updated = false;
  
  // Ensure safeArraySlice exists
  if (!content.includes('export const safeArraySlice')) {
    const safeArraySlice = `
export const safeArraySlice = <T>(
  arr: T[] | null | undefined,
  start?: number,
  end?: number,
  fallback: T[] = []
): T[] => {
  if (!arr || !Array.isArray(arr)) return fallback;
  try {
    return arr.slice(start, end);
  } catch {
    return fallback;
  }
};`;
    
    // Insert after safeArray function
    const arrayStart = content.indexOf('export const safeArray');
    if (arrayStart !== -1) {
      const nextExport = content.indexOf('\nexport const', arrayStart + 1);
      const insertPos = nextExport !== -1 ? nextExport : content.length;
      content = content.slice(0, insertPos) + safeArraySlice + content.slice(insertPos);
      updated = true;
      console.log('✅ Added safeArraySlice to lib/utils/safe.ts');
    }
  }
  
  // Ensure safeTrimSlice exists
  if (!content.includes('export const safeTrimSlice')) {
    const safeTrimSlice = `
export const safeTrimSlice = (
  value: unknown,
  start: number,
  end?: number,
  fallback: string = ''
): string => {
  const str = safeString(value);
  const trimmed = str.trim();
  return safeSlice(trimmed, start, end, fallback);
};`;
    
    // Insert after safeSlice function
    const sliceStart = content.indexOf('export const safeSlice');
    if (sliceStart !== -1) {
      const nextExport = content.indexOf('\nexport const', sliceStart + 1);
      const insertPos = nextExport !== -1 ? nextExport : content.length;
      content = content.slice(0, insertPos) + safeTrimSlice + content.slice(insertPos);
      updated = true;
      console.log('✅ Added safeTrimSlice to lib/utils/safe.ts');
    }
  }
  
  // Ensure safeDateSlice exists
  if (!content.includes('export const safeDateSlice')) {
    const safeDateSlice = `
export const safeDateSlice = (
  date: Date | string,
  start: number = 0,
  end?: number
): string => {
  const dateStr = date instanceof Date ? date.toISOString() : String(date);
  return safeSlice(dateStr, start, end);
};`;
    
    // Insert before the last export
    const lastExport = content.lastIndexOf('\nexport const');
    if (lastExport !== -1) {
      content = content.slice(0, lastExport) + safeDateSlice + content.slice(lastExport);
      updated = true;
      console.log('✅ Added safeDateSlice to lib/utils/safe.ts');
    }
  }
  
  if (updated) {
    fs.writeFileSync(safePath, content);
  }
}

// Smart replacement with full context
function applyPatterns(content) {
  const lines = content.split('\n');
  const neededImports = new Set();
  const changes = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let lineChanged = false;
    
    SURGICAL_PATTERNS.forEach(({ pattern, replacement, import: importNames, test, context }) => {
      if (!line.match(pattern)) return;
      
      // Check context if specified
      if (context && !context.some(ctx => line.includes(ctx))) return;
      
      const newLine = line.replace(pattern, (match, ...args) => {
        const variable = args[0] || '';
        const lineContext = line;
        
        // Apply test if specified
        if (test && !test(variable)) return match;
        
        // Apply replacement
        if (typeof replacement === 'function') {
          try {
            const result = replacement(match, ...args, lineContext);
            if (result !== match && importNames) {
              importNames.split(',').forEach(imp => neededImports.add(imp.trim()));
              changes.push({ line: i + 1, from: match, to: result });
              lineChanged = true;
            }
            return result;
          } catch (e) {
            return match; // If replacement fails, keep original
          }
        } else {
          const result = replacement.replace(/\$(\d+)/g, (_, n) => args[n - 1] || '');
          if (result !== match && importNames) {
            importNames.split(',').forEach(imp => neededImports.add(imp.trim()));
            changes.push({ line: i + 1, from: match, to: result });
            lineChanged = true;
          }
          return result;
        }
      });
      
      if (lineChanged) {
        lines[i] = newLine;
      }
    });
  }
  
  return {
    content: lines.join('\n'),
    neededImports,
    changes,
    changed: changes.length > 0
  };
}

// Fix specific file
function fixFileSurgically(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const result = applyPatterns(originalContent);
  
  if (!result.changed) return false;
  
  // Update imports if needed
  let content = result.content;
  if (result.neededImports.size > 0) {
    content = manageImports(content, result.neededImports);
  }
  
  // Create backup
  const backupPath = `${filePath}.final-backup`;
  fs.writeFileSync(backupPath, originalContent);
  
  // Write fixed file
  fs.writeFileSync(filePath, content);
  
  // Log changes
  console.log(`\n📝 ${filePath}:`);
  result.changes.forEach(change => {
    console.log(`  Line ${change.line}: ${change.from}`);
    console.log(`    → ${change.to}`);
  });
  console.log(`  💾 Backup: ${backupPath}`);
  
  return true;
}

// Import management
function manageImports(content, neededImports) {
  const lines = content.split('\n');
  const importFunctions = new Set();
  
  // Find existing safe import
  let safeImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('from "@/lib/utils/safe"')) {
      safeImportIndex = i;
      const match = lines[i].match(/import\s*{([^}]+)}\s*from/);
      if (match) {
        match[1].split(',').forEach(fn => {
          importFunctions.add(fn.trim());
        });
      }
      break;
    }
  }
  
  // Add new functions
  neededImports.forEach(func => {
    if (func) importFunctions.add(func);
  });
  
  // Create new import line
  const newImport = `import { ${Array.from(importFunctions).join(', ')} } from "@/lib/utils/safe";`;
  
  if (safeImportIndex !== -1) {
    lines[safeImportIndex] = newImport;
  } else {
    // Add new import at appropriate position
    let insertIndex = 0;
    while (insertIndex < lines.length && 
           (lines[insertIndex].startsWith('#!') || 
            lines[insertIndex].startsWith('//') ||
            lines[insertIndex].startsWith('/*'))) {
      insertIndex++;
    }
    lines.splice(insertIndex, 0, newImport);
  }
  
  return lines.join('\n');
}

// Files from latest error output
const FILES_TO_FIX = [
  // Components
  'components/analytics/AnalyticsDashboard.tsx',
  'components/BlogPostCard.tsx',
  'components/BookHero.tsx',
  'components/books/BookCard.tsx',
  'components/books/RelatedBooks.tsx',
  'components/CanonCard.tsx',
  'components/downloads/RelatedDownloads.tsx',
  'components/downloads/SurrenderAssetsLanding.tsx',
  'components/events/RelatedEvents.tsx',
  'components/homepage/MilestonesTimeline.tsx',
  'components/homepage/TestimonialsSection.tsx',
  'components/PDFDashboard/PDFComparisonView.tsx',
  'components/PDFDashboard/PDFRecentActivity.tsx',
  'components/resources/RelatedResources.tsx',
  'components/SearchPalette.tsx',
  'components/shorts/RelatedShorts.tsx',
  
  // Pages
  'pages/about.tsx',
  'pages/api/contact.ts',
  'pages/blog/index.tsx',
  'pages/blog/[slug].tsx',
  'pages/books/index.tsx',
  'pages/canon/index.tsx',
  'pages/content/index.tsx',
  'pages/index.tsx',
  'pages/prints/index.tsx',
  'pages/shorts/index.tsx',
  
  // Lib
  'lib/content-fallback.ts',
  'lib/content-manager.ts',
  'lib/input-validator.ts',
  'lib/pdf-registry.ts',
  'lib/searchIndex.ts',
  'lib/server/access/session.ts',
  'lib/server/access.ts',
  'lib/server/guards.ts',
  'lib/utils/string.ts',
  'lib/utils.ts'
];

// Main execution
updateSafeUtils();

console.log('Applying final fixes to all remaining files...\n');

let fixedCount = 0;
let notFound = 0;

FILES_TO_FIX.forEach(file => {
  if (fs.existsSync(file)) {
    if (fixFileSurgically(file)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
    notFound++;
  }
});

console.log(`\n🎉 FINAL SURGICAL FIX COMPLETE!`);
console.log(`Fixed: ${fixedCount} files`);
console.log(`Not found: ${notFound} files`);
console.log(`\n💡 Run: pnpm check:unsafe-strings`);
console.log(`💡 If any errors remain, they should be minimal.`);