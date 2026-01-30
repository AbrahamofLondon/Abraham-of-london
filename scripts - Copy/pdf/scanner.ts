// scripts/pdf/scanner.ts - RECONCILED INSTITUTIONAL SCANNER
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// RECONCILED CONFIGURATION
// ============================================================================

const CONFIG = {
  // STRATEGIC FIX: Explicitly include institutional subdirectories
  CONTENT_DIRS: [
    path.join(process.cwd(), 'content/downloads'),
    path.join(process.cwd(), 'content/blog'),
    path.join(process.cwd(), 'content/canon'),
    path.join(process.cwd(), 'content/strategy'),
    path.join(process.cwd(), 'content/resources'),
    path.join(process.cwd(), 'content/shorts')
  ],
  
  // STRATEGIC FIX: Map to current institutional PDF architecture
  PDF_DIRS: [
    path.join(process.cwd(), 'public/assets/downloads'),
    path.join(process.cwd(), 'public/assets/downloads/content-downloads'),
    path.join(process.cwd(), 'public/assets/downloads/lib-pdf')
  ],
  
  PATTERNS: {
    content: ['**/*.md', '**/*.mdx'],
    scripts: ['**/*.ts', '**/*.tsx'],
    pdfs: ['**/*.pdf']
  }
};

// ============================================================================
// CORE LOGIC
// ============================================================================

function scanDirectory(dirPath: string, patterns: string[]): string[] {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return [];
  const files: string[] = [];
  
  function walk(currentPath: string) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);
      if (item.isDirectory()) {
        if (!['node_modules', '.git', '.next', '.contentlayer'].includes(item.name)) walk(fullPath);
      } else {
        const ext = path.extname(item.name).toLowerCase();
        if (patterns.some(p => p.includes(ext.replace('.', '')))) {
          files.push(fullPath);
        }
      }
    }
  }
  walk(dirPath);
  return files;
}

async function analyzeContentForPDFs(contentFiles: string[]) {
  const results: any[] = [];
  for (const file of contentFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      // Regex targeting institutional asset paths in frontmatter or body
      const pdfRegex = /[\/]assets[\/]downloads[\/][^"'\s)]+\.pdf/g;
      const matches = content.match(pdfRegex);
      if (matches) {
        results.push({
          file: path.relative(process.cwd(), file),
          pdfRefs: [...new Set(matches.map(m => path.basename(m)))]
        });
      }
    } catch (e) { /* silent fail */ }
  }
  return results;
}

/**
 * STRATEGIC UPGRADE: Named Export
 * This allows scripts/pdf-refresh.ts to import this logic.
 */
export async function scanForPDFContent() {
  console.log('🔍 INSTITUTIONAL ASSET SCANNER');
  console.log('='.repeat(60));
  
  // 1. Scan Manuscripts
  const contentFiles: string[] = [];
  for (const dir of CONFIG.CONTENT_DIRS) {
    const found = scanDirectory(dir, CONFIG.PATTERNS.content);
    contentFiles.push(...found);
    if (found.length > 0) console.log(`   ✅ ${path.relative(process.cwd(), dir)}: ${found.length} files`);
  }

  // 2. Scan Existing PDFs
  const existingPDFs: string[] = [];
  for (const dir of CONFIG.PDF_DIRS) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const found = scanDirectory(dir, CONFIG.PATTERNS.pdfs);
    existingPDFs.push(...found);
    console.log(`   📂 ${path.relative(process.cwd(), dir)}: ${found.length} assets`);
  }

  const pdfReferences = await analyzeContentForPDFs(contentFiles);
  const totalRefs = pdfReferences.reduce((acc, curr) => acc + curr.pdfRefs.length, 0);
  const existingBasenames = existingPDFs.map(p => path.basename(p));
  
  const missing = pdfReferences.flatMap(r => r.pdfRefs).filter(ref => !existingBasenames.includes(ref));

  console.log('='.repeat(60));
  console.log(`📊 TOTALS: Manuscripts: ${contentFiles.length} | References: ${totalRefs} | PDFs: ${existingPDFs.length}`);
  console.log(`🔍 COVERAGE: ${totalRefs > 0 ? Math.round(((totalRefs - missing.length) / totalRefs) * 100) : 0}%`);
  
  if (missing.length > 0) {
    console.log(`⚠️  MISSING ASSETS: ${[...new Set(missing)].length} items need generation.`);
  }

  // Save report as an audit artifact
  const reportPath = path.join(process.cwd(), 'pdf-scan-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ 
    timestamp: new Date().toISOString(), 
    contentFiles: contentFiles.length, 
    pdfs: existingPDFs.length, 
    missing 
  }, null, 2));

  return { contentFiles, existingPDFs, missing };
}

// ============================================================================
// EXECUTION GUARD
// ============================================================================

// Only run automatically if this file is the entry point (e.g. npx tsx scanner.ts)
const isMain = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) || 
  process.argv[1].endsWith('scanner.ts')
);

if (isMain) {
  scanForPDFContent().catch(err => {
    console.error('❌ Scan failed:', err);
    process.exit(1);
  });
}