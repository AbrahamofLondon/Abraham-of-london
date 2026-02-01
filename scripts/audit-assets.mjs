import fs from 'fs';
import path from 'path';

const contentDir = path.resolve('./content');
const assetsDir = path.resolve('./public/assets/downloads');

const getAllFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.resolve(dir, file);
    if (fs.statSync(fullPath).isDirectory()) results = results.concat(getAllFiles(fullPath));
    else if (file.endsWith('.mdx') || file.endsWith('.md')) results.push(fullPath);
  });
  return results;
};

function auditPDFs() {
  const files = getAllFiles(contentDir);
  const pdfLinks = new Set();

  files.forEach(fullPath => {
    const content = fs.readFileSync(fullPath, 'utf8');
    // Regex to find .pdf links
    const regex = /\/assets\/downloads\/([\w-]+\.pdf)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      pdfLinks.add(match[1]);
    }
  });

  console.log(`--- 📑 Premium PDF Migration Audit ---`);
  console.log(`Total Unique PDFs found in briefs: ${pdfLinks.size}`);
  
  const missingInFolder = [];
  pdfLinks.forEach(pdf => {
    if (!fs.existsSync(path.join(assetsDir, pdf))) {
      missingInFolder.push(pdf);
    }
  });

  if (missingInFolder.length > 0) {
    console.warn(`⚠️  Warning: ${missingInFolder.length} PDFs are linked but missing from the folder:`);
    console.table(missingInFolder);
  } else {
    console.log(`✅ All linked PDFs are present in the downloads folder.`);
  }
}

auditPDFs();