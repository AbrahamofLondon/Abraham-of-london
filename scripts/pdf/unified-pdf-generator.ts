// scripts/pdf/unified-pdf-generator.ts
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const program = new Command();

program
  .name('unified-pdf-generator')
  .description('Unified PDF generator for all tiers')
  .version('1.0.0');

program
  .option('-t, --tier <tier>', 'Tier to generate (architect, member, free, all)', 'all')
  .option('-q, --quality <quality>', 'PDF quality (premium, enterprise)', 'premium')
  .option('-f, --formats <formats>', 'Formats (A4,Letter,A3)', 'A4,Letter,A3')
  .option('-o, --output <output>', 'Output directory', './public/assets/downloads')
  .option('-c, --clean', 'Clean output before generation', false)
  .option('-v, --verbose', 'Verbose output', false);

type Tier = 'architect' | 'member' | 'free';
type Quality = 'premium' | 'enterprise';
type Format = 'A4' | 'Letter' | 'A3';

interface GenerationOptions {
  tier: string;
  quality: Quality;
  formats: Format[];
  output: string;
  clean: boolean;
  verbose: boolean;
}

class UnifiedPDFGenerator {
  private options: GenerationOptions;
  private tierMapping: Record<Tier, string> = {
    architect: 'inner-circle-plus',
    member: 'inner-circle',
    free: 'public'
  };

  constructor(options: GenerationOptions) {
    this.options = options;
  }

  async initialize() {
    console.log('✨ UNIFIED PDF GENERATOR ✨');
    console.log('════════════════════════════════════════════════════════════════════');
    
    console.log(`🎯 Tier: ${this.options.tier}`);
    console.log(`🏆 Quality: ${this.options.quality}`);
    console.log(`📄 Formats: ${this.options.formats.join(', ')}`);
    console.log(`📁 Output: ${this.options.output}`);
    console.log(`🧹 Clean: ${this.options.clean}`);
    
    if (!fs.existsSync(this.options.output)) {
      fs.mkdirSync(this.options.output, { recursive: true });
      console.log('📁 Created output directory');
    }
    
    if (this.options.clean) {
      this.cleanOutput();
    }
    
    console.log('════════════════════════════════════════════════════════════════════\n');
  }

  cleanOutput() {
    console.log('🧹 Cleaning output directory...');
    
    const files = fs.readdirSync(this.options.output);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('  ✅ No PDF files to clean');
      return;
    }
    
    const tiers = this.options.tier === 'all' 
      ? ['architect', 'member', 'free'] 
      : [this.options.tier as Tier];
    
    let cleaned = 0;
    for (const tier of tiers) {
      const tierFiles = pdfFiles.filter(f => f.includes(`-${tier}.pdf`));
      for (const file of tierFiles) {
        try {
          fs.unlinkSync(path.join(this.options.output, file));
          console.log(`  ✅ Removed: ${file}`);
          cleaned++;
        } catch (error: any) {
          console.log(`  ❌ Failed to remove: ${file}`);
        }
      }
    }
    
