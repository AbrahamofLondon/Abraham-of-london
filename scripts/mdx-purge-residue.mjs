/* scripts/mdx-purge-residue.mjs */
import fs from "fs";
import glob from "fast-glob";

const files = await glob(["content/**/*.mdx"]);

files.forEach(file => {
  let s = fs.readFileSync(file, "utf8");
  
  // This regex finds a '{' or '}' that is preceded or followed by 
  // the specific phrases that indicate a failed script "strip" operation.
  const badPatterns = [
    /\{\/ stripped: duplicate frontmatter/g,
    /\{ \/ stripped: duplicate frontmatter/g,
    /\{ \/ stripped/g,
    /\{/g, // We will use this cautiously below
    /\}/g
  ];

  // If the file is one of the 10 known broken files, we remove all stray braces
  // that are NOT part of a valid JSX tag.
  if (file.includes('when-every-promotion') || 
      file.includes('when-you-argue-with-god') ||
      file.includes('when-you-cant-tell') ||
      file.includes('when-youre-addicted') ||
      file.includes('when-youre-scared')) {
    
    // Remove the specific lonely braces that are breaking your build
    const fixed = s.replace(/\{(\s*\/)?\s*stripped:.*?\}/g, "") // Clean the whole tag if it exists
                   .replace(/(?<!<[^>]*)\{/g, "")               // Remove lonely {
                   .replace(/(?<!<[^>]*)\}/g, "");              // Remove lonely }
                   
    fs.writeFileSync(file, fixed, "utf8");
    console.log(`🧽 Purged: ${file}`);
  }
});