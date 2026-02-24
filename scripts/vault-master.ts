/**
 * PHASE 0: SYSTEM-LEVEL INTERCEPTORS
 * Prevents environment crashes and neutralizes server-only constraints.
 */
import Module from 'module';

// @ts-ignore
const originalRequire = Module.prototype.require;
// @ts-ignore
Module.prototype.require = function (id) {
  // 1. Neutralize Next.js 'server-only' package
  if (id === 'server-only') {
    return {}; 
  }

  // 2. Mock Redis - Expanded to catch all possible import variations
  if (id.includes('lib/redis')) {
    return {
      getRedis: () => ({
        on: () => {},
        ping: async () => 'PONG',
        get: async () => null,
        set: async () => 'OK',
        quit: async () => {},
        pipeline: () => ({
           set: () => {},
           exec: async () => []
        })
      }),
      default: {
        getRedis: () => ({ on: () => {}, ping: async () => 'PONG' }),
        isRedisAvailable: async () => true,
        client: { get: async () => null }
      },
      isRedisAvailable: async () => true,
      closeRedis: async () => {},
    };
  }
  return originalRequire.apply(this, arguments);
};

/**
 * PHASE 1: IMPORTS & CORE LOGIC
 */
// @ts-ignore - Local .mjs file
import { verifyDatabaseIntegrity } from './audit-vault.mjs';
import { generatePDF } from '../lib/pdf-generator';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import os from 'os';

interface PDFGenerationResult {
  success: boolean;
  cached?: boolean;
  error?: string;
}

interface VaultStats {
  success: number;
  cached: number;
  failed: number;
  healedLinks: number;
}

interface LinkReconciliation {
  healedContent: string;
  issuesFound: number;
}

/**
 * VAULT MASTER ORCHESTRATOR
 * Handles safe-healing and parallel PDF generation for the portfolio.
 */
async function vaultMaster(): Promise<void> {
  try {
    // 1. Registry Audit
    const activeKeys: string[] = await verifyDatabaseIntegrity();
    
    const stats: VaultStats = { 
      success: 0, 
      cached: 0, 
      failed: 0, 
      healedLinks: 0 
    };
    
    if (!activeKeys || activeKeys.length === 0) {
      console.warn("⚠️  VAULT_MASTER: No briefs found in registry.");
      process.exit(0);
    }

    console.log(`🏛️  VAULT_MASTER: Processing ${activeKeys.length} verified briefs...`);

    // 2. Optimized Parallel Generation
    // We use CPU-1 to leave room for the OS and the PDF engine processes
    const concurrencyLimit = Math.max(1, os.cpus().length - 1);
    
    for (let i = 0; i < activeKeys.length; i += concurrencyLimit) {
      const batch = activeKeys.slice(i, i + concurrencyLimit);
      console.log(`📦 Batch [${i / concurrencyLimit + 1}]: Processing ${batch.length} assets...`);
      
      const batchPromises = batch.map(async (id: string): Promise<PDFGenerationResult> => {
        const mdxPath = path.join(process.cwd(), 'content/briefs', `${id}.mdx`);
        
        if (fs.existsSync(mdxPath)) {
          const fileContent = fs.readFileSync(mdxPath, 'utf8');
          const { content } = matter(fileContent);

          const { healedContent, issuesFound }: LinkReconciliation = reconcileLinks(content, activeKeys);
          stats.healedLinks += issuesFound;

          // Process PDF generation
          return await generatePDF(id, false, healedContent); 
        }
        
        return { success: false, error: `MDX Source Missing at ${mdxPath}` };
      });

      const results = await Promise.all(batchPromises);
      
      results.forEach((r: PDFGenerationResult, index: number) => {
        if (r.cached) {
          stats.cached++;
        } else if (r.success) {
          stats.success++;
        } else {
          stats.failed++;
          console.error(`❌ FAILURE [${batch[index]}]: ${r.error || 'Unknown Error'}`);
        }
      });
    }

    // 3. Health Reporting
    renderHealthReport(stats);

    // 4. Outcome Determination
    if (stats.failed > 0) {
      console.error(`🚨 System fail-safe triggered: ${stats.failed} failures detected.`);
      process.exit(1);
    }

    console.log("✅ VAULT_MASTER: Portfolio synchronization complete.");

  } catch (error: any) {
    console.error("🚨 MASTER_SYNC_CRITICAL_FAILURE:", error.message);
    process.exit(1);
  }
}

/**
 * RECONCILE LINKS
 * Corrects internal references to prevent broken links in the PDF vault.
 */
function reconcileLinks(content: string, activeKeys: string[]): LinkReconciliation {
  const linkRegex = /\[(.*?)\]\((\/briefs\/|#)(.*?)\)/g;
  let issuesFound = 0;
  
  const healedContent = content.replace(linkRegex, (match, text, prefix, targetId) => {
    if (prefix === '/briefs/' && !activeKeys.includes(targetId)) {
      issuesFound++;
      return `[${text} (REF_PENDING: ${targetId})](#)`;
    }
    return match;
  });

  return { healedContent, issuesFound };
}

/**
 * RENDER HEALTH REPORT
 */
function renderHealthReport(stats: VaultStats): void {
  console.log(`
--- 🛡️  VAULT HEALTH REPORT ---
✅ Assets Synchronized: ${stats.success}
♻️  Cache Hits:          ${stats.cached}
🩹  Links Reconciled:    ${stats.healedLinks}
❌ System Failures:      ${stats.failed}
------------------------------
  `);
}

/**
 * TERMINATION HANDLER
 * Explicitly kills the process to prevent the "hang" caused by unclosed 
 * handles in lib/pdf-generator.ts or Redis connections.
 */
vaultMaster()
  .then(() => {
    setTimeout(() => {
      process.exit(0);
    }, 500);
  })
  .catch((err) => {
    console.error("FATAL_VAULT_ERROR:", err);
    process.exit(1);
  });