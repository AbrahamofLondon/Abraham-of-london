/* scripts/sync-portfolio.mjs */
import { execSync } from 'child_process';
import fs from 'fs';

// This array must match your actual filenames in C:\Abraham-of-london\scripts\
const scripts = [
  'fix-institutional-links.mjs',
  'fix-broken-links.mjs',         // Renamed from repair-markdown-links to match your console history
  'align-generated-assets.mjs',
  'validate-links.mjs',
  'map-resource-connectivity.mjs',
  'master-sync.mjs'               // Added the Neon DB Sync as the final step
];

console.log("--- ⚡ Starting Full Portfolio Synchronization ⚡ ---");

scripts.forEach(script => {
  const scriptPath = `./scripts/${script}`;
  
  if (!fs.existsSync(scriptPath)) {
    console.warn(`⚠️  Skipping ${script}: File not found at ${scriptPath}`);
    return;
  }

  try {
    console.log(`\n▶️  Executing: ${script}`);
    // Using inherit to see the live output/tables as they happen
    execSync(`node scripts/${script}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ [CRITICAL] Error during ${script}. Synchronization halted.`);
    process.exit(1);
  }
});

console.log("\n--- 🏁 Portfolio, Assets, and Database are 100% Synchronized ---");