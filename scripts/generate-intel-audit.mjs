// scripts/generate-intel-audit.mjs — HARDENED (Portfolio Inventory Engine)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIRS = [
  { path: 'content/dispatches', type: 'DISPATCH' },
  { path: 'content/shorts', type: 'SHORT' },
  { path: 'content/vault', type: 'VAULT_ASSET' }
];

const OUTPUT_PATH = path.join(process.cwd(), 'public/system');
const LOG_FILE = path.join(OUTPUT_PATH, 'intel-audit-log.json');
const TEXT_MANIFEST = path.join(OUTPUT_PATH, 'manifest.txt');

function generateAudit() {
  console.log('📋 [AUDIT_LOG] Generating Institutional Manifest...');
  
  const auditData = {
    generatedAt: new Date().toISOString(),
    totalAssets: 0,
    breakdown: { public: 0, 'inner-circle': 0, private: 0 },
    inventory: []
  };

  let manifestText = `ABRAHAM OF LONDON — INTEL AUDIT MANIFEST\n`;
  manifestText += `Generated: ${auditData.generatedAt}\n`;
  manifestText += `--------------------------------------------------\n\n`;

  CONTENT_DIRS.forEach(dirConfig => {
    const fullPath = path.join(process.cwd(), dirConfig.path);
    if (!existsSync(fullPath)) return;

    const files = readdirSync(fullPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
    
    files.forEach(file => {
      const content = readFileSync(path.join(fullPath, file), 'utf8');
      const { data, content: body } = matter(content);
      
      const wordCount = body.split(/\s+/).length;
      const entry = {
        id: file.replace(/\.mdx?$/, ''),
        type: dirConfig.type,
        title: data.title || 'UNTITLED',
        tier: data.accessLevel || 'unclassified',
        date: data.date || 'unknown',
        words: wordCount
      };

      auditData.inventory.push(entry);
      auditData.totalAssets++;
      auditData.breakdown[entry.tier] = (auditData.breakdown[entry.tier] || 0) + 1;

      manifestText += `[${entry.type}] ${entry.id.padEnd(30)} | ${entry.tier.toUpperCase().padEnd(15)} | ${entry.words} words\n`;
    });
  });

  // Ensure directory exists
  if (!existsSync(OUTPUT_PATH)) mkdirSync(OUTPUT_PATH, { recursive: true });

  // Write files
  writeFileSync(LOG_FILE, JSON.stringify(auditData, null, 2));
  writeFileSync(TEXT_MANIFEST, manifestText);

  console.log(`✅ [AUDIT_LOG] Success. ${auditData.totalAssets} assets logged to /public/system/manifest.txt`);
}

// Minimal readdirSync mock/import for standalone script
import { readdirSync } from 'fs';
generateAudit();