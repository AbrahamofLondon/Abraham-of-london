// scripts/create-vault-zip.ts
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createVaultZip() {
  const outputPath = path.join(process.cwd(), 'public/assets/downloads/abraham-vault-artifacts.zip');
  const outputDir = path.dirname(outputPath);
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ ZIP created: ${outputPath} (${archive.pointer()} bytes)`);
      resolve(outputPath);
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add your PDF files to the ZIP
    const pdfDir = path.join(process.cwd(), 'public/assets/downloads');
    
    // Add legacy canvas PDFs
    const pdfFiles = [
      'legacy-architecture-canvas-a4-premium-free.pdf',
      'legacy-architecture-canvas-letter-premium-free.pdf',
      'legacy-architecture-canvas-a3-premium-free.pdf',
      'ultimate-purpose-of-man-premium.pdf'
    ];
    
    pdfFiles.forEach(pdf => {
      const pdfPath = path.join(pdfDir, pdf);
      if (fs.existsSync(pdfPath)) {
        archive.file(pdfPath, { name: `pdfs/${pdf}` });
      }
    });
    
    // Add templates if they exist
    const templates = [
      { source: 'templates/purpose-pyramid.xlsx', name: 'templates/Purpose-Pyramid.xlsx' },
      { source: 'templates/decision-matrix.xlsx', name: 'templates/Decision-Matrix.xlsx' },
      { source: 'templates/operating-cadence.pptx', name: 'templates/Operating-Cadence.pptx' }
    ];
    
    templates.forEach(template => {
      const templatePath = path.join(process.cwd(), 'public', template.source);
      if (fs.existsSync(templatePath)) {
        archive.file(templatePath, { name: template.name });
      }
    });
    
    // Add a README
    const readmeContent = `Abraham Vault — Strategic Artifacts Pack
===============================
Generated: ${new Date().toISOString()}
Includes: Fillable PDFs + Board-grade templates

CONTENTS:
1. Legacy Architecture Canvas (A4, Letter, A3)
2. Ultimate Purpose of Man (Editorial PDF)
3. Purpose Pyramid Worksheet
4. Decision Matrix Scorecard
5. Operating Cadence Pack

© ${new Date().getFullYear()} Abraham of London`;
    
    archive.append(readmeContent, { name: 'README.txt' });
    
    archive.finalize();
  });
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createVaultZip().catch(console.error);
}

export default createVaultZip;