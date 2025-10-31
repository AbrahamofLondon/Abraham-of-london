import fs from 'fs';
import path from 'path';
import * as glob from 'glob';

// 1. Define the files/directories to search
const filePatterns = [
  'pages/**/*.+(js|jsx|ts|tsx)',
  'src/**/*.+(js|jsx|ts|tsx)',
  'lib/**/*.+(js|jsx|ts|tsx)',
  'components/**/*.+(js|jsx|ts|tsx)',
];

const OLD_IMPORT = /import\s+\{(.*?)\}\s+from\s+['"]contentlayer\/generated['"];?/g;
const NEW_IMPORT = "import { getAllContent } from '@/lib/content-fetcher';";
let filesModified = 0;

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if the old import exists
    if (content.match(OLD_IMPORT)) {
      
      // Replace the import line itself
      let newContent = content.replace(OLD_IMPORT, NEW_IMPORT);
      
      // You must still manually update the usage (e.g., 'allDownloads' to 'getAllContent("downloads")')
      console.log(`✅ Replaced import in: ${filePath}`);
      fs.writeFileSync(filePath, newContent, 'utf8');
      filesModified++;
    }
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error.message);
  }
}

console.log('Starting automated Contentlayer import replacement...');

filePatterns.forEach(pattern => {
  const files = glob.sync(pattern, { nodir: true });
  files.forEach(replaceInFile);
});

console.log(`\nAutomation complete. Total files modified: ${filesModified}.`);
console.log('⚠️ NEXT STEP: You MUST manually update content usage (e.g., allPosts -> getAllContent("blog")) in the modified files.');