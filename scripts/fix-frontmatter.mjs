import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEXICON_DIR = path.join(__dirname, '../content/lexicon');

/**
 * Repairs frontmatter by removing duplicate YAML keys.
 */
function repairFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) return;

  const rawLines = match[1].split('\n');
  const uniqueKeys = new Map();
  const cleanedLines = [];

  // Iterate backwards to keep the most "institutional" (usually the latest) value
  for (let i = rawLines.length - 1; i >= 0; i--) {
    const line = rawLines[i];
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):/);
    
    if (keyMatch) {
      const key = keyMatch[1];
      if (!uniqueKeys.has(key)) {
        uniqueKeys.set(key, true);
        cleanedLines.unshift(line);
      } else {
        console.log(`[REPAIR] Removing duplicate key "${key}" in ${path.basename(filePath)}`);
      }
    } else if (line.trim() !== "") {
      cleanedLines.unshift(line);
    }
  }

  const newContent = content.replace(
    frontmatterRegex,
    `---\n${cleanedLines.join('\n')}\n---\n`
  );

  fs.writeFileSync(filePath, newContent, 'utf8');
}

async function run() {
  console.log("--- 🛠️  Repairing Institutional Lexicon Frontmatter ---");
  const files = fs.readdirSync(LEXICON_DIR).filter(f => f.endsWith('.mdx'));

  files.forEach(file => {
    repairFile(path.join(LEXICON_DIR, file));
  });

  console.log("✅ Repair complete. Now run build-manifest.");
}

run();