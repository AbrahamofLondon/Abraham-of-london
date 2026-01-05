// scripts/pdf/generate-legacy-canvas.ts - ENHANCED ORCHESTRATOR
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TIER_CONFIG, mapTierToLegacy, getDisplayName, generateFilename } from './config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GenerationOptions {
  tier: string;
  quality: 'premium' | 'enterprise';
  formats: string[];
  outputDir: string;
  verbose: boolean;
  clean: boolean;
  interactive: boolean;
  watermark: boolean;
}

class PDFOrchestrator {
  private options: GenerationOptions;
  private startTime: number;

  constructor(options: Partial<GenerationOptions> = {}) {
    this.options = {
      tier: 'premium',
      quality: 'premium',
      formats: ['A4', 'Letter', 'A3'],
      outputDir: path.join(process.cwd(), 'public/assets/downloads'),
      verbose: false,
      clean: true,
      interactive: true,
      watermark: true,
      ...options
    };
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('✨ ABRAHAM OF LONDON - PREMIUM PDF ORCHESTRATOR ✨');
    console.log('════════════════════════════════════════════════════════════════════');
    
    console.log(`🎯 Tier: ${getDisplayName(this.options.tier)}`);
    console.log(`🏆 Quality: ${this.options.quality.toUpperCase()}`);
    console.log(`📄 Formats: ${this.options.formats.join(', ')}`);
    console.log(`📁 Output: ${this.options.outputDir}`);
    console.log(`🧹 Clean: ${this.options.clean}`);
    console.log('════════════════════════════════════════════════════════════════════\n');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
      console.log('📁 Created output directory');
    }
    
