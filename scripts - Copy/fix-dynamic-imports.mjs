// scripts/fix-dynamic-imports.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, '..', 'pages');

// Files with dynamic import errors
const problemFiles = [
  'blog/[slug].tsx',
  'canon/[slug].tsx', 
  'downloads/[slug].tsx',
  'resources/[...slug].tsx',
  'shorts/[slug].tsx',
  'prints/[slug].tsx'
];

function fixDynamicImport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix dynamic imports to be more compatible
  content = content.replace(
    /dynamic\(\(\) => import\(["']([^"']+)["']\)/g,
    (match, importPath) => {
      return `dynamic(() => import("${importPath}").then(mod => ({ default: mod.default || mod })))`;
    }
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${path.relative(pagesDir, filePath)}`);
}

// Fix each problem file
for (const relativePath of problemFiles) {
  const fullPath = path.join(pagesDir, relativePath);
  if (fs.existsSync(fullPath)) {
    fixDynamicImport(fullPath);
  }
}
