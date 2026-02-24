import fs from 'fs';
import path from 'path';
// Note: Ensure the import path matches your environment (aliased or relative)
import redis from '../lib/redis.ts';
import { getMemoryStoreSize } from '../lib/inner-circle/keys.server.ts';

/**
 * HYBRID INTELLIGENCE AUDIT
 * Detects, Reconciles, and Heals the Redis Registry based on Disk Source.
 * 🏛️ Optimized for high-volume asset registration.
 */
export async function verifyDatabaseIntegrity() {
  console.log("🛡️ [VAULT_AUDIT]: Initiating intelligent synchronization...");
  
  const client = redis.getRedis();
  const briefsDir = path.join(process.cwd(), 'content/briefs');
  
  // 1. Source Discovery (Disk)
  if (!fs.existsSync(briefsDir)) {
    console.error(`❌ CRITICAL: Briefs directory not found at ${briefsDir}`);
    return [];
  }

  const diskFiles = fs.readdirSync(briefsDir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => file.replace('.mdx', ''));

  // 2. Registry Acquisition (Redis)
  let redisActiveKeys = [];
  try {
    redisActiveKeys = await client.smembers('ic:index:active');
  } catch (e) {
    console.warn("⚠️  Redis registry fetch failed or empty. Initializing recovery protocol.");
  }

  // 3. Automated Intelligence: Identifying Gaps
  const missingInRedis = diskFiles.filter(id => !redisActiveKeys.includes(id));
  const missingOnDisk = redisActiveKeys.filter(id => !diskFiles.includes(id));

  // 4. Intelligent Healing via Pipeline
  // Using a pipeline prevents the "Stream isn't writeable" error by batching I/O
  if (missingInRedis.length > 0 || missingOnDisk.length > 0) {
    const pipeline = client.pipeline();

    if (missingInRedis.length > 0) {
      console.log(`🩹 HEALING: Queueing ${missingInRedis.length} new assets for registration...`);
      // Spread into SADD is safe within a pipeline buffer
      pipeline.sadd('ic:index:active', ...missingInRedis);
    }

    if (missingOnDisk.length > 0) {
      console.log(`🧹 CLEANUP: Queueing ${missingOnDisk.length} orphaned keys for removal...`);
      pipeline.srem('ic:index:active', ...missingOnDisk);
    }

    try {
      await pipeline.exec();
      console.log("✅ HEALING: Pipeline executed successfully.");
    } catch (err) {
      console.error("🚨 HEALING_FAILED: Pipeline execution error:", err.message);
      // Fallback: If pipeline fails, the system will try again on next build.
    }
  } else {
    console.log("⚖️  SYMMETRY: Redis registry matches disk source perfectly.");
  }

  // 5. Final Reconciliation Stats
  let finalRegistry = [];
  try {
    finalRegistry = await client.smembers('ic:index:active');
  } catch (e) {
    finalRegistry = diskFiles; // Fallback to disk if Redis is truly unresponsive
  }

  let memSize = 0;
  try { 
    memSize = await getMemoryStoreSize(); 
  } catch (e) {
    memSize = 0;
  }

  console.log(`
--- 🧬 REGISTRY SYNC COMPLETE ---
📂 Disk Assets:    ${diskFiles.length}
🌐 Redis Active:   ${finalRegistry.length}
🧠 Memory Store:   ${memSize}
---------------------------------
  `);

  return finalRegistry;
}