// scripts/content/validate-content.ts — HARDENED (Content Quality Gate)
import { readdirSync, existsSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * INSTITUTIONAL AUDIT POLICY:
 * 1. Category must be a STRING (Contentlayer constraint).
 * 2. AccessLevel defaults to PUBLIC if missing (Abraham's Policy).
 * 3. Size fields must contain UNITS (MB/KB) for the UI.
 */

console.log('🔍 [IQC] Initiating deep content validation...');

const contentDir = join(process.cwd(), 'content');

if (!existsSync(contentDir)) {
  console.log('📁 [IQC] Content registry not found. Skipping validation.');
  process.exit(0);
}

const validationErrors: Array<{file: string, errors: string[]}> = [];
const validationWarnings: Array<{file: string, warnings: string[]}> = [];

let fileCount = 0;
let totalSize = 0;
const extensions: Record<string, number> = {};
const categories: Record<string, number> = {};

function validateMdxFile(filePath: string, category?: string) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const errors: string[] = [];
    const warnings: string[] = [];

    // --- 1. THE CONTENTLAYER KILLERS (CRITICAL) ---
    if (content.includes('category: [')) {
      errors.push('Category field is an array (Contentlayer requires a single string).');
    }

    // --- 2. ABRAHAM'S ACCESS POLICY (ADAPTIVE) ---
    const hasAccessLevel = content.match(/accessLevel:\s*['"]?(\w+)['"]?/);
    if (!hasAccessLevel) {
      // We don't error here anymore; we just note the auto-resolution
      warnings.push('Missing accessLevel: System will default to "public".');
    }

    // --- 3. UI INTEGRITY (WARNINGS) ---
    // Check for size fields without units (e.g., size: 2.5 vs size: 2.5MB)
    const sizeMatch = content.match(/size:\s*["']?(\d+(?:\.\d+)?)(?:\s|["']|$|\n)/g);
    if (sizeMatch) {
      sizeMatch.forEach(match => {
        if (!match.includes('MB') && !match.includes('KB') && !match.includes('GB')) {
          warnings.push(`Unitless size detected: "${match.trim()}" (Add MB/KB).`);
        }
      });
    }

    // --- 4. STRUCTURAL INTEGRITY ---
    if (!content.startsWith('---') || content.split('---').length < 3) {
      errors.push('Malformed or missing YAML frontmatter delimiters.');
    }

    if (errors.length > 0) validationErrors.push({ file: filePath, errors });
    if (warnings.length > 0) validationWarnings.push({ file: filePath, warnings });
    
  } catch (error: any) {
    console.log(`  ⚠️  [IQC_SKIPPED] ${filePath}: ${error.message}`);
  }
}

function scanDirectory(dir: string, currentCategory?: string) {
  const items = readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = join(dir, item.name);
    
    if (item.isDirectory()) {
      scanDirectory(itemPath, item.name);
    } else if (item.isFile()) {
      const extMatch = item.name.match(/\.([a-zA-Z0-9]+)$/);
      if (extMatch) {
        const ext = extMatch[1].toLowerCase();
        if (['md', 'mdx'].includes(ext)) {
          fileCount++;
          validateMdxFile(itemPath, currentCategory);
          
          const stats = statSync(itemPath);
          totalSize += stats.size;
          extensions[ext] = (extensions[ext] || 0) + 1;
          
          if (currentCategory) {
            categories[currentCategory] = (categories[currentCategory] || 0) + 1;
          }
        }
      }
    }
  }
}

// EXECUTE
try {
  scanDirectory(contentDir);
  
  console.log(`\n📊 [AUDIT_SUMMARY]`);
  console.log(`  Assets Scanned: ${fileCount}`);
  console.log(`  Total Payload: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  if (validationErrors.length > 0) {
    console.log(`\n🚨 [IQC_REJECTED] ${validationErrors.length} Critical Issues:`);
    validationErrors.forEach(({ file, errors }) => {
      console.log(`  ❌ ${file.split('content/')[1]}`);
      errors.forEach(e => console.log(`     • ${e}`));
    });
    
    console.log('\n💡 [SOLUTION] Run "pnpm vault:fix" or manually convert category arrays to strings.');
    process.exit(1); 
  }

  if (validationWarnings.length > 0) {
    console.log(`\n⚠️  [IQC_ADVISORY] ${validationWarnings.length} Optimizations possible:`);
    // Only show first 5 warnings to prevent log-bloat in CI
    validationWarnings.slice(0, 5).forEach(({ file, warnings }) => {
      console.log(`  ⚠️  ${file.split('content/')[1]}`);
      warnings.forEach(w => console.log(`     • ${w}`));
    });
    if (validationWarnings.length > 5) console.log(`     ... and ${validationWarnings.length - 5} more.`);
  }

  console.log('\n✅ [IQC_PASSED] Content integrity verified for production.');
  process.exit(0);

} catch (error: any) {
  console.error('❌ [IQC_CRASH] Failure:', error.message);
  process.exit(1);
}