import fs from 'fs';
import path from 'path';

const targetFile = path.resolve('./content/blog/fathering-without-fear-teaser.mdx');

function performSurgicalStrike() {
  if (!fs.existsSync(targetFile)) {
    console.error("❌ Target file not found at expected path.");
    return;
  }

  let content = fs.readFileSync(targetFile, 'utf8');
  const original = content;

  // The exact string identified by your validator
  const brokenString = '/blog/ /blog/fathering-without-fear';
  const cleanString = '/blog/fathering-without-fear';

  if (content.includes(brokenString)) {
    // Replace all instances of the broken string with the clean one
    content = content.split(brokenString).join(cleanString);
    
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log(`✅ Fixed: ${path.basename(targetFile)}`);
    console.log(`✨ Pattern removed: "${brokenString}"`);
  } else {
    console.log("⚠️  Literal string not found. Checking for double-slash variants...");
    // Fallback for invisible character variants
    content = content.replace(/\/blog\/\s+\/blog\//g, '/blog/');
    if (content !== original) {
        fs.writeFileSync(targetFile, content, 'utf8');
        console.log("✅ Fixed using fallback regex.");
    } else {
        console.log("❌ Could not find the broken pattern. Manual intervention required.");
    }
  }
}

performSurgicalStrike();