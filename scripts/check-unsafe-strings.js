// scripts/check-unsafe-strings.js
import fs from 'fs';
import path from 'path';

const UNSAFE_PATTERNS = [
  { 
    pattern: /\.[\s\n]*charAt\s*\(/g, 
    message: "Use safeCharAt() from lib/utils/safe instead." 
  },
  { 
    pattern: /author\.name\.charAt/g, 
    message: "Use safeFirstChar() for author names." 
  },
  { 
    pattern: /difficulty\.charAt/g, 
    message: "Use safeCapitalize() for difficulty levels." 
  },
  { 
    pattern: /\.slice\s*\(/g, 
    message: "Use safeString() with substring methods." 
  },
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let hasUnsafe = false;
  
  lines.forEach((line, index) => {
    UNSAFE_PATTERNS.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        console.error(`❌ ${message}`);
        console.error(`   File: ${filePath}:${index + 1}`);
        console.error(`   Line: ${line.trim()}\n`);
        hasUnsafe = true;
      }
    });
  });
  
  return hasUnsafe;
}

function walkDir(dir) {
  let hasErrors = false;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      hasErrors = walkDir(fullPath) || hasErrors;
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
      hasErrors = checkFile(fullPath) || hasErrors;
    }
  }
  
  return hasErrors;
}

// Run check
console.log('🔍 Checking for unsafe string methods...\n');

const dirsToCheck = ['components', 'pages', 'lib'];
let totalErrors = 0;

dirsToCheck.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Checking ${dir}/...`);
    const errors = walkDir(dir);
    if (errors) totalErrors++;
  }
});

if (totalErrors > 0) {
  console.error(`\n⚠️  Found ${totalErrors} directories with unsafe string methods!`);
  console.error('👉 Use safe utilities from "@/lib/utils/safe" instead.');
  process.exit(1);
} else {
  console.log('✅ No unsafe string methods found!');
  process.exit(0);
}