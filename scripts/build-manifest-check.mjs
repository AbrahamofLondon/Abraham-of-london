import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * INSTITUTIONAL POLICY ENFORCEMENT
 * Standardizes metadata and prevents path regression.
 */

const CONTENT_DIRS = [
  { path: 'content/blog', defaultLevel: 'public' },
  { path: 'content/lexicon', defaultLevel: 'public' },
  { path: 'content/insights', defaultLevel: 'public' },
  { path: 'content/resources', defaultLevel: 'inner-circle' },
  { path: 'content/canon', defaultLevel: 'inner-circle' },
  { path: 'content/books', defaultLevel: 'public' }
];

const VALID_LEVELS = ['public', 'inner-circle', 'private'];

function auditRegistry() {
  console.log('🛡️  [REGISTRY_AUDIT] Verifying Institutional Integrity...');
  let criticalErrors = 0;
  let totalFiles = 0;
  let regressionLinks = 0;

  CONTENT_DIRS.forEach(dirConfig => {
    const fullPath = path.join(process.cwd(), dirConfig.path);
    if (!existsSync(fullPath)) return;

    const files = readdirSync(fullPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
    
    files.forEach(file => {
      totalFiles++;
      const filePath = path.join(fullPath, file);
      const content = readFileSync(filePath, 'utf8');
      const { data } = matter(content);

      // 1. Title Policy
      if (!data.title) {
        console.error(`❌ [MISSING_TITLE] ${dirConfig.path}/${file}`);
        criticalErrors++;
      }

      // 2. Link Regression Policy (Catches /blog/ instead of /vault/blog/)
      const linkRegex = /\[([^\]]+)\]\((?!http|#|\/vault\/)([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const url = match[2];
        // If it's an internal absolute path missing /vault/
        if (url.startsWith('/') && !url.startsWith('/vault/')) {
          console.error(`⚠️  [PATH_REGRESSION] ${file}: Link "${url}" must start with "/vault/"`);
          regressionLinks++;
        }
      }

      // 3. Access Level Policy
      if (data.accessLevel && !VALID_LEVELS.includes(data.accessLevel)) {
        console.error(`❌ [INVALID_ACCESS] ${file}: Unauthorized level "${data.accessLevel}"`);
        criticalErrors++;
      }
    });
  });

  console.log('\n--- 📊 AUDIT REPORT ---');
  console.log(`Assets Verified: ${totalFiles}`);
  
  if (criticalErrors > 0 || regressionLinks > 0) {
    console.error(`🚨 REJECTED: ${criticalErrors} metadata errors, ${regressionLinks} link regressions.`);
    process.exit(1); 
  }

  console.log(`✅ AUTHORIZED: Vault integrity confirmed.`);
}

auditRegistry();