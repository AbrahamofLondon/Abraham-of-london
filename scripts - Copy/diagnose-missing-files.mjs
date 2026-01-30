// scripts/diagnose-missing-files.mjs
// Quick diagnostic to find exactly which file is missing
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🔍 Diagnosing Missing Files\n");
console.log("=" .repeat(60));

// Check if content directory exists
const contentDir = path.join(rootDir, "content", "downloads");
console.log(`\n📁 Content Directory: ${contentDir}`);
console.log(`   Exists: ${fs.existsSync(contentDir) ? "✅" : "❌"}`);

if (fs.existsSync(contentDir)) {
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  console.log(`   Files found: ${files.length}`);
  
  console.log("\n📄 Checking each download file:\n");
  
  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    
    // Extract frontmatter
    const fmMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
    if (!fmMatch) {
      console.log(`⚠️  ${file}: No frontmatter found`);
      continue;
    }
    
    const fm = fmMatch[1];
    
    // Look for PDF references
    const pdfPathMatch = fm.match(/pdfPath:\s*["']?([^"'\n]+)["']?/);
    const downloadFileMatch = fm.match(/downloadFile:\s*["']?([^"'\n]+)["']?/);
    const fileMatch = fm.match(/^file:\s*["']?([^"'\n]+)["']?/m);
    
    const pdfRef = pdfPathMatch?.[1]?.trim() || 
                   downloadFileMatch?.[1]?.trim() || 
                   fileMatch?.[1]?.trim();
    
    if (!pdfRef) {
      console.log(`ℹ️  ${file}: No PDF reference`);
      continue;
    }
    
    // Check if it's a remote URL
    if (pdfRef.startsWith('http://') || pdfRef.startsWith('https://')) {
      console.log(`🌐 ${file}: Remote URL - ${pdfRef}`);
      continue;
    }
    
    // Build possible paths
    const basename = path.basename(pdfRef);
    const possiblePaths = [
      path.join(rootDir, "public", pdfRef.replace(/^\//, "")),
      path.join(rootDir, "public", "assets", "downloads", basename),
      path.join(rootDir, "public", "downloads", basename),
    ];
    
    let found = false;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        console.log(`✅ ${file}: ${pdfRef}`);
        console.log(`   Found at: ${p.replace(rootDir, '.')}`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`❌ ${file}: ${pdfRef}`);
      console.log(`   Expected at one of:`);
      possiblePaths.forEach(p => console.log(`   • ${p.replace(rootDir, '.')}`));
    }
    
    console.log();
  }
}

// Check what's actually in public/assets/downloads/
const downloadsDir = path.join(rootDir, "public", "assets", "downloads");
console.log("\n" + "=".repeat(60));
console.log(`\n📦 Files in public/assets/downloads/:\n`);

if (fs.existsSync(downloadsDir)) {
  const files = fs.readdirSync(downloadsDir);
  if (files.length === 0) {
    console.log("   (empty directory)");
  } else {
    files.forEach(f => {
      const stat = fs.statSync(path.join(downloadsDir, f));
      const size = (stat.size / 1024).toFixed(1);
      console.log(`   • ${f} (${size} KB)`);
    });
  }
} else {
  console.log("   ❌ Directory does not exist!");
}

// Check .gitignore for PDF ignores
console.log("\n" + "=".repeat(60));
console.log("\n🔒 Checking .gitignore for PDF patterns:\n");

const gitignorePath = path.join(rootDir, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
  const pdfPatterns = gitignoreContent
    .split("\n")
    .filter(line => line.includes(".pdf") && !line.trim().startsWith("#"))
    .filter(Boolean);
  
  if (pdfPatterns.length === 0) {
    console.log("   ✅ No PDF ignore patterns found");
  } else {
    console.log("   ⚠️  Found PDF ignore patterns:");
    pdfPatterns.forEach(p => console.log(`   • ${p}`));
  }
}

console.log("\n" + "=".repeat(60));
console.log("\n✅ Diagnosis complete\n");