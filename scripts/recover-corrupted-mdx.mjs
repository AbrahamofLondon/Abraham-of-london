// scripts/recover-corrupted-mdx.mjs
import fs from "fs";
import path from "path";
import glob from "fast-glob";

async function recover() {
  const files = await glob(["content/**/*.mdx"]);
  
  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    
    // Fix 1: Convert *** back to --- if they're likely frontmatter delimiters
    const lines = content.split('\n');
    let inPotentialFrontmatter = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "***") {
        // Check if this looks like it should be a frontmatter delimiter
        const nextLine = lines[i + 1]?.trim() || "";
        const prevLine = lines[i - 1]?.trim() || "";
        
        // If next line looks like YAML or prev line was blank, it's probably frontmatter
        if (/^[a-z]+:/.test(nextLine) || prevLine === "") {
          lines[i] = "---";
        }
      }
    }
    
    const fixed = lines.join('\n');
    if (fixed !== content) {
      fs.writeFileSync(file, fixed, "utf8");
      console.log(`✅ Recovered: ${file}`);
    }
  }
}

recover();