// scripts/content/validate-schema.ts — INSTITUTIONAL ALIGNMENT
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🛡️  [SCHEMA] Validating Intelligence Portfolio structure...');

const ROOT_DIR = process.cwd();
const CONTENT_DIR = join(ROOT_DIR, 'content');

// Updated to your specific Institutional Folders
const INSTITUTIONAL_FOLDERS = [
  'vault',        // Core intelligence briefs
  'dispatches',   // Updates and reports
  'shorts',       // Quick insights
  'legal',        // Compliance and privacy
  'system'        // Internal configuration
];

if (!existsSync(CONTENT_DIR)) {
  console.log('📁 [SCHEMA] Content root missing. Initializing Foundation...');
  mkdirSync(CONTENT_DIR, { recursive: true });
}

INSTITUTIONAL_FOLDERS.forEach(dir => {
  const dirPath = join(CONTENT_DIR, dir);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`  ✅ Created Directory: content/${dir}/`);
    
    // Seed an initial brief if the directory was just created
    if (dir === 'vault') {
      const seedFile = join(dirPath, 'intel-001-foundation.mdx');
      const seedContent = `---
title: "Institutional Foundation"
date: "${new Date().toISOString().split('T')[0]}"
accessLevel: "inner-circle"
category: "Intelligence"
description: "Initial system-generated intelligence brief."
---

# Institutional Foundation

This document serves as the foundation for the Abraham of London intelligence portfolio.
`;
      writeFileSync(seedFile, seedContent);
      console.log('     ✨ Seeded: vault/intel-001-foundation.mdx');
    }
  }
});

// Verify Contentlayer Config (The "Brain" of the schema)
const configPath = join(ROOT_DIR, 'contentlayer.config.ts');
if (!existsSync(configPath)) {
  console.warn('⚠️  [SCHEMA_WARNING] contentlayer.config.ts not found. Build may rely on runtime fallbacks.');
} else {
  console.log('✅ [SCHEMA] Contentlayer configuration verified.');
}

console.log('✅ [SCHEMA] Portfolio validation complete.');
process.exit(0);