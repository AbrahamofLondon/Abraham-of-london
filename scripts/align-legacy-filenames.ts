/* scripts/align-legacy-filenames.ts */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const CONTENT_DIR = path.join(process.cwd(), 'content');

const MAPPINGS = {
  'Fathers_in_Family_Court_Practical_Pack.pdf': 'fathers-family-court-pack.pdf',
  'Brotherhood_Starter_Kit.pdf': 'brotherhood-starter-kit.pdf',
  'Brotherhood_Leader_Guide_4_Weeks.pdf': 'brotherhood-leader-guide.pdf',
  'Fathers_in_the_family_court_practical_pack.pdf': 'fathers-family-court-pack.pdf'
};

async function alignFilenames() {
  const files = fs.readdirSync(CONTENT_DIR, { recursive: true })
    .filter(f => typeof f === 'string' && (f.endsWith('.mdx') || f.endsWith('.md')));

  files.forEach(file => {
    const fullPath = path.join(CONTENT_DIR, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    Object.entries(MAPPINGS).forEach(([legacy, current]) => {
      if (content.includes(legacy)) {
        content = content.replaceAll(legacy, current);
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(fullPath, content);
      console.log(`${chalk.green('✔ Aligned Filenames in:')} ${file}`);
    }
  });
}

alignFilenames().catch(console.error);