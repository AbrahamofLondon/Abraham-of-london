// scripts/fix-unescaped-entities-safe.ts
import fs from "fs";
import path from "path";

const targets = [
  "pages/auth/signin.tsx",
  "pages/books/the-architecture-of-human-purpose-landing.tsx",
  "pages/brands/index.tsx",
  "pages/contact.tsx",
  "pages/events/index.tsx",
  "pages/subscribe.tsx",
  "components/admin/ShortsAnalytics.tsx",
  "components/mdx/Quote.tsx",
  "components/homepage/AboutSection.tsx",
];

/**
 * Only touch likely JSX text nodes: between > ... <
 * This avoids import strings, object keys, etc.
 */
function fixInJsxText(input: string): string {
  return input.replace(/>([^<]+)</g, (match: string, text: string) => {
    const fixed = text
      // straight double quotes in text → smart quotes
      .replace(/"([^"]*)"/g, '"$1"')
      // apostrophes in common contractions/possessives → curly apostrophe
      .replace(/(\w)'(\w)/g, "$1'$2");
    return `>${fixed}<`;
  });
}

async function main(): Promise<void> {
  let changed = 0;
  const skipped: string[] = [];

  for (const target of targets) {
    const filePath = path.resolve(process.cwd(), target);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping (not found): ${target}`);
      skipped.push(target);
      continue;
    }

    try {
      const original = fs.readFileSync(filePath, "utf8");
      const next = fixInJsxText(original);

      if (next !== original) {
        // Create backup before modifying
        const backupPath = `${filePath}.bak-${Date.now()}`;
        fs.writeFileSync(backupPath, original, "utf8");
        
        // Write the fixed content
        fs.writeFileSync(filePath, next, "utf8");
        
        console.log(`✅ Patched: ${target} (backup: ${path.basename(backupPath)})`);
        changed++;
      } else {
        console.log(`⏭️  No change needed: ${target}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${target}:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Changed: ${changed} file${changed !== 1 ? 's' : ''}`);
  console.log(`   Skipped: ${skipped.length} file${skipped.length !== 1 ? 's' : ''}`);
  
  if (skipped.length > 0) {
    console.log(`   Missing files: ${skipped.join(', ')}`);
  }
  
  console.log(`\n✅ Done.`);
}

// Run only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { fixInJsxText, targets };