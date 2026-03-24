import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

const TARGET_DIRS = ['./components', './lib', './pages', './app'];
const LEGACY_IMPORT = /from ["']@\/lib\/access\/tiers["']/g;
const LEGACY_USAGE = /tiers\.(getLabel|normalizeRequired|normalizeUser)/g;

async function scanFiles(dir) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const fileStat = await stat(fullPath);

    if (fileStat.isDirectory() && !fullPath.includes('node_modules')) {
      await scanFiles(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = await readFile(fullPath, 'utf8');
      const hasImport = LEGACY_IMPORT.test(content);
      const hasUsage = LEGACY_USAGE.test(content);

      if (hasImport || hasUsage) {
        console.log(`[!] LEGACY DETECTED: ${fullPath}`);
        if (hasImport) console.log(`    -> Legacy Import Path Found`);
        if (hasUsage) console.log(`    -> Legacy Object Usage (tiers.method) Found`);
      }
    }
  }
}

console.log("--- STARTING SECURITY SCAN: TIER IMPORTS ---");
Promise.all(TARGET_DIRS.map(d => scanFiles(d)))
  .then(() => console.log("--- SCAN COMPLETE: Review the list above ---"))
  .catch(err => console.error("Scan failed:", err));