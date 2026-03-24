/* scripts/batch-gen.mjs — NATIVE ESM BATCH ORCHESTRATOR */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generatePDF } from '../lib/pdf-generator.js'; // Ensure the .js extension is here for ESM

async function runInstitutionalBuild() {
  console.log('🚀 AOL VAULT: STARTING NATIVE ESM BUILD');
  console.log('='.repeat(60));
  
  const contentDir = path.resolve(process.cwd(), 'content/downloads');
  const outputDir = path.resolve(process.cwd(), 'public/assets/downloads/content-downloads');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const sourceFiles = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (/\.(mdx|md)$/i.test(entry.name)) {
        sourceFiles.push(fullPath);
      }
    }
  }

  scan(contentDir);
  
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalAssets: sourceFiles.length,
    assets: {},
    stats: { success: 0, failed: 0 }
  };

  let count = 1;
  for (const filePath of sourceFiles) {
    const id = path.basename(filePath, path.extname(filePath));
    process.stdout.write(`[${count}/${sourceFiles.length}] Processing ${id}... `);

    try {
      const result = await generatePDF(id, false);

      if (result.success && result.path) {
        manifest.stats.success++;
        
        const fullPath = path.join(process.cwd(), 'public', result.path.replace(/^\//, ''));
        
        if (fs.existsSync(fullPath)) {
          const buffer = fs.readFileSync(fullPath);
          const hash = crypto.createHash("sha256").update(buffer).digest("hex");

          manifest.assets[id] = {
            path: result.path,
            sha256: hash,
            size: buffer.length,
            verified: true
          };
          console.log(`✅ ${result.cached ? '(Cached)' : '(New)'}`);
        }
      } else {
        throw new Error(result.error || 'Rendering Failed');
      }
    } catch (err) {
      manifest.stats.failed++;
      console.log(`❌ Error: ${err.message}`);
      manifest.assets[id] = { status: 'failed', error: err.message };
    }
    count++;
  }

  const manifestPath = path.join(outputDir, 'vault-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log(`BUILD COMPLETE: ${manifest.stats.success} Success / ${manifest.stats.failed} Failed`);
}

runInstitutionalBuild().catch(console.error);