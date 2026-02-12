/* scripts/align-generated-assets.mjs */
import fs from 'fs';
import path from 'path';

const CONTENT_ROOT = 'content';
const ASSET_PATHS = [
  'downloads',
  'assets/downloads/lib-pdf'
];

const SLUG_TO_ROUTE = new Map();

/**
 * 1. Map MDX Files FIRST (Priority)
 * This ensures briefs link to /folder/slug, not the PDF.
 */
function mapMdxRoutes(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      mapMdxRoutes(res);
    } else if (entry.name.endsWith('.mdx')) {
      const slug = path.basename(entry.name, '.mdx');
      const relativeFromContent = path.relative(CONTENT_ROOT, dir);
      
      // Build the web route (e.g., /briefs/the-founding-brief)
      const routePrefix = relativeFromContent ? `/${relativeFromContent.replace(/\\/g, '/')}` : '';
      SLUG_TO_ROUTE.set(slug, `${routePrefix}/${slug}`);
    }
  }
}

/**
 * 2. Map PDFs only if they are true downloads
 */
function mapDownloadAssets() {
  ASSET_PATHS.forEach(basePath => {
    const fullPath = path.join('public', basePath);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath, { recursive: true });
      files.forEach(file => {
        if (typeof file === 'string' && file.endsWith('.pdf')) {
          const slug = path.basename(file, '.pdf');
          // We only add the PDF to the map if it's NOT already a web route
          // OR if it's in a dedicated downloads folder
          if (!SLUG_TO_ROUTE.has(slug) || basePath.includes('downloads')) {
            const webPath = `/${basePath}/${file}`.replace(/\\/g, '/');
            SLUG_TO_ROUTE.set(slug, webPath);
          }
        }
      });
    }
  });
}

function updateLinks(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      updateLinks(res);
    } else if (entry.name.endsWith('.mdx')) {
      let content = fs.readFileSync(res, 'utf8');
      const originalContent = content;

      SLUG_TO_ROUTE.forEach((correctPath, slug) => {
        const escapedCorrect = correctPath.replace(/\//g, '\\/').replace(/\./g, '\\.');
        // This regex catches links that are NOT pointing to our desired web route
        const phantomRegex = new RegExp(`\\]\\((?!${escapedCorrect})\\/[^)]*?\\/${slug}(?:\\.pdf)?\\)`, 'g');
        
        if (content.match(phantomRegex)) {
          content = content.replace(phantomRegex, `](${correctPath})`);
        }
      });

      if (content !== originalContent) {
        fs.writeFileSync(res, content, 'utf8');
        console.log(`🎯 Aligned: ${path.relative(CONTENT_ROOT, res)} -> Optimized for Web`);
      }
    }
  }
}

console.log("--- 🌐 Aligning Content: Web-First Priority ---");
mapMdxRoutes(CONTENT_ROOT); // Map MDX first to capture the 411 files
mapDownloadAssets();      // Map PDFs as secondary/resource targets
console.log(`📡 Registered ${SLUG_TO_ROUTE.size} high-integrity routes.`);
updateLinks(CONTENT_ROOT);
console.log("--- ✅ Alignment Complete ---");