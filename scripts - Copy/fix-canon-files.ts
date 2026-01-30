// scripts/fix-canon-files.js
// Run with: node scripts/fix-canon-files.js

const fs = require("fs");
const path = require("path");

const CANON_DIR = path.join(process.cwd(), "content", "canon");

// Files to process
const canonFiles = [
  "canon-campaign.mdx",
  "canon-introduction-letter.mdx",
  "canon-master-index-preview.mdx",
  "the-builders-catechism.mdx",
  "builders-catechism.mdx", // in case it's named this
  "volume-x-the-arc-of-future-civilisation.mdx",
];

function fixCanonFile(filename) {
  const filePath = path.join(CANON_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${filename} (doesn't exist)`);
    return;
  }

  console.log(`\n🔧 Processing ${filename}...`);

  let content = fs.readFileSync(filePath, "utf-8");
  let changed = false;

  // 1. Remove type: "canon-volume" from frontmatter
  if (content.includes('type: "canon-volume"')) {
    content = content.replace(/^\s*type:\s*["']canon-volume["']\s*$/gm, "");
    console.log('   ✅ Removed type: "canon-volume"');
    changed = true;
  }

  // 2. Remove all import statements
  const importRegex = /^import\s+.*?from\s+["'].*?["'];?\s*$/gm;
  const importMatches = content.match(importRegex);
  if (importMatches && importMatches.length > 0) {
    content = content.replace(importRegex, "");
    console.log(`   ✅ Removed ${importMatches.length} import statement(s)`);
    changed = true;
  }

  // 3. Ensure draft: false exists in frontmatter
  const hasDraftField = /^\s*draft:\s*(true|false)\s*$/gm.test(content);
  if (!hasDraftField) {
    // Add draft: false after the last field before ---
    content = content.replace(/^(---[\s\S]*?)(\n---)/m, "$1\ndraft: false$2");
    console.log("   ✅ Added draft: false");
    changed = true;
  }

  // 4. Replace <Divider with <Rule
  if (content.includes("<Divider")) {
    content = content.replace(/<Divider([^>]*)>/g, "<Rule$1>");
    content = content.replace(/<\/Divider>/g, "</Rule>");
    console.log("   ✅ Replaced <Divider> with <Rule>");
    changed = true;
  }

  // 5. Clean up multiple blank lines
  content = content.replace(/\n\n\n+/g, "\n\n");

  if (changed) {
    // Backup original
    const backupPath = filePath + ".backup";
    fs.writeFileSync(backupPath, fs.readFileSync(filePath));
    console.log(`   💾 Backup saved: ${filename}.backup`);

    // Write fixed content
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`   ✨ Fixed and saved!`);
  } else {
    console.log("   ℹ️  No changes needed");
  }
}

// Check for missing frontmatter titles
function checkTitles() {
  console.log("\n📋 Checking for missing titles...\n");

  canonFiles.forEach((filename) => {
    const filePath = path.join(CANON_DIR, filename);

    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const titleMatch = content.match(/^title:\s*["'](.+?)["']/m);

    if (!titleMatch) {
      console.log(`❌ ${filename} - MISSING TITLE!`);
    } else {
      console.log(`✅ ${filename} - "${titleMatch[1]}"`);
    }
  });
}

// Main execution
console.log("🚀 Auto-fixing Canon MDX files...");
console.log("==================================\n");

canonFiles.forEach(fixCanonFile);

checkTitles();

console.log("\n==================================");
console.log("✨ Done! Check the output above.");
console.log("\nNext steps:");
console.log("1. Review the changes");
console.log("2. Delete .backup files if satisfied");
console.log("3. Run: rm -rf .contentlayer");
console.log("4. Run: pnpm run build:netlify");
console.log("==================================\n");

