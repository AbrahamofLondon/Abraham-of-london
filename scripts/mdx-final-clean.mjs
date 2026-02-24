/* scripts/mdx-final-clean.mjs */
import fs from "fs";
import glob from "fast-glob";

async function finalClean() {
  const files = await glob(["content/**/*.mdx"]);
  let totalFixed = 0;

  files.forEach(file => {
    const original = fs.readFileSync(file, "utf8");
    const lines = original.split('\n');
    
    // Filter out any line that contains the "stripped:" or "duplicate fron" markers
    // regardless of whether they have { or }
    const filteredLines = lines.filter(line => {
      const isMangled = line.includes("stripped:") || 
                        line.includes("duplicate fron") || 
                        line.includes("{/ stripped");
      return !isMangled;
    });

    if (lines.length !== filteredLines.length) {
      fs.writeFileSync(file, filteredLines.join('\n'), "utf8");
      console.log(`✨ Sanitized: ${file}`);
      totalFixed++;
    }
  });

  console.log(`\n[CLEANUP] Complete. ${totalFixed} assets fully sanitized.`);
}

finalClean().catch(console.error);