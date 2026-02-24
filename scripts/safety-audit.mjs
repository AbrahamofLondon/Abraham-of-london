/* scripts/safety-audit.mjs - SURGICAL CONTENT SCANNER */
import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';

const CONTENT_DIR = 'content';
const MANGLE_PATTERNS = [
  { regex: /\x00/, name: 'Null Byte (Total Corruption)' },
  { regex: /&lt;(?:Callout|Note|BriefAlert|Divider)/, name: 'Escaped MDX Components' },
  { regex: /<\[.*?\]/, name: 'Mangled Bracket Syntax' },
  { regex: /[^\x00-\x7F]{3,}/, name: 'Potential Encoding Shift' }
];

async function runAudit() {
  console.log("🛡️  Starting Institutional Content Audit...");
  const files = await glob(`${CONTENT_DIR}/**/*.mdx`);
  let totalIssues = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);

    for (const pattern of MANGLE_PATTERNS) {
      if (pattern.regex.test(content)) {
        console.error(`❌ MANGLE DETECTED [${pattern.name}]: ${relativePath}`);
        totalIssues++;
      }
    }
  }

  if (totalIssues > 0) {
    console.error(`\n🚨 AUDIT FAILED: ${totalIssues} issues found. Build aborted to protect briefs.`);
    process.exit(1);
  }

  console.log(`✅ AUDIT PASSED: ${files.length} briefs verified clean.`);
}

runAudit().catch(err => {
  console.error("Audit script failed:", err);
  process.exit(1);
});