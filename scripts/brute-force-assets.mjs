import fs from 'fs';
import path from 'path';

const FILES_TO_FIX = [
  'content/blog/fathering-principles.mdx',
  'content/blog/reclaiming-the-narrative.mdx'
];

// Define the exact mapping based on your console errors
const REPLACEMENT_MAP = {
  '/vault/downloads/Fathers_in_Family_Court_Practical_Pack.pdf': '/vault/downloads/Fathers_in_Family_Court_Practical_Pack.pdf',
  '/vault/downloads/Brotherhood_Starter_Kit.pdf': '/vault/downloads/Brotherhood_Starter_Kit.pdf',
  '/vault/downloads/Brotherhood_Leader_Guide_4_Weeks.pdf': '/vault/downloads/Brotherhood_Leader_Guide_4_Weeks.pdf',
  '/vault/downloads/fathers_in_the_family_court_practical_pack.pdf': '/vault/downloads/Fathers_in_the_family_court_practical_pack.pdf'
};

function bruteForce() {
  console.log("--- 🔨 Brute Force Asset Alignment ---");

  FILES_TO_FIX.forEach(file => {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Direct string replacement for the stubborn links
    Object.keys(REPLACEMENT_MAP).forEach(oldPath => {
      // This targets the link regardless of what is inside the [brackets]
      const regex = new RegExp(`\\]\\(${oldPath}\\)`, 'g');
      content = content.replace(regex, `](${REPLACEMENT_MAP[oldPath]})`);
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Applied brute force fix to: ${file}`);
    } else {
      console.log(`❓ No match found in ${file}. Checking link syntax...`);
    }
  });
}

bruteForce();