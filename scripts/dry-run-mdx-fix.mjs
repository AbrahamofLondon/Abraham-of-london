// scripts/dry-run-mdx-fix.mjs
import fs from 'fs';
import { globby } from 'globby';

async function dryRun() {
  const files = [
    'content/books/the-architecture-of-human-purpose.mdx',
    'content/books/the-builders-catechism.mdx',
    'content/resources/canon-campaign.mdx'
  ];

  console.log(`🔍 [DRY RUN]: Analyzing mutation patterns...`);

  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Pattern: Specifically looking for escaped MDX components
      if (line.includes('&lt;') || line.includes('\\<') || line.includes('\\>')) {
        const suggested = line
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\\</g, '<')
          .replace(/\\>/g, '>');
        
        console.log(`\nFile: ${file} (Line ${index + 1})`);
        console.log(`❌ CURRENT: ${line.trim()}`);
        console.log(`✅ TARGET:  ${suggested.trim()}`);
      }
    });
  });
}

dryRun();