    // Clean if requested
    if (this.options.clean) {
      await this.cleanOutput();
    }
  }

  async cleanOutput() {
    console.log('🧹 Cleaning output directory...');
    
    try {
      const files = fs.readdirSync(this.options.outputDir);
      const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
      
      // Only clean files for THIS specific tier to avoid conflicts
      const tierLower = this.options.tier.toLowerCase();
      const filesToClean = pdfFiles.filter(f => 
        f.includes(`-${tierLower}.pdf`) || 
        (tierLower === 'premium' && f.includes('-alt.pdf'))
      );
      
      if (filesToClean.length === 0) {
        console.log('   No existing files to clean for this tier\n');
        return;
      }
      
      let cleanedCount = 0;
      for (const file of filesToClean) {
        try {
          fs.unlinkSync(path.join(this.options.outputDir, file));
          console.log(`   ✅ Removed: ${file}`);
          cleanedCount++;
        } catch (error) {
          console.log(`   ❌ Failed to remove: ${file}`);
        }
      }
      
      console.log(`\n✅ Cleaned ${cleanedCount} files\n`);
    } catch (error: any) {
      console.log(`⚠️  Cleanup failed: ${error.message}\n`);
    }
  }

  async generate() {
    console.log('🚀 Starting PDF generation...\n');
    
    const { tier, quality, formats, verbose } = this.options;
    
    // Map tier to legacy system if needed
    const legacyTier = mapTierToLegacy(tier);
    
    // Generate each format
    for (const format of formats) {
      console.log(`🎨 Generating ${format}...`);
      
      try {
        const command = `npx tsx "${path.join(__dirname, '..', 'generate-legacy-canvas.ts')}" ${format} ${quality} ${tier}`;
        
        if (verbose) {
          console.log(`   Command: ${command}`);
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
        
        console.log(`   ✅ ${format} generated\n`);
      } catch (error: any) {
        console.error(`   ❌ ${format} failed: ${error.message}`);
        
        // Try alternative method
        try {
          await this.generateFallback(format);
          console.log(`   ✅ ${format} (fallback) generated\n`);
        } catch (fallbackError: any) {
          console.error(`   ❌ ${format} fallback failed: ${fallbackError.message}\n`);
        }
      }
    }
  }

  async generateFallback(format: string) {
    // Simple fallback generation
    const { tier, quality, outputDir } = this.options;
    const filename = generateFilename(format as any, quality, tier);
    const filePath = path.join(outputDir, filename);
    
    // Create a simple PDF (in production, use a real PDF library)
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
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(Legacy Architecture Canvas) Tj
0 -30 Td
/F1 12 Tf
(Tier: ${getDisplayName(tier)}) Tj
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

  async verify() {
    console.log('🔍 Verifying generated files...\n');
    
    const { tier, formats, outputDir } = this.options;
    const tierLower = tier.toLowerCase() as keyof typeof TIER_CONFIG.expectedFiles;
    const expectedFiles = TIER_CONFIG.expectedFiles[tierLower] || [];
    
    let allValid = true;
    
    // Check for expected files
    console.log('📋 Expected files:');
    for (const expectedFile of expectedFiles) {
      const filePath = path.join(outputDir, expectedFile);
      const exists = fs.existsSync(filePath);
      
      if (exists) {
        const stats = fs.statSync(filePath);
        const isValid = stats.size > 50000; // At least 50KB
        
        if (isValid) {
          console.log(`   ✅ ${expectedFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
          console.log(`   ⚠️  ${expectedFile} (TOO SMALL: ${stats.size} bytes)`);
          allValid = false;
        }
      } else {
        // Check for alternative naming
        const files = fs.readdirSync(outputDir);
        const found = files.find(f => 
          f.includes(tierLower) && 
          expectedFile.replace(tierLower, '').includes(f.replace(tierLower, '').slice(0, 20))
        );
        
        if (found) {
          console.log(`   ⚠️  ${expectedFile} (FOUND AS: ${found})`);
        } else {
          console.log(`   ❌ ${expectedFile} (MISSING)`);
          allValid = false;
        }
      }
    }
    
    // Check format coverage
    console.log('\n🎯 Format coverage:');
    for (const format of formats) {
      const formatLower = format.toLowerCase();
      const files = fs.readdirSync(outputDir);
      const found = files.some(f => 
        f.includes(`-${formatLower}-`) && 
        f.includes(`-${tierLower}.pdf`)
      );
      
      if (found) {
        console.log(`   ✅ ${format} format found`);
      } else {
        console.log(`   ❌ ${format} format missing`);
        allValid = false;
      }
    }
    
    return allValid;
  }

  async run() {
    await this.initialize();
    await this.generate();
    const success = await this.verify();
    
    const duration = Date.now() - this.startTime;
    
    console.log('\n════════════════════════════════════════════════════════════════════');
    if (success) {
      console.log(`✅ GENERATION COMPLETED SUCCESSFULLY! (${duration}ms)`);
    } else {
      console.log(`⚠️  GENERATION COMPLETED WITH ISSUES (${duration}ms)`);
    }
    console.log('════════════════════════════════════════════════════════════════════');
    
    return success;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const options: Partial<GenerationOptions> = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    clean: !args.includes('--no-clean')
  };
  
  // Parse tier
  const tierArg = args.find(arg => arg.startsWith('--tier='));
  if (tierArg) {
    options.tier = tierArg.split('=')[1];
  } else if (args[0] && !args[0].startsWith('-')) {
    options.tier = args[0];
  }
  
  // Parse quality
  const qualityArg = args.find(arg => arg.startsWith('--quality='));
  if (qualityArg) {
    options.quality = qualityArg.split('=')[1] as any;
  }
  
  // Parse formats
  const formatsArg = args.find(arg => arg.startsWith('--formats='));
  if (formatsArg) {
    options.formats = formatsArg.split('=')[1].split(',').map(f => f.trim());
  }
  
  // Parse output directory
  const outputArg = args.find(arg => arg.startsWith('--output='));
  if (outputArg) {
    options.outputDir = path.resolve(outputArg.split('=')[1]);
  }
  
  const orchestrator = new PDFOrchestrator(options);
  const success = await orchestrator.run();
  
  process.exit(success ? 0 : 1);
}

// Execute if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('❌ Orchestrator failed:', error);
    process.exit(1);
  });
}

export { PDFOrchestrator };