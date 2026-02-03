// scripts/build-manifest-check.mjs — HARDENED (Metadata Integrity Audit)
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIRS = ['content/dispatches', 'content/shorts', 'content/vault'];
const REQUIRED_FIELDS = ['title', 'date', 'accessLevel'];

function auditRegistry() {
  console.log('🛡️  [REGISTRY_AUDIT] Initiating metadata integrity check...');
  let errorCount = 0;
  let totalFiles = 0;

  CONTENT_DIRS.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    
    try {
      const files = readdirSync(fullPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
      
      files.forEach(file => {
        totalFiles++;
        const filePath = path.join(fullPath, file);
        const content = readFileSync(filePath, 'utf8');
        const { data } = matter(content);

        REQUIRED_FIELDS.forEach(field => {
          if (!data[field]) {
            console.error(`❌ [MISSING_METADATA] ${dir}/${file} is missing required field: "${field}"`);
            errorCount++;
          }
        });

        if (data.accessLevel && !['public', 'inner-circle', 'private'].includes(data.accessLevel)) {
          console.error(`❌ [INVALID_ACCESS] ${dir}/${file} has invalid level: "${data.accessLevel}"`);
          errorCount++;
        }
      });
    } catch (e) {
      console.warn(`⚠️ [SKIP_DIR] Directory not found: ${dir}`);
    }
  });

  if (errorCount > 0) {
    console.error(`\n🚨 AUDIT FAILED: ${errorCount} metadata errors found in ${totalFiles} assets.`);
    process.exit(1); // Fails the build immediately
  }

  console.log(`✅ AUDIT PASSED: ${totalFiles} assets verified for production.`);
}

auditRegistry();