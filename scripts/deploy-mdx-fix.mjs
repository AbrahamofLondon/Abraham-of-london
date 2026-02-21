// scripts/deploy-mdx-fix.mjs
import fs from 'fs';
import { globby } from 'globby';

async function deployFix() {
  // Targeting the specific files identified in the integrity failure
  const files = [
    'content/books/the-architecture-of-human-purpose.mdx',
    'content/books/the-builders-catechism.mdx',
    'content/resources/canon-campaign.mdx'
  ];

  console.log(`🚀 [DEPLOYING FIX]: Restoring MDX functional integrity...`);

  files.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  Skipping missing file: ${file}`);
      return;
    }

    const originalContent = fs.readFileSync(file, 'utf8');
    
    // Reverse the HTML entity encoding surgically
    const restoredContent = originalContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      // Reversing backslash escapes if any remained from previous "fixes"
      .replace(/\\</g, '<')
      .replace(/\\>/g, '>');

    if (originalContent !== restoredContent) {
      fs.writeFileSync(file, restoredContent, 'utf8');
      console.log(`✅ RESTORED: ${file}`);
    } else {
      console.log(`ℹ️  NO CHANGE REQUIRED: ${file}`);
    }
  });

  console.log(`\n🏁 Restoration complete. Please verify with: node scripts/mdx-integrity-check.mjs`);
}

deployFix();