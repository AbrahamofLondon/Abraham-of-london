import fs from 'fs';
import path from 'path';
import redis from '../lib/redis.ts';
import { getMemoryStoreSize } from '../lib/inner-circle/keys.server.ts';

/**
 * HYBRID INTELLIGENCE AUDIT
 * Detects, Reconciles, and Heals the Redis Registry based on Disk Source.
 */
export async function verifyDatabaseIntegrity() {
  console.log("🛡️ [VAULT_AUDIT]: Initiating intelligent synchronization...");
  
  const client = redis.getRedis();
  const briefsDir = path.join(process.cwd(), 'content/briefs');
  
  // 1. Source Discovery (Disk)
  const diskFiles = fs.readdirSync(briefsDir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => file.replace('.mdx', ''));

  // 2. Registry Acquisition (Redis)
  let redisActiveKeys = [];
  try {
    redisActiveKeys = await client.smembers('ic:index:active');
  } catch (e) {
    console.warn("⚠️  Redis registry fetch failed. Initializing recovery.");
  }

  // 3. Automated Intelligence: Identifying Gaps
  const missingInRedis = diskFiles.filter(id => !redisActiveKeys.includes(id));
  const missingOnDisk = redisActiveKeys.filter(id => !diskFiles.includes(id));

  // 4. Intelligent Healing
  if (missingInRedis.length > 0) {
    console.log(`🩹 HEALING: Registering ${missingInRedis.length} new assets in Redis...`);
    // SADD (Set Add) ensures no duplicates even if run multiple times
    await client.sadd('ic:index:active', ...missingInRedis);
  }

  if (missingOnDisk.length > 0) {
    console.log(`🧹 CLEANUP: Removing ${missingOnDisk.length} orphaned keys from Redis...`);
    await client.srem('ic:index:active', ...missingOnDisk);
  }

  // 5. Final Reconciliation Stats
  const finalRegistry = await client.smembers('ic:index:active');
  let memSize = 0;
  try { memSize = await getMemoryStoreSize(); } catch (e) {}

  console.log(`
--- 🧬 REGISTRY SYNC COMPLETE ---
📂 Disk Assets:    ${diskFiles.length}
🌐 Redis Active:   ${finalRegistry.length}
🧠 Memory Store:   ${memSize}
---------------------------------
  `);

  return finalRegistry;
}