// scripts/pdf/scanner.ts - PDF CONTENT SCANNER

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Content directories to scan
  CONTENT_DIRS: [
    path.join(process.cwd(), 'content'),
    path.join(process.cwd(), 'lib/content'),
    path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'src/content')
  ],
  
  // PDF directories to scan
  PDF_DIRS: [
    path.join(process.cwd(), 'public/assets/downloads'),
    path.join(process.cwd(), 'public/assets/downloads/enterprise'),
    path.join(process.cwd(), 'public/assets/downloads/premium')
  ],
  
  // File patterns
  PATTERNS: {
    content: ['**/*.md', '**/*.mdx', '**/*.json', '**/*.yml', '**/*.yaml'],
    scripts: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    pdfs: ['**/*.pdf']
  }
};

// ============================================================================
// MAIN SCANNER FUNCTION
// ============================================================================

async function scanForPDFContent() {
  console.log('🔍 PDF CONTENT SCANNER');
  console.log('='.repeat(60));
  
  const results = {
    contentFiles: [] as string[],
    pdfFiles: [] as string[],
    generatorScripts: [] as string[],
    missingPDFs: [] as string[],
    stats: {
      totalContent: 0,
      totalPDFs: 0,
      totalGenerators: 0,
      coverage: 0
    }
  };
  
  // Step 1: Scan for content files
  console.log('\n📚 Scanning for content files...');
  for (const dir of CONFIG.CONTENT_DIRS) {
    if (fs.existsSync(dir)) {
      const files = scanDirectory(dir, CONFIG.PATTERNS.content);
      results.contentFiles.push(...files);
      console.log(`   ${path.relative(process.cwd(), dir)}: ${files.length} files`);
    }
  }
  
  // Step 2: Scan for existing PDFs
  console.log('\n📄 Scanning for existing PDF files...');
  for (const dir of CONFIG.PDF_DIRS) {
    if (fs.existsSync(dir)) {
      const files = scanDirectory(dir, CONFIG.PATTERNS.pdfs);
      results.pdfFiles.push(...files);
      console.log(`   ${path.relative(process.cwd(), dir)}: ${files.length} PDFs`);
    } else {
      console.log(`   ⚠️  Directory not found: ${path.relative(process.cwd(), dir)}`);
    }
  }
  
  // Step 3: Scan for generator scripts
  console.log('\n⚙️  Scanning for generator scripts...');
  const scriptDirs = [
    path.join(process.cwd(), 'scripts'),
    path.join(process.cwd(), 'lib/pdf'),
    path.join(process.cwd(), 'src/lib/pdf')
  ];
  
  for (const dir of scriptDirs) {
    if (fs.existsSync(dir)) {
      const files = scanDirectory(dir, CONFIG.PATTERNS.scripts);
      const generators = files.filter(file => 
        file.includes('generate') || 
        file.includes('pdf') || 
        file.includes('canvas')
      );
      results.generatorScripts.push(...generators);
      console.log(`   ${path.relative(process.cwd(), dir)}: ${generators.length} generators`);
    }
  }
  
  // Step 4: Analyze content for PDF references
  console.log('\n📊 Analyzing content for PDF references...');
  const pdfReferences = await analyzeContentForPDFs(results.contentFiles);
  
  // Step 5: Check for missing PDFs
  results.missingPDFs = await findMissingPDFs(pdfReferences, results.pdfFiles);
  
  // Step 6: Calculate statistics
  results.stats = {
    totalContent: results.contentFiles.length,
    totalPDFs: results.pdfFiles.length,
    totalGenerators: results.generatorScripts.length,
    coverage: results.pdfFiles.length > 0 ? 
      Math.round((results.pdfFiles.length / (pdfReferences.length || 1)) * 100) : 0
  };
  
  // Step 7: Generate report
  await generateReport(results, pdfReferences);
  
  return results;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isDirectory(p: string): boolean {
  try {
    return !!p && fs.existsSync(p) && fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function scanDirectory(dirPath: string, patterns: string[]): string[] {
  
  // Windows-safe: never scandir files (e.g., .pdf).
  if (!isDirectory(dirPath)) return [];
const files: string[] = [];
  
  function walk(currentPath: string) {
    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        
        if (item.isDirectory()) {
          // Skip node_modules and .git
          if (item.name !== 'node_modules' && item.name !== '.git') {
            walk(fullPath);
          }
        } else if (item.isFile()) {
          // Check if file matches any pattern
          const matchesPattern = patterns.some(pattern => {
            // Convert glob pattern to regex
            const regexPattern = pattern
              .replace(/\*\*/g, '.*')
              .replace(/\*/g, '[^/]*')
              .replace(/\?/g, '.');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(item.name);
          });
          
          if (matchesPattern) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
  }
  
  walk(dirPath);
  return files;
}

async function analyzeContentForPDFs(contentFiles: string[]): Promise<Array<{file: string, pdfRefs: string[]}>> {
  const results: Array<{file: string, pdfRefs: string[]}> = [];
  
  for (const file of contentFiles.slice(0, 50)) { // Limit to first 50 files
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const pdfRefs: string[] = [];
      
      // Look for PDF references
      const pdfRegex = /\.pdf/g;
      let match;
      while ((match = pdfRegex.exec(content)) !== null) {
        // Get context around the match
        const start = Math.max(0, match.index - 50);
        const end = Math.min(content.length, match.index + 50);
        const context = content.substring(start, end);
        
        // Extract filename if possible
        const filenameMatch = context.match(/[^/\s]+\.pdf/);
        if (filenameMatch && !pdfRefs.includes(filenameMatch[0])) {
          pdfRefs.push(filenameMatch[0]);
        }
      }
      
      // Look for download references
      const downloadRegex = /download(?:\s*[:=]\s*['"]([^'"]+)['"])/gi;
      while ((match = downloadRegex.exec(content)) !== null) {
        if (match[1] && match[1].includes('.pdf') && !pdfRefs.includes(match[1])) {
          pdfRefs.push(match[1]);
        }
      }
      
      if (pdfRefs.length > 0) {
        results.push({
          file: path.relative(process.cwd(), file),
          pdfRefs
        });
      }
    } catch (error) {
      // Skip files we can't read
    }
  }
  
  return results;
}

async function findMissingPDFs(
  pdfReferences: Array<{file: string, pdfRefs: string[]}>, 
  existingPDFs: string[]
): Promise<string[]> {
  const missing: string[] = [];
  const existingFilenames = existingPDFs.map(p => path.basename(p));
  
  for (const ref of pdfReferences) {
    for (const pdfRef of ref.pdfRefs) {
      const filename = pdfRef.includes('/') ? path.basename(pdfRef) : pdfRef;
      if (!existingFilenames.includes(filename)) {
        if (!missing.includes(filename)) {
          missing.push(filename);
        }
      }
    }
  }
  
  return missing;
}

async function generateReport(
  results: any, 
  pdfReferences: Array<{file: string, pdfRefs: string[]}>
): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SCAN REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📚 Content Files: ${results.contentFiles.length}`);
  console.log(`📄 Existing PDFs: ${results.pdfFiles.length}`);
  console.log(`⚙️  Generator Scripts: ${results.generatorScripts.length}`);
  console.log(`🔍 PDF Coverage: ${results.stats.coverage}%`);
  
  if (results.generatorScripts.length > 0) {
    console.log('\n🔧 Available Generators:');
    results.generatorScripts.forEach((script: string) => {
      console.log(`   📜 ${path.relative(process.cwd(), script)}`);
    });
  }
  
  if (pdfReferences.length > 0) {
    console.log('\n📋 PDF References Found:');
    pdfReferences.forEach(ref => {
      console.log(`   📄 ${ref.file}`);
      ref.pdfRefs.forEach(pdfRef => {
        console.log(`     → ${pdfRef}`);
      });
    });
  }
  
  if (results.missingPDFs.length > 0) {
    console.log('\n⚠️  Missing PDFs (referenced but not found):');
    results.missingPDFs.forEach((pdf: string) => {
      console.log(`   ❌ ${pdf}`);
    });
  }
  
  console.log('\n📁 PDF Directories:');
  CONFIG.PDF_DIRS.forEach(dir => {
    const exists = fs.existsSync(dir);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${path.relative(process.cwd(), dir)}`);
  });
  
  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    stats: results.stats,
    generators: results.generatorScripts.map((s: string) => path.relative(process.cwd(), s)),
    pdfReferences: pdfReferences,
    missingPDFs: results.missingPDFs,
    existingPDFs: results.pdfFiles.map((p: string) => ({
      path: path.relative(process.cwd(), p),
      size: fs.statSync(p).size
    })).slice(0, 10) // First 10 only
  };
  
  const reportPath = path.join(process.cwd(), 'pdf-scan-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 RECOMMENDATIONS:');
  console.log('='.repeat(60));
  
  if (results.missingPDFs.length > 0) {
    console.log('\n1. Generate missing PDFs:');
    console.log('   pnpm run pdfs:generate-missing');
  }
  
  if (results.generatorScripts.length === 0) {
    console.log('\n2. Create PDF generators:');
    console.log('   Create scripts in scripts/pdf/ directory');
  }
  
  if (results.stats.coverage < 50) {
    console.log(`\n3. Improve PDF coverage (currently ${results.stats.coverage}%)`);
    console.log('   Ensure all content references have corresponding PDFs');
  }
  
  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }
  
  try {
    await scanForPDFContent();
  } catch (error: any) {
    console.error('❌ Scan failed:', error.message);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
🔍 PDF Content Scanner

Usage: pnpm run pdfs:scan [options]

Options:
  --help, -h    Show this help message

Description:
  Scans your project for:
  - Content files referencing PDFs
  - Existing PDF files
  - PDF generator scripts
  - Missing PDFs that need generation

Reports:
  - Console summary of findings
  - JSON report: pdf-scan-report.json
  - Recommendations for improvement

Add to package.json:
  {
    "scripts": {
      "pdfs:scan": "tsx scripts/pdf/scanner.ts"
    }
  }
  `);
}

// ============================================================================
// EXECUTION
// ============================================================================

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { scanForPDFContent };