import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix hashbang in .tsx files that are imported as modules
const filesToFix = [
  'scripts/generate-pdfs.tsx',
  'scripts/pdf-registry.ts',
  'scripts/generate-legacy-canvas.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Remove hashbang if present
    if (content.startsWith('#!/usr/bin/env tsx')) {
      content = content.replace('#!/usr/bin/env tsx\n', '');
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed hashbang in ${file}`);
    }
  }
});

console.log('✅ All scripts fixed. You can now run: pnpm run build');