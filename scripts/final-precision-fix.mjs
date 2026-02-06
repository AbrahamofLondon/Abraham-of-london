import fs from 'fs';
import path from 'path';

const FILES = [
  'content/blog/fathering-principles.mdx',
  'content/blog/reclaiming-the-narrative.mdx'
];

// We match the "intent" of the link and replace it with the clean "Institutional" version
const MAP = [
  { 
    pattern: /downloads\/Fathers_in_Family_Court_Practical_Pack\.pdf/i, 
    replacement: '/vault/downloads/Fathers_in_Family_Court_Practical_Pack.pdf' 
  },
  { 
    pattern: /downloads\/Brotherhood_Starter_Kit\.pdf/i, 
    replacement: '/vault/downloads/Brotherhood_Starter_Kit.pdf' 
  },
  { 
    pattern: /downloads\/Brotherhood_Leader_Guide_4_Weeks\.pdf/i, 
    replacement: '/vault/downloads/Brotherhood_Leader_Guide_4_Weeks.pdf' 
  },
  { 
    pattern: /downloads\/fathers_in_the_family_court_practical_pack\.pdf/i, 
    replacement: '/vault/downloads/Fathers_in_the_family_court_practical_pack.pdf' 
  }
];

FILES.forEach(file => {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  MAP.forEach(item => {
    // This regex finds [anything](any-spacing-or-newlines-pattern)
    const regex = new RegExp('\\[[^\\]]*\\]\\s*\\(\\s*[^\\)]*' + item.pattern.source + '[^\\)]*\\)', 'gi');
    
    if (regex.test(content)) {
      content = content.replace(regex, (match) => {
        // Keep the original text inside [ ], but clean the URL inside ( )
        const textMatch = match.match(/\[(.*?)\]/);
        const text = textMatch ? textMatch[1] : 'Download PDF';
        changed = true;
        return `[${text}](${item.replacement})`;
      });
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🎯 Fixed stubborn PDF links in: ${file}`);
  } else {
    console.log(`🔎 No targets found in ${file}. Checking manifest status...`);
  }
});