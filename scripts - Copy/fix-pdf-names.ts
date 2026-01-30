// scripts/fix-pdf-names.ts
import fs from 'fs';
import path from 'path';

const downloadDir = path.join(process.cwd(), 'public/assets/downloads');

function fixFileNames() {
  console.log('🛠️  Fixing PDF file names...');
  
  if (!fs.existsSync(downloadDir)) {
    console.log('❌ Download directory does not exist');
    return;
  }
  
  const files = fs.readdirSync(downloadDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
  
  console.log(`Found ${pdfFiles.length} PDF files`);
  
  const renameMap: Array<{old: string, new: string}> = [];
  
  // Fix -alt.pdf files
  pdfFiles.forEach(file => {
    if (file.includes('-alt.pdf')) {
      let newTier = 'architect'; // default
      
      // Try to determine which tier this belongs to
      if (file.includes('architect')) newTier = 'architect';
      else if (file.includes('member')) newTier = 'member';
      else if (file.includes('free')) newTier = 'free';
      
      const newName = file.replace('-alt.pdf', `-${newTier}.pdf`);
      renameMap.push({ old: file, new: newName });
    }
  });
  
  // Fix old tier names to new tier names
  pdfFiles.forEach(file => {
    if (file.includes('inner-circle-plus')) {
      const newName = file.replace('inner-circle-plus', 'architect');
      renameMap.push({ old: file, new: newName });
    } else if (file.includes('inner-circle')) {
      const newName = file.replace('inner-circle', 'member');
      renameMap.push({ old: file, new: newName });
    } else if (file.includes('public')) {
      const newName = file.replace('public', 'free');
      renameMap.push({ old: file, new: newName });
    }
  });
  
  // Apply renames
  if (renameMap.length === 0) {
    console.log('✅ All file names are correct');
    return;
  }
  
  console.log(`\nRenaming ${renameMap.length} files:`);
  
  renameMap.forEach(({ old, new: newName }) => {
    const oldPath = path.join(downloadDir, old);
    const newPath = path.join(downloadDir, newName);
    
    // Check if destination already exists
    if (fs.existsSync(newPath)) {
      console.log(`  ⚠️  ${old} → ${newName} (already exists, skipping)`);
      return;
    }
    
    try {
      fs.renameSync(oldPath, newPath);
      console.log(`  ✅ ${old} → ${newName}`);
    } catch (error: any) {
      console.log(`  ❌ ${old} → ${newName} (failed: ${error.message})`);
    }
  });
  
  console.log('\n✅ File name fix completed');
}

// Verify final state
function verifyFiles() {
  console.log('\n🔍 Verifying final state...');
  
  const files = fs.readdirSync(downloadDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
  
  const expectedFiles = [
    'legacy-architecture-canvas-a4-premium-architect.pdf',
    'legacy-architecture-canvas-letter-premium-architect.pdf',
    'legacy-architecture-canvas-a3-premium-architect.pdf',
    'legacy-architecture-canvas-a4-premium-member.pdf',
    'legacy-architecture-canvas-letter-premium-member.pdf',
    'legacy-architecture-canvas-a3-premium-member.pdf',
    'legacy-architecture-canvas-a4-premium-free.pdf',
    'legacy-architecture-canvas-letter-premium-free.pdf',
    'legacy-architecture-canvas-a3-premium-free.pdf'
  ];
  
  let allGood = true;
  
  expectedFiles.forEach(expected => {
    const exists = pdfFiles.includes(expected);
    if (exists) {
      console.log(`  ✅ ${expected}`);
    } else {
      console.log(`  ❌ ${expected} (MISSING)`);
      allGood = false;
    }
  });
  
  const unexpectedFiles = pdfFiles.filter(f => !expectedFiles.includes(f));
  if (unexpectedFiles.length > 0) {
    console.log('\n⚠️  Unexpected files:');
    unexpectedFiles.forEach(f => console.log(`  ${f}`));
  }
  
  if (allGood && unexpectedFiles.length === 0) {
    console.log('\n🎉 All files are correctly named!');
  } else {
    console.log('\n⚠️  Some issues remain');
  }
}

// Run the fix
fixFileNames();
verifyFiles();