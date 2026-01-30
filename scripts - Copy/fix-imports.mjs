// scripts/fix-imports.mjs - UPDATED VERSION
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// UPDATED PATTERNS for absolute paths
const REPLACEMENTS = [
  // Fix: Remove imports from components/Cards that should come from elsewhere
  [
    /^import\s*{([^}]*?\bsiteConfig\b[^}]*?)}\s*from\s*['"]@\/components\/Cards['"];?\s*$/gm,
    '// REMOVED: import from Cards (use @/lib/imports or @/lib/siteConfig)'
  ],
  // Consolidate multiple lib imports into single lib/imports
  [
    /import\s*{([^}]*?)}\s*from\s*['"]@\/lib\/siteConfig['"];?\s*$/gm,
    'import { siteConfig } from "@/lib/imports";'
  ],
  [
    /import\s*{([^}]*?)}\s*from\s*['"]@\/lib\/utils['"];?\s*$/gm,
    'import { $1 } from "@/lib/imports";'
  ],
  [
    /import\s*{([^}]*?)}\s*from\s*['"]@\/lib\/image-utils['"];?\s*$/gm,
    'import { $1 } from "@/lib/imports";'
  ],
];

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;

    for (const [pattern, replacement] of REPLACEMENTS) {
      const newContent = content.replace(pattern, (...args) => {
        console.log(`Matched pattern in ${path.basename(filePath)}`);
        console.log(`Match: ${args[0]}`);
        return replacement.replace('$1', args[1]?.trim() || '');
      });
      
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }

    if (changed) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Updated: ${path.relative(PROJECT_ROOT, filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function findAndProcessFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let totalUpdated = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (['node_modules', '.next', '.contentlayer', '.git', 'dist'].includes(entry.name)) {
        continue;
      }
      totalUpdated += await findAndProcessFiles(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const wasUpdated = await processFile(fullPath);
      if (wasUpdated) totalUpdated++;
    }
  }
  return totalUpdated;
}

async function main() {
  console.log('🔍 Scanning and fixing import statements...\n');
  const totalUpdated = await findAndProcessFiles(PROJECT_ROOT);
  console.log(`\n✨ Done! Updated ${totalUpdated} file(s).`);
}

main().catch(console.error);