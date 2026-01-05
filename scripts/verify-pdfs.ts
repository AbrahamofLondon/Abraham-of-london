// scripts/verify-pdfs.ts
import fs from 'fs';
import path from 'path';

const downloadDir = path.join(process.cwd(), 'public/assets/downloads');

function verifyBuild() {
  console.log('🔍 VERIFYING PDF BUILD');
  console.log('════════════════════════════════════════════════════════════════════');
  
  if (!fs.existsSync(downloadDir)) {
    console.log('❌ Download directory does not exist');
    return false;
  }
  
  const files = fs.readdirSync(downloadDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
  
  console.log(`Found ${pdfFiles.length} PDF files\n`);
  
  // Expected files for each tier
  const expectedFiles = {
    architect: ['a4', 'letter', 'a3'].map(f => `legacy-architecture-canvas-${f}-premium-architect.pdf`),
    member: ['a4', 'letter', 'a3'].map(f => `legacy-architecture-canvas-${f}-premium-member.pdf`),
    free: ['a4', 'letter', 'a3'].map(f => `legacy-architecture-canvas-${f}-premium-free.pdf`)
  };
  
  let allGood = true;
  
  // Check each tier
  for (const [tier, files] of Object.entries(expectedFiles)) {
    console.log(`🎯 ${tier.toUpperCase()} TIER:`);
    
    for (const expectedFile of files) {
      const exists = pdfFiles.includes(expectedFile);
      const filePath = path.join(downloadDir, expectedFile);
      
      if (exists) {
        const stats = fs.statSync(filePath);
        const isValid = stats.size > 50000; // At least 50KB
        
        if (isValid) {
          console.log(`  ✅ ${expectedFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
          console.log(`  ⚠️  ${expectedFile} (TOO SMALL: ${stats.size} bytes)`);
          allGood = false;
        }
      } else {
        console.log(`  ❌ ${expectedFile} (MISSING)`);
        allGood = false;
      }
    }
    console.log('');
  }
  
  // Check for unexpected files
  const unexpectedFiles = pdfFiles.filter(f => 
    !Object.values(expectedFiles).flat().includes(f)
  );
  
  if (unexpectedFiles.length > 0) {
    console.log('⚠️  UNEXPECTED FILES:');
    unexpectedFiles.forEach(f => console.log(`  ${f}`));
    console.log('');
  }
  
  console.log('════════════════════════════════════════════════════════════════════');
  
  if (allGood && unexpectedFiles.length === 0) {
    console.log('✅ BUILD VERIFICATION PASSED');
    return true;
  } else {
    console.log('⚠️  BUILD HAS ISSUES - Run "pnpm pdfs:fix" to repair');
    return false;
  }
}

verifyBuild();