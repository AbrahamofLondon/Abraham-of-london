/* scripts/fix-institutional-links.mjs */
import fs from 'fs';
import path from 'path';

const CONTENT_DIR = 'content'; 

// Define the "Mapping Truth" for Abraham of London
const ACTION_MAP = {
  '/vault/contact': '/contact',          // Standardizes to your public contact route
  '/vault/subscribe': '/subscribe',      // Standardizes to your newsletter route
  '/vault/inner-circle': '/inner-circle' // Points to your specific form/landing page
};

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith('.mdx') || filePath.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

async function patchLinks() {
  console.log("--- 🛠️ Starting Institutional Path Normalization ---");
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌ Error: Directory "${CONTENT_DIR}" not found.`);
    return;
  }

  const files = getFiles(CONTENT_DIR);
  let fixCount = 0;
  let totalLinksChanged = 0;

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // 1. Fix the Institutional "Vault" structural paths
    content = content.replace(/\/vault\/library\//g, '/library/');
    content = content.replace(/\/vault\/insights\//g, '/briefs/');
    content = content.replace(/\/vault\/assets\/vault\//g, '/assets/');

    // 2. Fix the "Action Links" identified in your validation report
    Object.entries(ACTION_MAP).forEach(([broken, fixed]) => {
      // This regex ensures we replace the exact path within markdown brackets
      const regex = new RegExp(broken.replace(/\//g, '\\/'), 'g');
      content = content.replace(regex, fixed);
    });

    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      fixCount++;
      // Count total changes in this file
      const matchCount = (originalContent.match(/\/vault\//g) || []).length;
      totalLinksChanged += matchCount;
      console.log(`📡 Normalized: ${path.relative(process.cwd(), file)}`);
    }
  });

  console.log(`\n✅ Success: ${fixCount} files patched.`);
  console.log(`🔗 Total links normalized: ${totalLinksChanged}`);
  console.log("--- 🛡️ Porting Complete ---");
}

patchLinks().catch(console.error);