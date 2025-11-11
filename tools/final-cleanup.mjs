// tools/final-cleanup.mjs
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🎯 FINAL CLEANUP AND FIX\n');

// Fix the specific events/index.tsx issue
function fixEventsIndex() {
  const filePath = 'pages/events/index.tsx';
  if (!fs.existsSync(filePath)) {
    console.log('❌ events/index.tsx not found');
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('getAllEvents(), type Event')) {
      const newContent = content.replace(
        'getAllEvents(), type Event',
        'getAllEvents, type Event'
      );
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('✅ Fixed events/index.tsx import syntax');
      return true;
    } else {
      console.log('ℹ️  events/index.tsx already fixed');
      return true;
    }
  } catch (error) {
    console.log('❌ Error fixing events/index.tsx:', error.message);
    return false;
  }
}

// Clean up backup files
function cleanupBackups() {
  console.log('\n🧹 Cleaning up backup files...');
  
  const backupDirs = ['.emergency-fix-backups', '.repair-backups', '.template-fix-backups'];
  backupDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Removed ${dir}`);
    }
  });

  // Remove individual backup files
  let backupCount = 0;
  function removeBackups(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        if (!['node_modules', '.git', '.next'].includes(item.name)) {
          removeBackups(fullPath);
        }
      } else if (item.name.endsWith('.backup') || item.name.endsWith('.bak')) {
        fs.unlinkSync(fullPath);
        backupCount++;
      }
    }
  }
  
  removeBackups('.');
  console.log(`✅ Removed ${backupCount} backup files`);
}

// Test the build
function testBuild() {
  console.log('\n🧪 Testing build...');
  
  try {
    console.log('1. Testing TypeScript...');
    execSync('npm run typecheck', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation passed!');
    
    console.log('\n2. Testing build...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful!');
    
  } catch (error) {
    console.log('❌ Build failed with errors');
    console.log('The remaining issues need manual attention.');
  }
}

// Main execution
async function main() {
  // Fix the known issue
  const fixed = fixEventsIndex();
  
  if (!fixed) {
    console.log('❌ Could not fix the main issue. Manual intervention required.');
    return;
  }
  
  // Clean up backups
  cleanupBackups();
  
  // Test the build
  testBuild();
  
  console.log('\n🎉 CLEANUP COMPLETE');
  console.log('If build still fails, check for other TypeScript errors.');
}

main().catch(console.error);