/* scripts/mdx-brace-aligner.mjs */
import fs from "fs";
import glob from "fast-glob";

async function alignBraces() {
  const files = await glob(["content/**/*.mdx"]);
  let totalFixed = 0;

  files.forEach(file => {
    const original = fs.readFileSync(file, "utf8");
    const lines = original.split('\n');
    let modified = false;

    // We target lines that are just a stray brace or malformed debug residue
    const sanitizedLines = lines.filter(line => {
      const trimmed = line.trim();
      
      // 1. Remove lines that are ONLY a single opening or closing brace
      // (Common residue from deleted "stripped" messages)
      if (trimmed === "{" || trimmed === "}") {
        modified = true;
        return false;
      }

      // 2. Remove any surviving fragment of the mangling code
      if (trimmed.includes("stripped:") || trimmed.includes("duplicate fron")) {
        modified = true;
        return false;
      }

      return true;
    });

    if (modified) {
      fs.writeFileSync(file, sanitizedLines.join('\n'), "utf8");
      console.log(`🎯 Aligned: ${file}`);
      totalFixed++;
    }
  });

  console.log(`\n[ALIGNMENT] Complete. ${totalFixed} assets balanced.`);
}

alignBraces().catch(console.error);