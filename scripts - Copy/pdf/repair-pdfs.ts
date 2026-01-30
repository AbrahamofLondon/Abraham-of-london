// scripts/pdf/repair-pdfs.ts
import fs from 'fs';
import path from 'path';

const downloadDir = path.join(process.cwd(), 'public/assets/downloads');

interface PDFFile {
  name: string;
  path: string;
  size: number;
  valid: boolean;
  tier: string;
  format: string;
}

class PDFRepair {
  private files: PDFFile[] = [];

  scan() {
    console.log('🔍 SCANNING PDF FILES');
    console.log('════════════════════════════════════════════════════════════════════');
    
    if (!fs.existsSync(downloadDir)) {
      console.log('❌ Download directory does not exist');
      return [];
    }
    
    const fileNames = fs.readdirSync(downloadDir);
    const pdfFileNames = fileNames.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    console.log(`Found ${pdfFileNames.length} PDF files\n`);
    
    this.files = pdfFileNames.map(fileName => {
      const filePath = path.join(downloadDir, fileName);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      const valid = size > 50000;
      
      const tier = this.extractTier(fileName);
      const format = this.extractFormat(fileName);
      
      return {
        name: fileName,
        path: filePath,
        size,
        valid,
        tier,
        format
      };
    });
    
    this.files.forEach(file => {
      const status = file.valid ? '✅' : '❌';
      console.log(`${status} ${file.name.padEnd(70)} ${(file.size / 1024).toFixed(1).padStart(6)} KB`);
    });
    
    return this.files;
  }

  extractTier(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('architect')) return 'architect';
    if (lower.includes('member')) return 'member';
    if (lower.includes('free')) return 'free';
    if (lower.includes('inner-circle-plus')) return 'architect';
    if (lower.includes('inner-circle')) return 'member';
    if (lower.includes('public')) return 'free';
    if (lower.includes('-alt')) return 'unknown';
    return 'unknown';
  }

  extractFormat(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('a4')) return 'A4';
    if (lower.includes('letter')) return 'Letter';
    if (lower.includes('a3')) return 'A3';
    return 'unknown';
  }

  analyze() {
    console.log('\n📊 ANALYSIS REPORT');
    console.log('════════════════════════════════════════════════════════════════════');
    
    const validFiles = this.files.filter(f => f.valid);
    const invalidFiles = this.files.filter(f => !f.valid);
    
    console.log(`Valid PDFs: ${validFiles.length}/${this.files.length}`);
    console.log(`Invalid PDFs: ${invalidFiles.length}/${this.files.length}`);
    
    const tiers = ['architect', 'member', 'free'];
    const formats = ['A4', 'Letter', 'A3'];
    
    console.log('\n🎯 TIER COVERAGE:');
    tiers.forEach(tier => {
      const tierFiles = validFiles.filter(f => f.tier === tier);
      console.log(`  ${tier.toUpperCase().padEnd(10)} ${tierFiles.length}/3 files`);
    });
    
    console.log('\n📄 FORMAT COVERAGE:');
    formats.forEach(format => {
      const formatFiles = validFiles.filter(f => f.format === format);
      console.log(`  ${format.padEnd(10)} ${formatFiles.length}/3 files`);
    });
    
    console.log('\n⚠️  INVALID FILES:');
    if (invalidFiles.length === 0) {
      console.log('  None');
    } else {
      invalidFiles.forEach(file => {
        console.log(`  ${file.name} (${file.size} bytes)`);
      });
    }
  }

  repair() {
    console.log('\n🛠️  REPAIRING BUILD');
    console.log('════════════════════════════════════════════════════════════════════');
    
    const invalidFiles = this.files.filter(f => !f.valid);
    
    invalidFiles.forEach(file => {
      console.log(`❌ ${file.name} is invalid (${file.size} bytes)`);
      try {
        fs.unlinkSync(file.path);
        console.log(`  ✅ Deleted`);
      } catch (error: any) {
        console.log(`  ❌ Failed to delete: ${error.message}`);
      }
    });
    
    const missingFiles = this.checkMissing();
    console.log('\n🔍 MISSING FILES:');
    if (missingFiles.length === 0) {
      console.log('  None');
    } else {
      missingFiles.forEach(file => {
        console.log(`  ❌ ${file.tier}/${file.format}`);
      });
      console.log('\n💡 Run: pnpm pdfs:institutional:cycle');
    }
  }

  checkMissing() {
    const expected = [
      { tier: 'architect', format: 'A4' },
      { tier: 'architect', format: 'Letter' },
      { tier: 'architect', format: 'A3' },
      { tier: 'member', format: 'A4' },
      { tier: 'member', format: 'Letter' },
      { tier: 'member', format: 'A3' },
      { tier: 'free', format: 'A4' },
      { tier: 'free', format: 'Letter' },
      { tier: 'free', format: 'A3' }
    ];
    
    const validFiles = this.files.filter(f => f.valid);
    
    return expected.filter(expectedFile => {
      return !validFiles.some(file => 
        file.tier === expectedFile.tier && 
        file.format === expectedFile.format
      );
    });
  }

  run() {
    console.log('✨ PDF REPAIR TOOL ✨');
    console.log('════════════════════════════════════════════════════════════════════');
    
    this.scan();
    this.analyze();
    this.repair();
    
    console.log('\n✅ REPAIR COMPLETED');
    console.log('════════════════════════════════════════════════════════════════════');
  }
}

function main() {
  const repair = new PDFRepair();
  repair.run();
}

if (require.main === module) {
  main();
}