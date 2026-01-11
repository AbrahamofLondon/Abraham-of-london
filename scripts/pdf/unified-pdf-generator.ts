// scripts/pdf/unified-pdf-generator.ts
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const program = new Command();

program
  .name('unified-pdf-generator')
  .description('Premium PDF generator for all tiers with enhanced visual output')
  .version('1.1.0');

program
  .option('-t, --tier <tier>', 'Tier to generate (architect, member, free, all)', 'all')
  .option('-q, --quality <quality>', 'PDF quality (premium, enterprise)', 'premium')
  .option('-f, --formats <formats>', 'Formats (A4,Letter,A3)', 'A4,Letter,A3')
  .option('-o, --output <output>', 'Output directory', './public/assets/downloads')
  .option('-c, --clean', 'Clean output before generation', false)
  .option('-v, --verbose', 'Verbose output', false)
  .option('--no-clean', 'Skip cleaning (safer)', false);

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
    console.log('✨ PREMIUM PDF GENERATOR ✨');
    console.log('════════════════════════════════════════════════════════════════════');
    
    // Enhanced display with colors and better formatting
    console.log(`🎯 \x1b[1;36mTier:\x1b[0m \x1b[1;33m${this.options.tier}\x1b[0m`);
    console.log(`🏆 \x1b[1;36mQuality:\x1b[0m \x1b[1;33m${this.options.quality}\x1b[0m`);
    console.log(`📄 \x1b[1;36mFormats:\x1b[0m \x1b[1;33m${this.options.formats.join(', ')}\x1b[0m`);
    console.log(`📁 \x1b[1;36mOutput:\x1b[0m \x1b[1;33m${this.options.output}\x1b[0m`);
    console.log(`🧹 \x1b[1;36mClean:\x1b[0m \x1b[1;33m${this.options.clean ? 'YES' : 'NO'}\x1b[0m`);
    
    // Ensure output directory exists
    if (!fs.existsSync(this.options.output)) {
      fs.mkdirSync(this.options.output, { recursive: true });
      console.log('\x1b[32m📁 Created output directory\x1b[0m');
    }
    
    // Safely clean output if requested
    if (this.options.clean) {
      await this.cleanOutputSafely();
    }
    
    console.log('════════════════════════════════════════════════════════════════════\n');
  }

  async cleanOutputSafely() {
    console.log('\x1b[33m🧹 Safe cleaning of output directory...\x1b[0m');
    
    // Don't delete anything if directory doesn't exist
    if (!fs.existsSync(this.options.output)) {
      console.log('  📁 Output directory does not exist, skipping clean');
      return;
    }
    
    const files = fs.readdirSync(this.options.output);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('  ✅ No PDF files found to clean');
      return;
    }
    
    const tiers = this.options.tier === 'all' 
      ? ['architect', 'member', 'free'] 
      : [this.options.tier as Tier];
    
    let filesToDelete: string[] = [];
    
    // Build list of files that match current tier/quality/formats
    for (const tier of tiers) {
      for (const format of this.options.formats) {
        const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${this.options.quality}-${tier}.pdf`;
        if (pdfFiles.includes(filename)) {
          filesToDelete.push(filename);
        }
      }
    }
    
    // Delete only those specific files with age check
    let cleaned = 0;
    let skipped = 0;
    
    for (const filename of filesToDelete) {
      try {
        const filePath = path.join(this.options.output, filename);
        const stats = fs.statSync(filePath);
        const fileAgeMinutes = (Date.now() - stats.mtimeMs) / (1000 * 60);
        
        // Only delete files older than 5 minutes to prevent accidental deletion
        if (fileAgeMinutes > 5) {
          // Create backup copy in temp directory before deletion
          const tempBackup = path.join(require('os').tmpdir(), 'pdf-backup', filename);
          require('fs').mkdirSync(path.dirname(tempBackup), { recursive: true });
          fs.copyFileSync(filePath, tempBackup);
          
          fs.unlinkSync(filePath);
          console.log(`  \x1b[32m✅ Removed: ${filename} (${Math.round(fileAgeMinutes)}min old)\x1b[0m`);
          cleaned++;
        } else {
          console.log(`  \x1b[33m⏭️  Skipped: ${filename} (too recent, ${Math.round(fileAgeMinutes)}min)\x1b[0m`);
          skipped++;
        }
      } catch (error: any) {
        console.log(`  \x1b[31m❌ Failed to remove: ${filename} (${error.message})\x1b[0m`);
      }
    }
    
    console.log(`\n\x1b[32m✅ Cleaned ${cleaned} outdated files, skipped ${skipped} recent ones\x1b[0m\n`);
  }

  async generateTier(tier: Tier) {
    console.log(`\x1b[1;35m🚀 Generating tier: ${tier.toUpperCase()}\x1b[0m`);
    
    // List current files before generation for potential restore
    const filesBefore = fs.existsSync(this.options.output) 
      ? fs.readdirSync(this.options.output).filter(f => f.includes(`-${tier}.pdf`))
      : [];
    
    if (filesBefore.length > 0 && this.options.verbose) {
      console.log(`  📋 Found ${filesBefore.length} existing files for tier ${tier}`);
    }
    
    const legacyTier = this.tierMapping[tier];
    const quality = this.options.quality;
    const formats = this.options.formats;
    
    const generatedFiles: string[] = [];
    
    for (const format of formats) {
      console.log(`  \x1b[36m📄 Generating ${format}...\x1b[0m`);
      
      try {
        const command = `npx tsx scripts/generate-legacy-canvas.ts ${format} ${quality} ${tier}`;
        
        if (this.options.verbose) {
          console.log(`    Command: \x1b[90m${command}\x1b[0m`);
        }
        
        // Capture output for better display
        const output = execSync(command, {
          encoding: 'utf8',
          cwd: process.cwd(),
          env: {
            ...process.env,
            PDF_TIER: tier,
            PDF_QUALITY: quality,
            PDF_FORMAT: format,
            FORCE_COLOR: '1'
          }
        });
        
        // Parse and display the output nicely
        const lines = output.trim().split('\n');
        for (const line of lines) {
          if (line.includes('KB') || line.includes('LAC-')) {
            console.log(`    \x1b[32m✅ ${line.trim()}\x1b[0m`);
          } else if (!line.includes('legacy-canvas')) {
            console.log(`    \x1b[90m${line}\x1b[0m`);
          }
        }
        
        const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${quality}-${tier}.pdf`;
        generatedFiles.push(filename);
        
      } catch (error: any) {
        console.log(`    \x1b[31m❌ ${format} failed: ${error.message}\x1b[0m`);
        
        // Check if the file was partially created
        const expectedFile = path.join(
          this.options.output, 
          `legacy-architecture-canvas-${format.toLowerCase()}-${quality}-${tier}.pdf`
        );
        
        if (fs.existsSync(expectedFile)) {
          const stats = fs.statSync(expectedFile);
          if (stats.size < 10000) { // Less than 10KB likely corrupted
            console.log(`    \x1b[33m⚠️  Removing corrupted file (${stats.size} bytes)\x1b[0m`);
            fs.unlinkSync(expectedFile);
          }
        }
        
        // Try fallback generation
        try {
          console.log(`    \x1b[33m🔄 Trying fallback generation for ${format}...\x1b[0m`);
          await this.generateFallback(format, tier, quality);
          console.log(`    \x1b[32m✅ ${format} (fallback) generated\x1b[0m`);
        } catch (fallbackError: any) {
          console.log(`    \x1b[31m❌ ${format} fallback failed: ${fallbackError.message}\x1b[0m`);
        }
      }
    }
    
    // Generate standalone editorial PDF
    await this.generateStandalonePDF(tier, quality);
    
    console.log(`\n\x1b[32m✅ Tier ${tier.toUpperCase()} completed\x1b[0m\n`);
    return generatedFiles;
  }

  async generateStandalonePDF(tier: Tier, quality: Quality) {
    console.log(`  \x1b[36m📖 Generating standalone editorial...\x1b[0m`);
    
    try {
      const command = `npx tsx scripts/generate-standalone-pdf.tsx ${quality} ${tier}`;
      
      if (this.options.verbose) {
        console.log(`    Command: \x1b[90m${command}\x1b[0m`);
      }
      
      const output = execSync(command, {
        encoding: 'utf8',
        cwd: process.cwd(),
        env: {
          ...process.env,
          PDF_TIER: tier,
          PDF_QUALITY: quality,
          FORCE_COLOR: '1'
        }
      });
      
      // Display success message
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.includes('Success!') || line.includes('PDF saved to:')) {
          console.log(`    \x1b[32m✅ ${line.trim()}\x1b[0m`);
        } else if (line.includes('File size:') || line.includes('Pages:')) {
          console.log(`    \x1b[90m${line.trim()}\x1b[0m`);
        }
      }
      
    } catch (error: any) {
      console.log(`    \x1b[33m⚠️  Standalone PDF generation skipped: ${error.message}\x1b[0m`);
    }
  }

  async generateFallback(format: string, tier: Tier, quality: Quality) {
    const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${quality}-${tier}.pdf`;
    const filePath = path.join(this.options.output, filename);
    
    // Create a simple but professional fallback PDF using pdf-lib
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]); // A4
      
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      
      // Add professional metadata
      doc.setTitle(`Legacy Architecture Canvas - ${tier}`);
      doc.setAuthor('Abraham of London');
      doc.setSubject('Strategic Framework');
      doc.setKeywords(['legacy', 'architecture', 'canvas', tier, quality]);
      
      // Professional header
      page.drawText('LEGACY ARCHITECTURE CANVAS', {
        x: 50,
        y: 750,
        size: 24,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      page.drawText(`Tier: ${tier.toUpperCase()} | Format: ${format} | Quality: ${quality}`, {
        x: 50,
        y: 720,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      page.drawText('Fallback Document - Please regenerate using primary generator', {
        x: 50,
        y: 700,
        size: 9,
        font: font,
        color: rgb(0.6, 0.2, 0.2),
      });
      
      // Add some content
      const content = [
        'This is a fallback document generated because the primary',
        'PDF generator encountered an issue. The full-featured version',
        'with interactive form fields and enhanced formatting should',
        'be available when the system is fully operational.',
        '',
        `Tier: ${tier}`,
        `Format: ${format}`,
        `Quality: ${quality}`,
        `Generated: ${new Date().toLocaleDateString()}`,
      ];
      
      content.forEach((line, i) => {
        page.drawText(line, {
          x: 50,
          y: 650 - (i * 20),
          size: 11,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
      });
      
      const pdfBytes = await doc.save();
      fs.writeFileSync(filePath, pdfBytes);
      
    } catch (error) {
      // Ultimate fallback: create a minimal PDF
      const minimalPDF = `%PDF-1.4
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
/Resources << /Font << /F1 5 0 R >> >>
>>
endobj

4 0 obj
<< /Length 200 >>
stream
BT
/F1 24 Tf
100 700 Td
(Legacy Architecture Canvas) Tj
0 -30 Td
/F1 12 Tf
(Tier: ${tier.toUpperCase()}) Tj
0 -20 Td
(Format: ${format}) Tj
0 -20 Td
(Quality: ${quality}) Tj
0 -20 Td
(Date: ${new Date().toLocaleDateString()}) Tj
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
0000002000 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
2500
%%EOF`;
      
      fs.writeFileSync(filePath, minimalPDF);
    }
  }

  async verifyTier(tier: Tier): Promise<boolean> {
    console.log(`\x1b[36m🔍 Verifying tier: ${tier}\x1b[0m`);
    
    if (!fs.existsSync(this.options.output)) {
      console.log(`  \x1b[31m❌ Output directory does not exist\x1b[0m`);
      return false;
    }
    
    const files = fs.readdirSync(this.options.output);
    const expectedFiles = this.options.formats.map(f => 
      `legacy-architecture-canvas-${f.toLowerCase()}-${this.options.quality}-${tier}.pdf`
    );
    
    let allValid = true;
    let validCount = 0;
    
    for (const expected of expectedFiles) {
      if (files.includes(expected)) {
        const filePath = path.join(this.options.output, expected);
        const stats = fs.statSync(filePath);
        
        // Check file size based on quality
        let minSize, maxSize;
        switch (this.options.quality) {
          case 'enterprise':
            minSize = 50000; // 50KB minimum for enterprise
            maxSize = 5000000; // 5MB maximum
            break;
          case 'premium':
            minSize = 30000; // 30KB minimum for premium
            maxSize = 2000000; // 2MB maximum
            break;
          default:
            minSize = 20000; // 20KB minimum
            maxSize = 1000000; // 1MB maximum
        }
        
        const isValid = stats.size >= minSize && stats.size <= maxSize;
        const sizeDisplay = (stats.size / 1024).toFixed(1);
        
        if (isValid) {
          console.log(`  \x1b[32m✅ ${expected} (${sizeDisplay} KB)\x1b[0m`);
          validCount++;
        } else {
          const issue = stats.size < minSize ? 'TOO SMALL' : 'TOO LARGE';
          console.log(`  \x1b[33m⚠️  ${expected} (${sizeDisplay} KB - ${issue})\x1b[0m`);
          allValid = false;
        }
      } else {
        console.log(`  \x1b[31m❌ ${expected} (MISSING)\x1b[0m`);
        allValid = false;
      }
    }
    
    // Also check for standalone PDF
    const standaloneFile = `ultimate-purpose-of-man-${this.options.quality}.pdf`;
    if (files.includes(standaloneFile)) {
      const stats = fs.statSync(path.join(this.options.output, standaloneFile));
      console.log(`  \x1b[32m✅ ${standaloneFile} (${(stats.size / 1024).toFixed(1)} KB)\x1b[0m`);
      validCount++;
    }
    
    console.log(`  \x1b[90mValid files: ${validCount}/${expectedFiles.length + 1}\x1b[0m`);
    return allValid;
  }

  async run() {
    await this.initialize();
    
    const tiers: Tier[] = this.options.tier === 'all' 
      ? ['architect', 'member', 'free'] 
      : [this.options.tier as Tier];
    
    const results: Record<string, boolean> = {};
    
    for (const tier of tiers) {
      console.log('\n' + '\x1b[1;37m' + '='.repeat(60) + '\x1b[0m');
      console.log(`\x1b[1;34m🏗️  BUILDING: ${tier.toUpperCase()}\x1b[0m`);
      console.log('\x1b[1;37m' + '='.repeat(60) + '\x1b[0m');
      
      const filesGenerated = await this.generateTier(tier);
      const verified = await this.verifyTier(tier);
      results[tier] = verified;
      
      console.log('\x1b[1;37m' + '='.repeat(60) + '\x1b[0m');
      console.log(verified ? 
        `\x1b[1;32m✅ ${tier.toUpperCase()} VERIFIED\x1b[0m` : 
        `\x1b[1;33m⚠️  ${tier.toUpperCase()} HAS ISSUES\x1b[0m`);
      console.log('\x1b[1;37m' + '='.repeat(60) + '\x1b[0m');
      
      if (this.options.verbose && filesGenerated.length > 0) {
        console.log(`\x1b[90mGenerated files for ${tier}: ${filesGenerated.join(', ')}\x1b[0m`);
      }
      
      if (tier !== tiers[tiers.length - 1]) {
        console.log('\n\n');
      }
    }
    
    this.printSummary(results);
    
    const allSuccess = Object.values(results).every(v => v);
    return allSuccess;
  }

  printSummary(results: Record<string, boolean>) {
    console.log('\n\x1b[1;36m📊 GENERATION SUMMARY\x1b[0m');
    console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');
    
    const successful = Object.keys(results).filter(t => results[t]);
    const failed = Object.keys(results).filter(t => !results[t]);
    
    console.log(`\x1b[32m✅ Successful: ${successful.length}/${Object.keys(results).length}\x1b[0m`);
    
    if (failed.length > 0) {
      console.log(`\x1b[31m❌ Failed: ${failed.length}/${Object.keys(results).length}\x1b[0m`);
      console.log(`\x1b[33m   Failed tiers: ${failed.join(', ')}\x1b[0m`);
    }
    
    // Show directory contents
    if (fs.existsSync(this.options.output)) {
      const files = fs.readdirSync(this.options.output);
      const pdfCount = files.filter(f => f.endsWith('.pdf')).length;
      console.log(`\x1b[90m📁 Output directory: ${this.options.output}\x1b[0m`);
      console.log(`\x1b[90m📄 Total PDF files: ${pdfCount}\x1b[0m`);
    }
    
    if (successful.length === Object.keys(results).length) {
      console.log('\n\x1b[1;32m🎉 ALL TIERS GENERATED SUCCESSFULLY!\x1b[0m');
    } else {
      console.log('\n\x1b[33m⚠️  Some tiers failed - check logs above\x1b[0m');
    }
    
    console.log('\x1b[1;37m════════════════════════════════════════════════════════════════════\x1b[0m');
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
    console.error('\x1b[1;31m❌ Generation failed:\x1b[0m', error.message);
    if (opts.verbose && error.stack) {
      console.error('\x1b[90m' + error.stack + '\x1b[0m');
    }
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