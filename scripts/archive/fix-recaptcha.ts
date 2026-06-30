// fix-recaptcha.ts
import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'pages/api');

function fixFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the errors property to errorCodes
  const fixedContent = content.replace(
    /errors:\s*result\.errors/g,
    'errorCodes: result.errorCodes'
  );
  
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fixFile(fullPath);
    }
  });
}

walkDir(apiDir);
console.log('Recaptcha fixes applied!');
