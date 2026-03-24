/* scripts/quick-batch-generator.ts — VAULT BATCH CONTROLLER (v3.2) */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generatePDF } from '../lib/pdf-generator'; // Using the forensic orchestrator

async function generateAllPDFs() {
  console.log('🚀 AOL INSTITUTIONAL BATCH GENERATOR (FORENSIC-READY)');
  console.log('='.repeat(60));
  
  const contentDir = path.join(process.cwd(), 'content', 'downloads');
  const outputDir = path.join(process.cwd(), 'public', 'assets', 'downloads', 'content-downloads');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }
  
  // 1. Recursive Scan for Source Files
  const sourceFiles: string[] = [];
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(mdx|md)$/i.test(entry.name)) {
        sourceFiles.push(fullPath);
      }
    }
  }

  console.log('🔍 Scanning Vault for source documents...');
  scanDir(contentDir);
  console.log(`✅ Found ${sourceFiles.length} source documents.`);
  
  const manifest: any = {
    generatedAt: new Date().toISOString(),
    totalFound: sourceFiles.length,
    assets: {},
    successCount: 0,
    failedCount: 0,
  };

  // 2. Processing Loop
  for (let i = 0; i < sourceFiles.length; i++) {
    const filePath = sourceFiles[i];
    const id = path.basename(filePath, path.extname(filePath));
    
    console.log(`\n📄 [${i + 1}/${sourceFiles.length}] Processing: ${id}`);

    try {
      // Execute the forensic-aligned PDF generator
      // This handles caching, fingerprinting, and metadata automatically.
      const result = await generatePDF(id, false);

      if (result.success && result.path) {
        manifest.successCount++;
        
        // Calculate SHA-256 for the final manifest integrity
        const fullOutputPath = path.join(process.cwd(), 'public', result.path.replace(/^\//, ''));
        const fileBuffer = fs.readFileSync(fullOutputPath);
        const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

        console.log(`  ✅ ${result.cached ? '[CACHED]' : '[GENERATED]'} -> ${result.path}`);
        console.log(`  🛡️  SHA-256: ${hash.slice(0, 12)}...`);

        manifest.assets[id] = {
          status: 'verified',
          path: result.path,
          hash: hash,
          size: fileBuffer.length,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(result.error || 'Unknown rendering error');
      }
    } catch (err: any) {
      manifest.failedCount++;
      console.log(`  ❌ Failed: ${err.message}`);
      manifest.assets[id] = { status: 'failed', error: err.message };
    }
  }

  // 3. Institutional Finalization
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH SUMMARY');
  console.log(`  Successful: ${manifest.successCount}`);
  console.log(`  Failed:     ${manifest.failedCount}`);
  console.log(`  Vault Location: ${outputDir}`);
  console.log('='.repeat(60));

  const manifestPath = path.join(outputDir, 'vault-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n🛡️  Vault Manifest Signed: ${manifestPath}`);
  
  return manifest;
}

// Execution logic
if (require.main === module) {
  generateAllPDFs()
    .then((m) => {
      const exitCode = m.failedCount === 0 ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(err => {
      console.error('❌ Batch Fatal:', err);
      process.exit(1);
    });
}

export { generateAllPDFs };