// scripts/fix-bom-and-frontmatter.mjs
import fs from "fs";
import glob from "fast-glob";

const BOM = "\uFEFF";

async function fixFiles() {
  const files = await glob(["content/**/*.mdx"]);
  let fixed = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    let original = content;
    
    // Remove BOM if present
    if (content.startsWith(BOM)) {
      content = content.slice(1);
      console.log(`✅ Removed BOM from ${file}`);
    }
    
    // Fix frontmatter delimiters
    const lines = content.split('\n');
    let inFrontmatter = false;
    let frontmatterCount = 0;
    let newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (trimmed === '---') {
        if (!inFrontmatter && frontmatterCount === 0) {
          // Start of frontmatter
          inFrontmatter = true;
          frontmatterCount++;
          newLines.push('---');
        } else if (inFrontmatter) {
          // End of frontmatter
          inFrontmatter = false;
          frontmatterCount++;
          newLines.push('---');
          // Add a blank line after frontmatter
          newLines.push('');
        } else {
          // Extra delimiter - convert to horizontal rule
          newLines.push('***');
        }
      } else {
        newLines.push(line);
      }
    }
    
    content = newLines.join('\n');
    
    if (content !== original) {
      fs.writeFileSync(file, content, "utf8");
      fixed++;
    }
  }
  
  console.log(`✅ Fixed ${fixed} files`);
}

fixFiles().catch(console.error);