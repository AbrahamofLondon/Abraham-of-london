/* scripts/mdx-restore-mangled.mjs */
import fs from "fs";
import glob from "fast-glob";

async function repair() {
  const files = await glob(["content/**/*.mdx"]);
  let totalFixed = 0;

  files.forEach(file => {
    const original = fs.readFileSync(file, "utf8");
    
    // This regex targets the exact mangled pattern identified in your logs
    // It looks for the opening brace followed by the "stripped" log message
    const pattern = /\{\/\s*stripped:\s*duplicate\s*fron.*/g;
    
    if (pattern.test(original)) {
      const fixed = original.replace(pattern, "");
      fs.writeFileSync(file, fixed, "utf8");
      console.log(`🛠️ Restored: ${file}`);
      totalFixed++;
    }
  });

  console.log(`\n[RECOVERY] Complete. ${totalFixed} files restored to integrity.`);
}

repair().catch(console.error);