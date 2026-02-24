/* scripts/safety-check.mjs */
import fs from 'fs';
import glob from 'fast-glob';

const MANGLE_PATTERNS = [
  /\x00/,                // Null bytes
  /&lt;(?:Callout|Note)/, // Escaped MDX tags
  /\r\n/                 // CRLF in a Unix environment
];

async function check() {
  const files = await glob('content/**/*.mdx');
  let issues = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of MANGLE_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`❌ SAFETY ALERT: Mangled content detected in ${file}`);
        issues++;
        break;
      }
    }
  }

  if (issues > 0) {
    console.error(`\nFound ${issues} corrupted files. Commit aborted.`);
    process.exit(1);
  }
  console.log("🛡️  Content safety check passed.");
}

check();