// scripts/pdf/build-orchestrator.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PDF_CONFIG, type BuildTier } from './constants';

class BuildOrchestrator {
  private outputDir: string;

  constructor() {
    this.outputDir = path.resolve(PDF_CONFIG.outputDir);
  }

  async cleanTier(tier: BuildTier) {
    console.log(`🧹 Cleaning files for tier: ${tier}`);
    
    if (!fs.existsSync(this.outputDir)) {
      console.log('  📁 Output directory does not exist');
      return;
    }

    const files = fs.readdirSync(this.outputDir);
    const filesToDelete = files.filter(f => 
      f.toLowerCase().includes(`-${tier}.pdf`) || 
      f.includes('-alt.pdf') // Clean any alt files
    );

    if (filesToDelete.length === 0) {
      console.log('  ✅ No files to clean');
      return;
    }

    console.log(`  Removing ${filesToDelete.length} files...`);
    for (const file of filesToDelete) {
      try {
        fs.unlinkSync(path.join(this.outputDir, file));
        console.log(`    ✅ ${file}`);
      } catch (error: any) {
        console.log(`    ❌ ${file}: ${error.message}`);
      }
    }
  }

  async generateTier(tier: BuildTier) {
    console.log(`\n🚀 Generating tier: ${tier}`);
    
    const displayTier = PDF_CONFIG.tiers[tier].display;
    
    console.log(`  📊 Tier: ${tier} (${displayTier})`);
    console.log('  📄 Formats: A4, Letter, A3');
    console.log('  🏆 Quality: premium');
    
    try {
      // Use the updated legacy canvas generator
      execSync(`npx tsx scripts/generate-legacy-canvas.ts all premium ${tier}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          PDF_TIER: tier,
          PDF_QUALITY: 'premium',
          FORCE_COLOR: '1'
        }
      });
      
      console.log(`\n  ✅ Tier ${tier} generation completed`);
      return true;
    } catch (error: any) {
      console.error(`\n  ❌ Tier ${tier} failed: ${error.message}`);
      return false;
    }
  }

  async verifyTier(tier: BuildTier) {
    console.log(`\n🔍 Verifying tier: ${tier}`);
    
    if (!fs.existsSync(this.outputDir)) {
      console.log('  ❌ Output directory does not exist');
      return false;
    }

    const files = fs.readdirSync(this.outputDir);
    const expectedFiles = PDF_CONFIG.expectedFiles(tier);
    
    let allValid = true;
    
    for (const expected of expectedFiles) {
      if (files.includes(expected)) {
        const stats = fs.statSync(path.join(this.outputDir, expected));
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

  async buildTier(tier: BuildTier, cleanFirst: boolean = true) {
    console.log('\n' + '='.repeat(60));
    console.log(`🏗️  BUILDING TIER: ${tier.toUpperCase()}`);
    console.log('='.repeat(60));
    
    if (cleanFirst) {
      await this.cleanTier(tier);
    }
    
    const generated = await this.generateTier(tier);
    
    if (generated) {
      const verified = await this.verifyTier(tier);
      
      console.log('\n' + '='.repeat(60));
      if (verified) {
        console.log(`✅ TIER ${tier.toUpperCase()} BUILD SUCCESSFUL`);
      } else {
        console.log(`⚠️  TIER ${tier.toUpperCase()} BUILD COMPLETED WITH ISSUES`);
      }
      console.log('='.repeat(60));
      
      return verified;
    }
    
    return false;
  }

  async buildAll() {
    console.log('✨ LEGACY ARCHITECTURE CANVAS - FULL BUILD ✨');
    console.log('════════════════════════════════════════════════════════════════════');
    
    const tiers: BuildTier[] = ['architect', 'member', 'free'];
    const results: Record<string, boolean> = {};
    
    for (const tier of tiers) {
      const success = await this.buildTier(tier, true);
      results[tier] = success;
      
      // Small delay between tiers
      if (tier !== tiers[tiers.length - 1]) {
        console.log('\n\n');
      }
    }
    
    // Final verification
    console.log('\n📊 FINAL BUILD SUMMARY');
    console.log('════════════════════════════════════════════════════════════════════');
    
    const successfulTiers = Object.keys(results).filter(tier => results[tier]);
    const failedTiers = Object.keys(results).filter(tier => !results[tier]);
    
    console.log(`✅ Successful tiers: ${successfulTiers.length}/${tiers.length}`);
    console.log(`❌ Failed tiers: ${failedTiers.length}/${tiers.length}`);
    
    if (successfulTiers.length === tiers.length) {
      console.log('\n🎉 ALL TIERS BUILT SUCCESSFULLY!');
    } else {
      console.log('\n⚠️  Some tiers failed to build correctly');
      console.log('   Failed:', failedTiers.join(', '));
    }
    
    console.log('════════════════════════════════════════════════════════════════════');
    
    return successfulTiers.length === tiers.length;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const tierArg = args.find(arg => arg.startsWith('--tier='))?.split('=')[1];
  const noClean = args.includes('--no-clean');
  
  const orchestrator = new BuildOrchestrator();
  
  if (tierArg && PDF_CONFIG.tiers[tierArg as BuildTier]) {
    await orchestrator.buildTier(tierArg as BuildTier, !noClean);
  } else {
    await orchestrator.buildAll();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
}

export { BuildOrchestrator };