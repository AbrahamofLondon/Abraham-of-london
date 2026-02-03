// scripts/build-manifest-check.mjs — ADAPTIVE (Metadata Integrity & Auto-Correction)
import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * INSTITUTIONAL POLICY:
 * 1. Title is MANDATORY. Without a title, the asset is invisible/broken.
 * 2. Date is RECOMMENDED. Defaults to 'undated' if missing.
 * 3. AccessLevel is ADAPTIVE. Defaults to 'public' if missing.
 */

const CONTENT_DIRS = [
  { path: 'content/dispatches', defaultLevel: 'public' },
  { path: 'content/shorts', defaultLevel: 'public' },
  { path: 'content/vault', defaultLevel: 'inner-circle' }
];

const VALID_LEVELS = ['public', 'inner-circle', 'private'];

function auditRegistry() {
  console.log('🛡️  [REGISTRY_AUDIT] Initiating adaptive integrity check...');
  let criticalErrors = 0;
  let totalFiles = 0;
  let correctedFields = 0;

  CONTENT_DIRS.forEach(dirConfig => {
    const fullPath = path.join(process.cwd(), dirConfig.path);
    
    if (!existsSync(fullPath)) {
      console.warn(`⚠️  [SKIP_DIR] Optional registry path not found: ${dirConfig.path}`);
      return;
    }

    const files = readdirSync(fullPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
    
    files.forEach(file => {
      totalFiles++;
      const filePath = path.join(fullPath, file);
      const content = readFileSync(filePath, 'utf8');
      const { data } = matter(content);

      // 1. CRITICAL CHECK: Title (The build cannot identify the asset without this)
      if (!data.title) {
        console.error(`❌ [CRITICAL_MISSING] ${dirConfig.path}/${file} has no title. Build unsafe.`);
        criticalErrors++;
      }

      // 2. ADAPTIVE CHECK: Access Level
      if (!data.accessLevel) {
        // Log as info, not error. We apply the default here for validation purposes.
        console.log(`ℹ️  [AUTO_RESOLVE] ${file} -> defaulting to "${dirConfig.defaultLevel}"`);
        correctedFields++;
      } else if (!VALID_LEVELS.includes(data.accessLevel)) {
        console.error(`❌ [INVALID_ACCESS] ${file} has unauthorized level: "${data.accessLevel}"`);
        criticalErrors++;
      }

      // 3. ADAPTIVE CHECK: Date
      if (!data.date) {
        console.warn(`⚠️  [METADATA_WARNING] ${file} is undated.`);
      }
    });
  });

  if (criticalErrors > 0) {
    console.error(`\n🚨 AUDIT REJECTED: ${criticalErrors} critical structural errors found.`);
    process.exit(1); 
  }

  console.log(`\n✅ AUDIT AUTHORIZED: ${totalFiles} assets processed.`);
  if (correctedFields > 0) {
    console.log(`✨ Note: ${correctedFields} access levels were auto-resolved to defaults.`);
  }
}

auditRegistry();