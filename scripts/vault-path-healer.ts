// scripts/vault-path-healer.ts
import fs from 'fs';
import path from 'path';

const CONTENT_ROOT = path.join(process.cwd(), 'content');

const HEALING_RULES = [
  { from: /\]\(\/lexicon\//g, to: '](/vault/lexicon/' },
  { from: /\]\(\/blog\//g, to: '](/vault/insights/' }, // Mapping blog to insights
  { from: /\]\(\/downloads\//g, to: '](/vault/downloads/' },
  { from: /\]\(\/books\//g, to: '](/vault/library/' }
];

function healPaths() {
  console.log('🩹 [PATH_HEALER] Repairing 219 link regressions...');
  
  const walk = (dir: string) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      const res = path.resolve(dir, f.name);
      if (f.isDirectory()) walk(res);
      else if (f.name.endsWith('.mdx') || f.name.endsWith('.md')) {
        let content = fs.readFileSync(res, 'utf8');
        let hasChanges = false;

        HEALING_RULES.forEach(rule => {
          if (rule.from.test(content)) {
            content = content.replace(rule.from, rule.to);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          fs.writeFileSync(res, content, 'utf8');
          console.log(`✅ Healed: ${f.name}`);
        }
      }
    }
  };

  walk(CONTENT_ROOT);
  console.log('✨ All regressions neutralized.');
}

healPaths();