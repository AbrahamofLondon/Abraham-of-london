import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const TS_FILES = await glob('**/*.ts', { ignore: 'node_modules/**' });

for (const file of TS_FILES) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('<!doctype html>') || content.includes('</html>')) {
    console.error(`❌ Corrupted TypeScript file detected: ${file}`);
    process.exit(1);
  }
}
console.log('✅ All TypeScript files are valid');