// scripts/pdf/intelligent-pdf-generator-bridge.ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const downloadDir = path.join(process.cwd(), 'public/assets/downloads');

// Map build tiers to legacy script tiers
const TIER_MAPPING = {
  'architect': 'inner-circle-plus',
  'member': 'inner-circle',
  'free': 'public',
  'premium': 'inner-circle-plus'
};

function runBuild(tier: string, cleanFirst: boolean = true) {
  console.log(`🚀 Building PDFs for tier: ${tier}`);
  
  const legacyTier = TIER_MAPPING[tier as keyof typeof TIER_MAPPING] || 'inner-circle-plus';
  
  // Clean only files for this tier before generating
  if (cleanFirst) {
    cleanTierFiles(tier);
  }
  
  // Generate all formats
  const formats = ['A4', 'Letter', 'A3'];
  let success = true;
  
  for (const format of formats) {
    try {
      console.log(`  📄 Generating ${format}...`);
      
      const command = `npx tsx scripts/generate-legacy-canvas.ts ${format} premium ${tier}`;
      
      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          PDF_TIER: tier
        }
      });
      
      console.log(`  ✅ ${format} generated`);
    } catch (error: any) {
      console.error(`  ❌ ${format} failed: ${error.message}`);
      success = false;
    }
  }
  
  return success;
}

function cleanTierFiles(tier: string) {
  if (!fs.existsSync(downloadDir)) return;
  
  const files = fs.readdirSync(downloadDir);
  const filesToDelete = files.filter(f => 
    f.includes(`-${tier}.pdf`) || 
    (tier === 'architect' && f.includes('-alt.pdf'))
  );
  
  if (filesToDelete.length > 0) {
    console.log(`🧹 Cleaning ${filesToDelete.length} files for tier ${tier}...`);
    for (const file of filesToDelete) {
      try {
        fs.unlinkSync(path.join(downloadDir, file));
        console.log(`  ✅ Removed: ${file}`);
      } catch (error) {
        console.log(`  ❌ Failed to remove: ${file}`);
      }
    }
  }
}

function verifyTierFiles(tier: string) {
  if (!fs.existsSync(downloadDir)) {
    console.log('❌ Download directory does not exist');
    return false;
  }
  
  const files = fs.readdirSync(downloadDir);
  const expectedFiles = [
    `legacy-architecture-canvas-a4-premium-${tier}.pdf`,
    `legacy-architecture-canvas-letter-premium-${tier}.pdf`,
    `legacy-architecture-canvas-a3-premium-${tier}.pdf`
  ];
  
  console.log(`🔍 Verifying tier ${tier}...`);
  
  let allValid = true;
  for (const expected of expectedFiles) {
    const exists = files.includes(expected);
    if (exists) {
      const stats = fs.statSync(path.join(downloadDir, expected));
      const isValid = stats.size > 50000;
      
      if (isValid) {
        console.log(`  ✅ ${expected} (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`  ⚠️  ${expected} (TOO SMALL: ${stats.size} bytes)`);
        allValid = false;
      }
    } else {
      console.log(`  ❌ ${expected} (MISSING)`);
      allValid = false;
    }
  }
  
  return allValid;
}

async function main() {
  const args = process.argv.slice(2);
  const tierArg = args.find(arg => arg.startsWith('--tier='))?.split('=')[1] || 'architect';
  const noClean = args.includes('--no-clean');
  
  console.log('✨ PDF GENERATION BRIDGE ✨');
  console.log('════════════════════════════════════════════════════════════════════');
  
  const success = runBuild(tierArg, !noClean);
  
  if (success) {
    const verified = verifyTierFiles(tierArg);
    
    console.log('\n════════════════════════════════════════════════════════════════════');
    if (verified) {
      console.log(`✅ Tier ${tierArg.toUpperCase()} completed successfully!`);
    } else {
      console.log(`⚠️  Tier ${tierArg.toUpperCase()} completed with issues`);
    }
  } else {
    console.log('\n❌ Build failed');
  }
  
  console.log('════════════════════════════════════════════════════════════════════');
}

if (require.main === module) {
  main().catch(console.error);
}