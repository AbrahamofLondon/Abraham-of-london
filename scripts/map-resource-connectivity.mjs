/* scripts/map-resource-connectivity.mjs */
import fs from 'fs';
import path from 'path';

const CONTENT_ROOT = 'content';

function scanForPhysicalDownloads(dir, report = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      scanForPhysicalDownloads(res, report);
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      const content = fs.readFileSync(res, 'utf8');
      // Look for any link ending in .pdf
      const pdfRegex = /\[([^\]]+)\]\(([^)]+\.pdf)\)/g;
      let match;
      
      while ((match = pdfRegex.exec(content)) !== null) {
        report.push({
          SourceFile: path.relative(CONTENT_ROOT, res),
          LinkText: match[1],
          Destination: match[2]
        });
      }
    }
  }
  return report;
}

console.log("--- 📋 Generating Resource Connectivity Map ---");
const connectivityReport = scanForPhysicalDownloads(CONTENT_ROOT);

if (connectivityReport.length > 0) {
  console.table(connectivityReport);
  console.log(`\n✅ Total active PDF download links: ${connectivityReport.length}`);
} else {
  console.log("⚠️ No physical PDF links found. All content is pointing to web routes.");
}