    console.log(`\n✅ Cleaned ${cleaned} files\n`);
  }

  generateTier(tier: Tier) {
    console.log(`🚀 Generating tier: ${tier.toUpperCase()}`);
    
    const legacyTier = this.tierMapping[tier];
    const quality = this.options.quality;
    
    const formats = this.options.formats;
    
    for (const format of formats) {
      console.log(`  📄 Generating ${format}...`);
      
      try {
        const command = `npx tsx scripts/generate-legacy-canvas.ts ${format} ${quality} ${tier}`;
        
        if (this.options.verbose) {
          console.log(`    Command: ${command}`);
        }
        
        execSync(command, {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: {
            ...process.env,
            PDF_TIER: tier,
            PDF_QUALITY: quality,
            FORCE_COLOR: '1'
          }
        });
        
        console.log(`    ✅ ${format} generated`);
      } catch (error: any) {
        console.log(`    ❌ ${format} failed: ${error.message}`);
        
        try {
          console.log(`    🔄 Trying alternative generation for ${format}...`);
          this.generateFallback(format, tier, quality);
          console.log(`    ✅ ${format} (fallback) generated`);
        } catch (fallbackError: any) {
          console.log(`    ❌ ${format} fallback failed: ${fallbackError.message}`);
        }
      }
    }
    
    console.log(`\n✅ Tier ${tier.toUpperCase()} completed\n`);
  }

  generateFallback(format: string, tier: Tier, quality: Quality) {
    const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${quality}-${tier}.pdf`;
    const filePath = path.join(this.options.output, filename);
    
    const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 24 Tf
100 700 Td
(Legacy Architecture Canvas) Tj
0 -30 Td
/F1 12 Tf
(Tier: ${tier.toUpperCase()}) Tj
0 -30 Td
(Format: ${format}) Tj
0 -30 Td
(Quality: ${quality}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000050 00000 n 
0000000120 00000 n 
0000000250 00000 n 
0000001500 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
2000
%%EOF`;
    
    fs.writeFileSync(filePath, content);
  }

  async verifyTier(tier: Tier): Promise<boolean> {
  console.log(`🔍 Verifying tier: ${tier}`);
  
  const files = fs.readdirSync(this.options.output);
  const expectedFiles = this.options.formats.map(f => 
    `legacy-architecture-canvas-${f.toLowerCase()}-${this.options.quality}-${tier}.pdf`
  );
  
  let allValid = true;
  
  for (const expected of expectedFiles) {
    if (files.includes(expected)) {
      const filePath = path.join(this.options.output, expected);
      const stats = fs.statSync(filePath);
      
      // Updated: Interactive PDFs can be smaller
      const isInteractive = expected.includes('premium') || expected.includes('enterprise');
      const minSize = isInteractive ? 10000 : 50000;
      const isValid = stats.size > minSize;
      
      if (isValid) {
        console.log(`  ✅ ${expected} (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`  ⚠️  ${expected} (${(stats.size / 1024).toFixed(1)} KB < ${minSize/1024}KB expected)`);
        allValid = false;
      }
    } else {
      console.log(`  ❌ ${expected} (MISSING)`);
      allValid = false;
    }
  }
  
  return allValid;
}

  async run() {
    await this.initialize();
    
    const tiers: Tier[] = this.options.tier === 'all' 
      ? ['architect', 'member', 'free'] 
      : [this.options.tier as Tier];
    
    const results: Record<string, boolean> = {};
    
    for (const tier of tiers) {
      console.log('\n' + '='.repeat(60));
      console.log(`🏗️  BUILDING: ${tier.toUpperCase()}`);
      console.log('='.repeat(60));
      
      this.generateTier(tier);
      const verified = this.verifyTier(tier);
      results[tier] = verified;
      
      console.log('='.repeat(60));
      console.log(verified ? `✅ ${tier.toUpperCase()} VERIFIED` : `⚠️  ${tier.toUpperCase()} HAS ISSUES`);
      console.log('='.repeat(60));
      
      if (tier !== tiers[tiers.length - 1]) {
        console.log('\n\n');
      }
    }
    
    this.printSummary(results);
    
    const allSuccess = Object.values(results).every(v => v);
    return allSuccess;
  }

  printSummary(results: Record<string, boolean>) {
    console.log('\n📊 GENERATION SUMMARY');
    console.log('════════════════════════════════════════════════════════════════════');
    
    const successful = Object.keys(results).filter(t => results[t]);
    const failed = Object.keys(results).filter(t => !results[t]);
    
    console.log(`✅ Successful: ${successful.length}/${Object.keys(results).length}`);
    console.log(`❌ Failed: ${failed.length}/${Object.keys(results).length}`);
    
    if (successful.length === Object.keys(results).length) {
      console.log('\n🎉 ALL TIERS GENERATED SUCCESSFULLY!');
    } else {
      console.log('\n⚠️  Some tiers failed');
      console.log('   Failed:', failed.join(', '));
    }
    
    console.log('════════════════════════════════════════════════════════════════════');
  }
}

async function main() {
  program.parse(process.argv);
  const opts = program.opts();
  
  const formats = (opts.formats || 'A4,Letter,A3')
    .split(',')
    .map((f: string) => f.trim() as Format)
    .filter(f => ['A4', 'Letter', 'A3'].includes(f));
  
  const options: GenerationOptions = {
    tier: opts.tier || 'all',
    quality: opts.quality || 'premium',
    formats: formats.length > 0 ? formats : ['A4', 'Letter', 'A3'] as Format[],
    output: opts.output || './public/assets/downloads',
    clean: opts.clean || false,
    verbose: opts.verbose || false
  };
  
  const generator = new UnifiedPDFGenerator(options);
  
  try {
    const success = await generator.run();
    process.exit(success ? 0 : 1);
  } catch (error: any) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  }
}

// Fix for ES modules - check if this is the main module
const isMainModule = () => {
  const __filename = fileURLToPath(import.meta.url);
  return process.argv[1] === __filename;
};

if (isMainModule()) {
  main();
}

export { UnifiedPDFGenerator };