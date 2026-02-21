// scripts/fix-unsafe-strings-surgical.cjs - REINFORCED INSTITUTIONAL VERSION
const fs = require('fs');
const path = require('path');

console.log('🔪 FINAL SURGICAL FIX - Targeting unsafe methods with MDX Protection\n');

// COMPLETE PATTERNS BASED ON PORTFOLIO REQUIREMENTS
const SURGICAL_PATTERNS = [
  // ====== 1. SIMPLE .slice() PATTERNS ======
  {
    pattern: /\.slice\(0,\s*(\d+)\)/g,
    replacement: (match, count, line) => {
      if (line.includes('.map(') || line.includes('.filter(') || 
          line.includes('tags') || line.includes('items') || 
          line.includes('posts') || line.includes('events') ||
          line.includes('prints') || line.includes('shorts') ||
          line.includes('books') || line.includes('pdfs')) {
        return `.slice(0, ${count})`; 
      }
      return `.slice(0, ${count})`; 
    },
    import: 'safeSlice,safeArraySlice'
  },
  
  // ====== 2. ARRAY SLICE PATTERNS ======
  {
    pattern: /(\w+)\?\.slice\(0,\s*(\d+)\)\.map/g,
    replacement: 'safeArraySlice($1, 0, $2)?.map',
    import: 'safeArraySlice'
  },
  {
    pattern: /(\w+)\.slice\(0,\s*(\d+)\)\.map/g,
    test: (variable) => variable.includes('tags') || variable === 'asset',
    replacement: (match, variable, count) => `safeArraySlice(${variable}, 0, ${count}).map`,
    import: 'safeArraySlice'
  },
  {
    pattern: /\.slice\(0,\s*(\d+)\)\s*;/g,
    context: ['tags', 'items', 'posts', 'events', 'pdfs', 'shorts', 'books'],
    replacement: (match, count) => `safeArraySlice(..., 0, ${count});`,
    import: 'safeArraySlice'
  },
  {
    pattern: /(\w+)\.slice\(\)/g,
    test: (variable) => variable.includes('items') || variable === 'arr' || variable === 'DEFAULT_ITEMS',
    replacement: 'safeArraySlice($1)',
    import: 'safeArraySlice'
  },
  
  // ====== 3. STRING SLICE PATTERNS ======
  {
    pattern: /(\w+)\.slice\(0,\s*(\d+)\)/g,
    test: (variable) => ['name', 'subject', 'reason', 'body', 'auth', 'p', 'filename'].includes(variable),
    replacement: 'safeSlice($1, 0, $2)',
    import: 'safeSlice'
  },
  {
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
  
  // ====== 4. CHARAT & CAPITALIZATION ======
  {
    pattern: /\.charAt\((\d+)\)/g,
    replacement: 'safeCharAt(..., $1)',
    import: 'safeCharAt'
  },
  {
    pattern: /safeFirstChar\((\w+)\)\.toUpperCase\(\)\s*\+\s*\1\.slice\(1\)/g,
    replacement: 'safeCapitalize($1)',
    import: 'safeCapitalize'
  }
];

// Ensure safe.ts contains all necessary utilities
function updateSafeUtils() {
  const safePath = 'lib/utils/safe.ts';
  if (!fs.existsSync(path.dirname(safePath))) {
    fs.mkdirSync(path.dirname(safePath), { recursive: true });
  }
  
  let content = fs.existsSync(safePath) ? fs.readFileSync(safePath, 'utf8') : 'export const safeString = (v: any) => String(v || "");\n';
  let updated = false;

  const utils = [
    {
      name: 'safeArraySlice',
      code: '\nexport const safeArraySlice = <T>(arr: T[] | null | undefined, start?: number, end?: number, fallback: T[] = []): T[] => {\n  if (!arr || !Array.isArray(arr)) return fallback;\n  try { return arr.slice(start, end); } catch { return fallback; }\n};'
    },
    {
      name: 'safeTrimSlice',
      code: '\nexport const safeTrimSlice = (value: unknown, start: number, end?: number, fallback: string = ""): string => {\n  const str = String(value || "");\n  return str.trim().slice(start, end) || fallback;\n};'
    }
  ];

  utils.forEach(util => {
    if (!content.includes(util.name)) {
      content += util.code;
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(safePath, content);
    console.log('✅ Updated lib/utils/safe.ts with required utilities.');
  }
}

function manageImports(content, neededImports) {
  const lines = content.split('\n');
  let importFunctions = new Set();
  let safeImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('from "@/lib/utils/safe"')) {
      safeImportIndex = i;
      const match = lines[i].match(/import\s*{([^}]+)}\s*from/);
      if (match) match[1].split(',').forEach(fn => importFunctions.add(fn.trim()));
      break;
    }
  }

  neededImports.forEach(func => importFunctions.add(func));
  const newImport = `import { ${Array.from(importFunctions).join(', ')} } from "@/lib/utils/safe";`;

  if (safeImportIndex !== -1) {
    lines[safeImportIndex] = newImport;
  } else {
    lines.unshift(newImport);
  }
  return lines.join('\n');
}

function applyPatterns(content) {
  const lines = content.split('\n');
  const neededImports = new Set();
  const changes = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    SURGICAL_PATTERNS.forEach(({ pattern, replacement, import: imp, test, context }) => {
      if (!line.match(pattern)) return;
      if (context && !context.some(ctx => line.includes(ctx))) return;

      lines[i] = line.replace(pattern, (match, ...args) => {
        const variable = args[0] || '';
        if (test && !test(variable)) return match;

        let result = typeof replacement === 'function' ? replacement(match, ...args, line) : replacement.replace(/\$(\d+)/g, (_, n) => args[n - 1] || '');
        
        if (result !== match) {
          imp.split(',').forEach(name => neededImports.add(name.trim()));
          changes.push({ line: i + 1, from: match, to: result });
          return result;
        }
        return match;
      });
    });
  }

  return { content: lines.join('\n'), neededImports, changes, changed: changes.length > 0 };
}

function fixFileSurgically(filePath) {
  if (!fs.existsSync(filePath)) return false;

  // 🛡️ EXTENSION GATE: Prevents MDX/JSON Corruption
  const ext = path.extname(filePath).toLowerCase();
  if (['.mdx', '.md', '.json', '.yaml', '.yml'].includes(ext)) {
    console.log(`🛡️  SKIPPING CONTENT: ${filePath}`);
    return false;
  }

  const originalContent = fs.readFileSync(filePath, 'utf8');
  const result = applyPatterns(originalContent);
  if (!result.changed) return false;

  let finalContent = manageImports(result.content, result.neededImports);
  fs.writeFileSync(filePath, finalContent);
  console.log(`✅ FIXED: ${filePath} (${result.changes.length} changes)`);
  return true;
}

const FILES_TO_FIX = [
  'components/analytics/AnalyticsDashboard.tsx',
  'components/BlogPostCard.tsx',
  'components/BookHero.tsx',
  'components/books/BookCard.tsx',
  'components/books/RelatedBooks.tsx',
  'components/CanonCard.tsx',
  'components/downloads/RelatedDownloads.tsx',
  'components/events/RelatedEvents.tsx',
  'components/PDFDashboard/PDFRecentActivity.tsx',
  'lib/pdf-registry.ts',
  'lib/searchIndex.ts',
  'lib/server/guards.ts',
  'lib/utils.ts'
];

updateSafeUtils();
FILES_TO_FIX.forEach(fixFileSurgically);
console.log('\n🏁 Institutional Fix Complete.');