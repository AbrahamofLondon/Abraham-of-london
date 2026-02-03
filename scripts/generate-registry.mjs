/* scripts/generate-registry.mjs — HIGH-PERFORMANCE CONTENT ARCHITECTURE */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const AUDIT_LOG_PATH = path.join(process.cwd(), 'public/system/intel-audit-log.json');
const REGISTRY_OUTPUT = path.join(process.cwd(), 'public/system/content-registry.json');

function generateRegistry() {
  console.log('🏗️  [REGISTRY] Constructing Master Content Map...');

  if (!existsSync(AUDIT_LOG_PATH)) {
    console.error('❌ Audit log missing. Run generate-intel-audit.mjs first.');
    process.exit(1);
  }

  const auditData = JSON.parse(readFileSync(AUDIT_LOG_PATH, 'utf8'));
  
  // 1. Optimize Entries for Frontend Consumption
  const registry = {
    meta: {
      total: auditData.totalAssets,
      updatedAt: new Date().toISOString(),
      version: '2026.1.0'
    },
    // Search Index: Lightweight for instant client-side filtering
    index: auditData.entries.map(entry => ({
      id: entry.id,
      t: entry.title,
      slug: entry.id,
      type: entry.type,
      tier: entry.tier,
      d: entry.date,
      w: entry.words
    })),
    // Tier Mapping: For gated access logic
    tiers: auditData.tierDistribution,
    // Type Mapping: For navigation menus
    types: Object.keys(auditData.entries.reduce((acc, curr) => {
      acc[curr.type] = true;
      return acc;
    }, {}))
  };

  // Ensure directory exists
  const dir = path.dirname(REGISTRY_OUTPUT);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(REGISTRY_OUTPUT, JSON.stringify(registry, null, 2));

  console.log(`✅ [REGISTRY] Success. ${registry.meta.total} assets indexed.`);
  console.log(`📄 Path: ${REGISTRY_OUTPUT}`);
}

generateRegistry();