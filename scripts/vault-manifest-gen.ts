// scripts/vault-manifest-gen.ts
import { generatePDF } from '../lib/pdf-generator';
import { getAllBriefIds } from '../lib/pdf/registry';
import os from 'os';

/**
 * SOVEREIGN BATCH PROCESSOR
 * Scales to hundreds of documents by utilizing all available CPU cores.
 */
async function buildVault() {
  const ids = getAllBriefIds();
  const total = ids.length;
  
  console.log(`🏛️  ABRAHAM OF LONDON: Initiating vault sync for ${total} assets...`);

  // We use a concurrency limit to prevent memory overflow (OOM) 
  // when handling hundreds of heavy PDF renders.
  const concurrencyLimit = os.cpus().length;
  const results = [];
  
  for (let i = 0; i < ids.length; i += concurrencyLimit) {
    const batch = ids.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(id => generatePDF(id));
    
    console.log(`📡 Processing Batch: ${i + 1} - ${Math.min(i + concurrencyLimit, total)}...`);
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const successCount = results.filter(r => r.success).length;
  const cachedCount = results.filter(r => r.cached).length;
  const errorCount = results.filter(r => !r.success).length;

  console.log('--- VAULT SYNC COMPLETE ---');
  console.log(`✅ Success: ${successCount}`);
  console.log(`♻️  Cached:  ${cachedCount}`);
  console.log(`❌ Failed:  ${errorCount}`);

  if (errorCount > 0) {
    console.error("⚠️  Some assets failed to sync. Check logs for details.");
    process.exit(1);
  }
}

buildVault().catch(err => {
  console.error("🚨 Critical System Failure during Vault Sync:", err);
  process.exit(1);
});