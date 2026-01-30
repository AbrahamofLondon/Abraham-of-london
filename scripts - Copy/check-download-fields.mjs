// scripts/check-download-fields.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function checkDownloadFiles() {
  console.log('🔍 Checking all Download files for required fields...\n');
  
  const mdxFiles = await glob('content/downloads/*.mdx');
  const issues = [];
  
  for (const file of mdxFiles) {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
    
    // Check if it's a Download type
    if (content.includes('type: Download')) {
      console.log(`Checking: ${file}`);
      
      const requiredFields = {
        'href': content.includes('\nhref:'),
        'downloadUrl': content.includes('\ndownloadUrl:'),
        'file': content.includes('\nfile:'),
      };
      
      const missing = Object.entries(requiredFields)
        .filter(([_, exists]) => !exists)
        .map(([field]) => field);
      
      if (missing.length > 0) {
        issues.push({ file, missing });
        console.log(`  ❌ Missing: ${missing.join(', ')}`);
      } else {
        console.log(`  ✅ All required fields present`);
        
        // Check for duplicate downloadUrl
        const downloadUrlMatches = (content.match(/downloadUrl:/g) || []).length;
        if (downloadUrlMatches > 1) {
          console.log(`  ⚠️  Warning: ${downloadUrlMatches} downloadUrl fields found (should be 1)`);
          issues.push({ file, warning: `Has ${downloadUrlMatches} downloadUrl fields` });
        }
      }
    }
  }
  
  console.log('\n📊 Summary:');
  if (issues.length === 0) {
    console.log('✅ All Download files are valid');
  } else {
    console.log(`Found ${issues.length} files with issues:`);
    issues.forEach(issue => {
      if (issue.missing) {
        console.log(`  - ${issue.file}: Missing ${issue.missing.join(', ')}`);
      } else if (issue.warning) {
        console.log(`  - ${issue.file}: ${issue.warning}`);
      }
    });
  }
}

checkDownloadFiles().catch(console.error);