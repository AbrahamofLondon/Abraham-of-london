// scripts/generate-intel-audit.mjs — HARDENED (Portfolio Inventory Engine)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

/* -----------------------------------------------------------------------------
  CONFIGURATION & REGISTRY POLICY
----------------------------------------------------------------------------- */
const CONTENT_DIRS = [
  { path: 'content/dispatches', type: 'DISPATCH', defaultLevel: 'public' },
  { path: 'content/shorts', type: 'SHORT', defaultLevel: 'public' },
  { path: 'content/vault', type: 'VAULT_ASSET', defaultLevel: 'inner-circle' }
];

const OUTPUT_PATH = path.join(process.cwd(), 'public/system');
const LOG_FILE = path.join(OUTPUT_PATH, 'intel-audit-log.json');
const TEXT_MANIFEST = path.join(OUTPUT_PATH, 'manifest.txt');

/**
 * Ensures the institutional filesystem is ready for auditing.
 * Prevents CI "Directory not found" warnings.
 */
function initializeRegistry() {
  CONTENT_DIRS.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir.path);
    if (!existsSync(fullPath)) {
      console.log(`ℹ️  [REGISTRY] Initializing missing directory: ${dir.path}`);
      mkdirSync(fullPath, { recursive: true });
      // Add a hidden file to ensure git tracks the directory if empty
      writeFileSync(path.join(fullPath, '.gitkeep'), '');
    }
  });

  if (!existsSync(OUTPUT_PATH)) {
    mkdirSync(OUTPUT_PATH, { recursive: true });
  }
}

/* -----------------------------------------------------------------------------
  CORE AUDIT ENGINE
----------------------------------------------------------------------------- */
function generateAudit() {
  initializeRegistry();
  
  console.log('📋 [AUDIT_LOG] Generating Institutional Manifest...');
  
  const auditData = {
    generatedAt: new Date().toISOString(),
    totalAssets: 0,
    breakdown: { public: 0, 'inner-circle': 0, private: 0 },
    inventory: []
  };

  let manifestText = `ABRAHAM OF LONDON — INTEL AUDIT MANIFEST\n`;
  manifestText += `Generated: ${auditData.generatedAt}\n`;
  manifestText += `Policy: Missing accessLevel defaults to directory standard.\n`;
  manifestText += `--------------------------------------------------\n\n`;

  CONTENT_DIRS.forEach(dirConfig => {
    const fullPath = path.join(process.cwd(), dirConfig.path);
    const files = readdirSync(fullPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
    
    files.forEach(file => {
      try {
        const filePath = path.join(fullPath, file);
        const content = readFileSync(filePath, 'utf8');
        const { data, content: body } = matter(content);
        
        // POLICY: Fallback to directory-specific default if frontmatter is missing accessLevel
        const resolvedTier = data.accessLevel || dirConfig.defaultLevel;
        
        const wordCount = body.trim() ? body.split(/\s+/).length : 0;
        
        const entry = {
          id: file.replace(/\.mdx?$/, ''),
          type: dirConfig.type,
          title: data.title || 'UNTITLED BRIEFING',
          tier: resolvedTier.toLowerCase(),
          date: data.date || 'NOT_DATED',
          words: wordCount,
          path: dirConfig.path
        };

        auditData.inventory.push(entry);
        auditData.totalAssets++;
        
        // Increment breakdown, initializing key if it's a new custom tier
        auditData.breakdown[entry.tier] = (auditData.breakdown[entry.tier] || 0) + 1;

        const logTier = entry.tier.toUpperCase().padEnd(15);
        manifestText += `[${entry.type}] ${entry.id.padEnd(45)} | ${logTier} | ${entry.words.toString().padStart(5)} words\n`;
      } catch (err) {
        console.error(`❌ [AUDIT_ERROR] Failed to process ${file}:`, err.message);
      }
    });
  });

  // Persist Audit Artifacts
  writeFileSync(LOG_FILE, JSON.stringify(auditData, null, 2));
  writeFileSync(TEXT_MANIFEST, manifestText);

  console.log(`✅ [AUDIT_LOG] Success. ${auditData.totalAssets} assets logged.`);
  console.log(`📊 [BREAKDOWN] ${JSON.stringify(auditData.breakdown)}`);
}

// Execute logic
generateAudit();