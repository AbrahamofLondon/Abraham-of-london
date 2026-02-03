// scripts/ci-master-build.mjs — INSTITUTIONAL BUILD ORCHESTRATOR
import { execSync } from 'child_process';
import os from 'os';

/**
 * STRATEGY: MEMORY SEGMENTATION
 * We execute each phase as a separate process to ensure the Node.js Garbage Collector 
 * clears the heap between the repair, content generation, and Next.js build phases.
 */

const log = (stage, msg) => console.log(`\n[${stage.padEnd(15)}] ${msg}`);
const getMem = () => (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);

try {
  log('SYSTEM_CHECK', `Free Memory: ${getMem()} GB`);
  execSync('pnpm health', { stdio: 'inherit' });

  // PHASE 1: SELF-HEALING (Low Memory)
  log('VAULT_REPAIR', 'Executing surgical content healing...');
  execSync('pnpm vault:fix', { stdio: 'inherit' });

  // PHASE 2: CONTENT ARCHITECTURE (Medium Memory)
  log('CONTENT_GEN', 'Compiling Contentlayer Registry...');
  // We use --max-old-space-size to prevent heap overflow during MDX parsing
  execSync('cross-env NODE_OPTIONS="--max-old-space-size=2048" pnpm contentlayer:build', { stdio: 'inherit' });

  // PHASE 3: FINAL AUDIT (Low Memory)
  log('VAULT_AUDIT', 'Verifying integrity and link structures...');
  execSync('pnpm vault:check', { stdio: 'inherit' });

  // PHASE 4: PRODUCTION BUILD (High Memory)
  log('NEXT_BUILD', `Final compile initiating. Remaining RAM: ${getMem()} GB`);
  // Next.js gets the bulk of the 4GB limit here
  execSync('cross-env NODE_OPTIONS="--max-old-space-size=3584" next build', { stdio: 'inherit' });

  log('SUCCESS', 'Abraham of London: Portfolio successfully deployed.');
  
} catch (error) {
  console.error(`\n🚨 [BUILD_CRASH] Phase failed. Context: ${error.message}`);
  process.exit(1);
}