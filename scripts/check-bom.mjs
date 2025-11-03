// scripts/check-bom.mjs (ESM utility to check for BOM and valid JSON)
import fs from "node:fs";
import path from "node:path";

// List of files to check (add more files if needed, e.g., 'next.config.js')
const files = ["package.json"]; 
let bad = 0;
const ROOT = process.cwd();

console.log(`[check-bom] Checking files for UTF-8 BOM... (Root: ${ROOT})`);

for (const f of files) {
  const fullPath = path.join(ROOT, f);
  if (!fs.existsSync(fullPath)) {
    console.warn(`? ${f}: file not found. Skipping.`);
    continue;
  }
  
  try {
    const buf = fs.readFileSync(fullPath);
    
    // Check for UTF-8 BOM: EF BB BF
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      console.error(`✖ ${f}: has UTF-8 BOM (Byte Order Mark). This should be removed!`);
      bad++;
      continue;
    }

    // Check if content is valid JSON (only for files like package.json)
    if (f.toLowerCase().endsWith(".json")) {
      JSON.parse(buf.toString("utf8"));
    }
  }
  catch (e) { 
    console.error(`✖ ${f}: invalid JSON or read error → ${e.message}`); 
    bad++; 
  }
}

if (bad) {
  console.error(`\n[check-bom] FAILED: Found ${bad} file error(s).`);
  process.exit(1);
} else {
  console.log(`\n[check-bom] SUCCESS: All ${files.length} files are clean.`);
}
