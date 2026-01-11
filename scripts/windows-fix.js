// scripts/windows-fix.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔧 Running Windows file locking fix...');

const problematicExtensions = ['.pptx', '.docx', '.xlsx', '.pdf', '.odt', '.ods', '.odp'];
const directoriesToCheck = [
  'public/downloads',
  'public/assets/downloads'
];

let fixedFiles = 0;

directoriesToCheck.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`📁 Directory doesn't exist: ${dir}`);
    return;
  }

  try {
    const files = fs.readdirSync(fullPath);
    
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (problematicExtensions.includes(ext)) {
        const filePath = path.join(fullPath, file);
        
        try {
          // Try to access the file
          fs.accessSync(filePath, fs.constants.R_OK);
          console.log(`✅ ${file} is accessible`);
        } catch (error) {
          console.log(`🔒 ${file} is locked, attempting to fix...`);
          
          try {
            // Try to unlock with PowerShell
            if (process.platform === 'win32') {
              execSync(`powershell -Command "$process = Get-Process | Where-Object {$_.Path -like '*${file}*'}; if ($process) { Stop-Process $process.Id -Force }"`, {
                stdio: 'ignore'
              });
            }
            
            // Try to copy and replace
            const tempPath = filePath + '.unlock';
            fs.copyFileSync(filePath, tempPath);
            fs.unlinkSync(filePath);
            fs.renameSync(tempPath, filePath);
            
            console.log(`✅ Unlocked: ${file}`);
            fixedFiles++;
          } catch (fixError) {
            console.log(`⚠️ Could not unlock ${file}, moving to backup...`);
            const backupPath = filePath + '.locked-backup';
            fs.renameSync(filePath, backupPath);
            fixedFiles++;
          }
        }
      }
    });
  } catch (error) {
    console.log(`❌ Cannot read directory ${dir}: ${error.message}`);
  }
});

// Create a .gitignore-style ignore file for webpack
const ignoreContent = `# Windows file locking workaround
# These files/directories are excluded from Webpack/Turbopack scanning

/public/downloads/
/public/assets/downloads/
*.pptx
*.docx
*.xlsx
*.odt
*.ods
*.odp
*.tmp
Thumbs.db
desktop.ini
~$*
`;

fs.writeFileSync(path.join(process.cwd(), '.webpackignore'), ignoreContent);
console.log(`📝 Created .webpackignore file`);

console.log(`\n🎯 Fixed ${fixedFiles} locked files`);
console.log('✅ Windows file locking fix complete');