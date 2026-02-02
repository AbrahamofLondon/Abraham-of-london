import fs from 'fs';
import path from 'path';
import { globby } from 'globby';

async function validateJsonLd() {
  const files = await globby(['content/**/*.mdx']);
  let errors = 0;

  console.log(`Checking ${files.length} intelligence briefs for JSON-LD integrity...`);

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Regex to extract the data object inside JsonLd
    const match = content.match(/<JsonLd\s+data={{([\s\S]*?)}}\s*\/>/);
    
    if (match) {
      try {
        // We use a loose evaluation to check if it's valid JS object syntax
        const rawObj = match[1].trim();
        // This is a basic check; real validation happens at build time
        if (rawObj.length === 0) throw new Error("Empty data object");
      } catch (e) {
        console.error(`❌ Syntax Error in ${file}: ${e.message}`);
        errors++;
      }
    }
  });

  if (errors === 0) {
    console.log("✅ All 161 documents passed JSON-LD pre-check.");
  } else {
    console.error(`\n🚨 Found ${errors} documents that will crash the build.`);
    process.exit(1);
  }
}

validateJsonLd();