// scripts/migrate-downloads-paths.mjs
// Migrates all content references from /downloads/ to /assets/downloads/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");

console.log("═══════════════════════════════════════════════════════");
console.log("  Download Path Migration Tool");
console.log("═══════════════════════════════════════════════════════");
console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE (will modify files)"}\n`);

// Patterns to find and replace
const PATTERNS = [
  {
    name: "pdfPath",
    find: /pdfPath:\s*["']?\/downloads\//g,
    replace: 'pdfPath: "/assets/downloads/',
  },
  {
    name: "downloadFile",
    find: /downloadFile:\s*["']?\/downloads\//g,
    replace: 'downloadFile: "/assets/downloads/',
  },
  {
    name: "file",
    find: /^file:\s*["']?\/downloads\//gm,
    replace: 'file: "/assets/downloads/',
  },
  {
    name: "fileUrl",
    find: /fileUrl:\s*["']?\/downloads\//g,
    replace: 'fileUrl: "/assets/downloads/',
  },
  {
    name: "downloadUrl",
    find: /downloadUrl:\s*["']?\/downloads\//g,
    replace: 'downloadUrl: "/assets/downloads/',
  },
  // Also catch bare /downloads/ references
  {
    name: "bare path",
    find: /["']\/downloads\/([^"'\s]+)["']/g,
    replace: '"/assets/downloads/$1"',
  },
];

// Directories to scan
const CONTENT_DIRS = [
  path.join(rootDir, "content", "downloads"),
  path.join(rootDir, "content", "resources"),
  path.join(rootDir, "content", "books"),
  path.join(rootDir, "content", "canon"),
];

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

function processFile(filePath) {
  if (!filePath.endsWith(".md") && !filePath.endsWith(".mdx")) {
    return;
  }

  totalFiles++;
  
  const originalContent = fs.readFileSync(filePath, "utf8");
  let newContent = originalContent;
  let fileModified = false;
  const replacements = [];

  // Apply all patterns
  for (const pattern of PATTERNS) {
    const matches = originalContent.match(pattern.find);
    if (matches) {
      newContent = newContent.replace(pattern.find, pattern.replace);
      replacements.push({
        pattern: pattern.name,
        count: matches.length,
      });
      fileModified = true;
    }
  }

  if (fileModified) {
    modifiedFiles++;
    const relativePath = path.relative(rootDir, filePath);
    
    console.log(`\n📝 ${relativePath}`);
    replacements.forEach((r) => {
      console.log(`   • ${r.pattern}: ${r.count} replacement(s)`);
      totalReplacements += r.count;
    });

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, newContent, "utf8");
      console.log("   ✅ Updated");
    } else {
      console.log("   🔍 Would update (dry run)");
    }

    // Show a sample of changes
    if (DRY_RUN) {
      const lines = originalContent.split("\n");
      const changedLines = lines
        .map((line, idx) => ({ line, idx: idx + 1 }))
        .filter(({ line }) => /\/downloads\//.test(line));
      
      if (changedLines.length > 0) {
        console.log("   Preview:");
        changedLines.slice(0, 3).forEach(({ line, idx }) => {
          console.log(`     Line ${idx}: ${line.trim()}`);
        });
      }
    }
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

// Check for duplicate files
console.log("Checking for duplicate files...\n");

const oldDir = path.join(rootDir, "public", "downloads");
const newDir = path.join(rootDir, "public", "assets", "downloads");

if (fs.existsSync(oldDir) && fs.existsSync(newDir)) {
  const oldFiles = fs.readdirSync(oldDir);
  const newFiles = fs.readdirSync(newDir);
  
  console.log(`📁 public/downloads/: ${oldFiles.length} file(s)`);
  console.log(`📁 public/assets/downloads/: ${newFiles.length} file(s)\n`);

  const duplicates = oldFiles.filter((f) => newFiles.includes(f));
  
  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate file(s):`);
    duplicates.forEach((f) => console.log(`  • ${f}`));
    console.log();
  }
}

// Scan and process content files
console.log("Scanning content files...\n");

for (const dir of CONTENT_DIRS) {
  scanDirectory(dir);
}

// Summary
console.log("\n═══════════════════════════════════════════════════════");
console.log("SUMMARY");
console.log("═══════════════════════════════════════════════════════");
console.log(`Files scanned:    ${totalFiles}`);
console.log(`Files modified:   ${modifiedFiles}`);
console.log(`Total changes:    ${totalReplacements}`);

if (DRY_RUN) {
  console.log("\n⚠️  DRY RUN MODE - No files were actually changed");
  console.log("Run without --dry-run to apply changes:");
  console.log("  node scripts/migrate-downloads-paths.mjs");
} else {
  console.log("\n✅ Migration complete!");
  
  // Suggest cleanup
  if (fs.existsSync(oldDir)) {
    console.log("\n📋 Next steps:");
    console.log("  1. Test your site: pnpm dev");
    console.log("  2. Verify downloads work");
    console.log("  3. Remove old directory:");
    console.log(`     Remove-Item "${oldDir.replace(rootDir, ".")}" -Recurse -Force`);
  }
}

console.log("═══════════════════════════════════════════════════════\n");