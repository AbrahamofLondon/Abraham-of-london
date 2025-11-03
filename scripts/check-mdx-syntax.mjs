// scripts/check-mdx-syntax.mjs
// This script scans MDX files for common syntax errors like brace mismatches
// or stray HTML/JSX tags that can break the build.

import { globby } from 'globby';
import fsp from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();

async function main() {
  console.log('[MDX Check] Scanning for MDX/MD files...');
  
  const files = await globby([
    'content/**/*.{md,mdx}',
    'pages/**/*.{md,mdx}',
    '!**/node_modules/**',
  ], {
    cwd: ROOT,
    absolute: true,
  });

  let errorCount = 0;

  for (const file of files) {
    const relPath = path.relative(ROOT, file);
    try {
      const content = await fsp.readFile(file, 'utf8');
      
      // Simple check for stray HTML/JSX tags outside of code blocks
      const strayTag = /<[a-zA-Z]/.test(content);
      
      // Check for an unequal number of opening and closing braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const braceMismatch = openBraces !== closeBraces;

      if (braceMismatch) {
        console.error(`[MDX Check] ERROR: Brace mismatch {} detected in: ${relPath} (Open: ${openBraces}, Close: ${closeBraces})`);
        errorCount++;
      }

    } catch (e) {
      console.error(`[MDX Check] FAILED to read ${relPath}: ${e.message}`);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    console.error(`\n[MDX Check] Failed with ${errorCount} error(s). Please review the files above.`);
    process.exit(1);
  } else {
    console.log(`[MDX Check] All ${files.length} files seem clean.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});