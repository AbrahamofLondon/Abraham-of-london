import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();

// Thresholds for alerts
const SIZE_THRESHOLD_MB = 5; 
const PATH_LENGTH_THRESHOLD = 200; // Windows safety margin

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}🔍 Starting Abraham of London Asset Audit...${RESET}\n`);

const auditResults = {
  largeFiles: [],
  deepPaths: [],
  redundantOptimized: 0,
  totalSize: 0
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(ROOT, filePath);

    // Skip git and node_modules
    if (relativePath.includes('.git') || relativePath.includes('node_modules')) return;

    if (stats.isDirectory()) {
      walk(filePath);
    } else {
      auditResults.totalSize += stats.size;

      // 1. Check File Size
      if (stats.size > SIZE_THRESHOLD_MB * 1024 * 1024) {
        auditResults.largeFiles.push({ path: relativePath, size: stats.size });
      }

      // 2. Check Path Length (Critical for Windows)
      if (filePath.length > PATH_LENGTH_THRESHOLD) {
        auditResults.deepPaths.push(relativePath);
      }

      // 3. Check for redundant optimized assets in the wrong place
      if (relativePath.startsWith('public') && (file.endsWith('.avif') || file.endsWith('.webp'))) {
        if (!relativePath.includes('optimized-images')) {
          auditResults.redundantOptimized++;
        }
      }
    }
  });
}

try {
  walk(ROOT);

  console.log(`📊 ${GREEN}Audit Summary:${RESET}`);
  console.log(`- Total Project Size (excl. modules): ${formatBytes(auditResults.totalSize)}`);
  
  if (auditResults.largeFiles.length > 0) {
    console.log(`\n${RED}⚠️  Large Files Detected (> ${SIZE_THRESHOLD_MB}MB):${RESET}`);
    auditResults.largeFiles.sort((a,b) => b.size - a.size).forEach(f => {
      console.log(`  [${formatBytes(f.size)}] ${f.path}`);
    });
  }

  if (auditResults.deepPaths.length > 0) {
    console.log(`\n${RED}⚠️  Dangerous Path Lengths (Windows Risk):${RESET}`);
    auditResults.deepPaths.forEach(p => console.log(`  [Length: ${p.length}] ${p}`));
  }

  if (auditResults.redundantOptimized > 0) {
    console.log(`\n${YELLOW}💡 Found ${auditResults.redundantOptimized} optimized assets outside the 'optimized-images' folder.${RESET}`);
    console.log(`   Consider moving these to keep the public root clean.`);
  }

  console.log(`\n${GREEN}✅ Audit Complete.${RESET}`);

} catch (err) {
  console.error('Audit failed:', err);
}