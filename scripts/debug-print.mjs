// scripts/debug-print.mjs
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🔍 Debugging print utils with TypeScript...\n");

// Use tsx to run TypeScript directly
const result = spawn(
  "npx",
  [
    "tsx",
    "-e",
    `
  try {
    const printUtils = require('../lib/server/print-utils.ts');
    
    console.log('✅ Import successful');
    console.log('Available exports:', Object.keys(printUtils));
    
    // Test getPrintSlugs
    const slugs = printUtils.getPrintSlugs();
    console.log('\\\\ngetPrintSlugs():');
    console.log('  Return type:', typeof slugs);
    console.log('  Is array:', Array.isArray(slugs));
    console.log('  Length:', slugs?.length || 0);
    
    if (Array.isArray(slugs) && slugs.length > 0) {
      console.log('  First item:', slugs[0]);
      console.log('  First item type:', typeof slugs[0]);
      
      // Check if all items are strings
      const allStrings = slugs.every(item => typeof item === 'string');
      console.log('  All items are strings:', allStrings);
      
      if (!allStrings) {
        console.log('  ❌ PROBLEM: Some items are not strings');
        slugs.forEach((item, index) => {
          if (typeof item !== 'string') {
            console.log(\\\`    Index \\\\${index}:\\\`, item, \\\`(type: \\\\${typeof item})\\\`);
          }
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
  }
`,
  ],
  {
    stdio: "inherit",
    shell: true,
  }
);
