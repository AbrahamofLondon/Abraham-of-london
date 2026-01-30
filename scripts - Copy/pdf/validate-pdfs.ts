// scripts/pdf/validate-pdfs.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating PDF files...');

// Get command line arguments
const args = process.argv.slice(2);
const checkEmpty = args.includes('--check-empty');
const checkCorrupt = args.includes('--check-corrupt');

// Directory containing PDFs (adjust this path as needed)
const pdfDir = path.join(process.cwd(), 'public', 'pdfs');
const printsDir = path.join(process.cwd(), 'public', 'prints');

// Check if directories exist
if (!fs.existsSync(pdfDir) && !fs.existsSync(printsDir)) {
  console.log('⚠️  PDF directories not found. Skipping validation.');
  process.exit(0);
}

// Find PDF files
const findPdfs = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  
  const files: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findPdfs(fullPath));
    } else if (item.name.toLowerCase().endsWith('.pdf')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

const pdfFiles = [
  ...findPdfs(pdfDir),
  ...findPdfs(printsDir)
];

console.log(`📚 Found ${pdfFiles.length} PDF files`);

// Validate PDFs
let errors = 0;

for (const pdfPath of pdfFiles) {
  try {
    const stats = fs.statSync(pdfPath);
    const relativePath = path.relative(process.cwd(), pdfPath);
    
    if (checkEmpty && stats.size === 0) {
      console.error(`❌ Empty PDF: ${relativePath}`);
      errors++;
    }
    
    if (checkCorrupt) {
      // Basic corruption check - verify it starts with PDF header
      const buffer = Buffer.alloc(5);
      const fd = fs.openSync(pdfPath, 'r');
      fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);
      
      const header = buffer.toString();
      if (!header.startsWith('%PDF-')) {
        console.error(`❌ Corrupt PDF (invalid header): ${relativePath}`);
        errors++;
      }
    }
    
  } catch (error: any) {
    console.error(`❌ Error reading ${pdfPath}:`, error.message);
    errors++;
  }
}

if (errors === 0) {
  console.log('✅ All PDF files are valid');
  process.exit(0);
} else {
  console.error(`❌ Found ${errors} PDF validation errors`);
  process.exit(1);
}