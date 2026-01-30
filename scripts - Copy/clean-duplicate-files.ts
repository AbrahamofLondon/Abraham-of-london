import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanDuplicates() {
  console.log('🧹 Auditing institutional scripts for redundancy...\n');
  
  const scriptsDir = path.resolve(__dirname, '..'); // Adjusted for tsx execution context
  const files = fs.readdirSync(scriptsDir);
  let deletedCount = 0;

  const toDelete: string[] = [];

  for (const file of files) {
    const fullPath = path.join(scriptsDir, file);
    if (fs.lstatSync(fullPath).isDirectory()) continue;

    const ext = path.extname(file);
    const baseName = path.basename(file, ext);

    // Rule 1: .tsx suppresses .ts and .js
    if (files.includes(`${baseName}.tsx`)) {
      if (ext === '.ts' || ext === '.js' || ext === '.mjs') {
        toDelete.push(file);
      }
    } 
    // Rule 2: .ts suppresses .js and .mjs
    else if (files.includes(`${baseName}.ts`)) {
      if (ext === '.js' || ext === '.mjs') {
        toDelete.push(file);
      }
    }
  }

  // Deduplicate and remove
  [...new Set(toDelete)].forEach(file => {
    const filePath = path.join(scriptsDir, file);
    console.log(`  🗑️ Removing Redundant Asset: ${file}`);
    fs.unlinkSync(filePath);
    deletedCount++;
  });

  console.log(`\n✅ Institutional Cleanup Complete: ${deletedCount} files removed.`);
}

cleanDuplicates().catch(console.error);