/* scripts/heal-vault-paths.ts */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { globby } from 'globby'; // Ensure globby is available or use a basic recursive fs read

const CONTENT_DIR = path.join(process.cwd(), 'content');

// Patterns to prefix with /vault
// Note: We avoid prefixing links that are already absolute or already prefixed.
const TARGET_ROUTES = ['lexicon', 'blog', 'downloads', 'books', 'assets', 'inner-circle', 'contact', 'subscribe'];

async function healPaths() {
  console.log(chalk.blue.bold("🩹 STARTING STRUCTURAL PATH HEALING..."));

  // 1. Find all MDX/MD files in the content directory
  const files = fs.readdirSync(CONTENT_DIR, { recursive: true })
    .filter((f): f is string => typeof f === 'string' && (f.endsWith('.mdx') || f.endsWith('.md')));

  let totalFixes = 0;

  for (const relativePath of files) {
    const fullPath = path.join(CONTENT_DIR, relativePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;

    // Regex Explanation:
    // Matches href="/route" or [text](/route) 
    // Captures the route and ensures it doesn't already start with /vault/
    TARGET_ROUTES.forEach(route => {
      const regex = new RegExp(`(?<=[\\(\"'])\\/(?!vault\\/)(${route})(\\/[^\\)\"']*)?`, 'g');
      content = content.replace(regex, '/vault/$1$2');
    });

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      const fixesInFile = (content.match(/\/vault\//g) || []).length;
      console.log(`${chalk.green('✔ Fixed:')} ${relativePath}`);
      totalFixes++;
    }
  }

  console.log(chalk.blue.bold(`\n--- 🩹 HEALING COMPLETE ---`));
  console.log(`Files Modified: ${totalFixes}`);
  console.log(`Action: Run 'pnpm build' to verify alignment.`);
}

healPaths().catch(console.error);