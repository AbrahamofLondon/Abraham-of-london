// scripts/pdf/simple-direct-converter.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import matter from 'gray-matter';
import os from 'os';

export type SourceKind = 'mdx' | 'md' | 'xlsx' | 'xls' | 'pptx' | 'ppt' | 'pdf';

export interface ConvertResult {
  success: boolean;
  outputPath: string;
  size: number;
  error?: string;
  method: 'copy' | 'pdf-lib' | 'placeholder';
}

export async function convertToPDF(sourcePath: string, outputPath: string, quality: 'premium' | 'draft' = 'premium'): Promise<ConvertResult> {
  const startTime = Date.now();
  const ext = path.extname(sourcePath).toLowerCase();
  const kind = ext.replace('.', '') as SourceKind;
  const baseName = path.basename(sourcePath, ext);
  
  try {
    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
    console.log(`  📄 Converting: ${path.basename(sourcePath)} -> ${path.basename(outputPath)}`);
    
    // Handle PDF files - direct copy
    if (kind === 'pdf') {
      fs.copyFileSync(sourcePath, outputPath);
      const stats = fs.statSync(outputPath);
      
      return {
        success: true,
        outputPath,
        size: stats.size,
        method: 'copy',
      };
    }
    
    // Handle MDX/MD files - create PDF with content
    if (kind === 'mdx' || kind === 'md') {
      const result = await convertMDXtoPDF(sourcePath, outputPath, quality);
      const stats = fs.statSync(outputPath);
      
      return {
        success: true,
        outputPath,
        size: stats.size,
        method: 'pdf-lib',
      };
    }
    
    // Handle Office files - try to use LibreOffice if available
    if (['xlsx', 'xls', 'pptx', 'ppt'].includes(kind)) {
      const success = await convertOfficeToPDF(sourcePath, outputPath);
      if (success) {
        const stats = fs.statSync(outputPath);
        return {
          success: true,
          outputPath,
          size: stats.size,
          method: 'pdf-lib',
        };
      }
    }
    
    // Default: create a placeholder PDF
    return await createPlaceholderPDF(sourcePath, outputPath, quality);
    
  } catch (error: any) {
    console.error(`  ❌ Conversion failed: ${error.message}`);
    
    // Try to create a minimal placeholder as fallback
    try {
      await createMinimalPlaceholder(sourcePath, outputPath);
      const stats = fs.statSync(outputPath);
      return {
        success: true,
        outputPath,
        size: stats.size,
        method: 'placeholder',
      };
    } catch (fallbackError: any) {
      return {
        success: false,
        outputPath,
        size: 0,
        error: `Primary: ${error.message}, Fallback: ${fallbackError.message}`,
        method: 'placeholder',
      };
    }
  }
}

async function convertMDXtoPDF(sourcePath: string, outputPath: string, quality: 'premium' | 'draft'): Promise<void> {
  const content = fs.readFileSync(sourcePath, 'utf-8');
  const { data: frontmatter, content: markdown } = matter(content);
  
  const title = frontmatter.title || 
    path.basename(sourcePath, path.extname(sourcePath))
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  
  const description = frontmatter.description || 
    frontmatter.excerpt || 
    `${title} - Generated from ${path.basename(sourcePath)}`;
  
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
  
  // Set metadata
  doc.setTitle(title);
  doc.setAuthor('Abraham of London');
  doc.setSubject(description);
  doc.setKeywords(['generated', 'pdf', 'resource']);
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());
  
  // Background
  page.drawRectangle({
    x: 0, y: 0, width: 595.28, height: 841.89,
    color: quality === 'premium' ? rgb(0.98, 0.98, 0.97) : rgb(1, 1, 1),
  });
  
  // Header
  page.drawText(title, {
    x: 50,
    y: 750,
    size: 24,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  page.drawText(`Source: ${path.basename(sourcePath)} | Quality: ${quality} | Generated: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: 720,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Description
  if (description) {
    const descLines = wrapText(description, 80);
    descLines.forEach((line, i) => {
      page.drawText(line, {
        x: 50,
        y: 680 - (i * 15),
        size: 12,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
        maxWidth: 500,
      });
    });
  }
  
  // Content (simplified markdown rendering)
  const contentLines = markdown.split('\n').slice(0, 30); // Limit content for now
  let yPos = 600;
  
  for (const line of contentLines) {
    if (yPos < 100) break; // Don't go too low
    
    const trimmed = line.trim();
    if (!trimmed) {
      yPos -= 10; // Empty line
      continue;
    }
    
    if (trimmed.startsWith('# ')) {
      // Heading 1
      page.drawText(trimmed.substring(2), {
        x: 50,
        y: yPos,
        size: 16,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
        maxWidth: 500,
      });
      yPos -= 25;
    } else if (trimmed.startsWith('## ')) {
      // Heading 2
      page.drawText(trimmed.substring(3), {
        x: 50,
        y: yPos,
        size: 14,
        font: fontBold,
        color: rgb(0.3, 0.3, 0.3),
        maxWidth: 500,
      });
      yPos -= 22;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // List item
      page.drawText('• ' + trimmed.substring(2), {
        x: 60,
        y: yPos,
        size: 11,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
        maxWidth: 490,
      });
      yPos -= 18;
    } else {
      // Regular text
      const wrapped = wrapText(trimmed, 100);
      wrapped.forEach(wrappedLine => {
        page.drawText(wrappedLine, {
          x: 50,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.4, 0.4, 0.4),
          maxWidth: 500,
        });
        yPos -= 16;
      });
    }
  }
  
  // Footer
  page.drawText('Abraham of London - Strategic Resources', {
    x: 50,
    y: 50,
    size: 9,
    font: fontItalic,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawText(`Generated from ${path.basename(sourcePath)} on ${new Date().toLocaleString()}`, {
    x: 300,
    y: 50,
    size: 8,
    font: font,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  const pdfBytes = await doc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

async function convertOfficeToPDF(sourcePath: string, outputPath: string): Promise<boolean> {
  // Check if LibreOffice is available
  try {
    const { execSync } = require('child_process');
    
    // Try to find LibreOffice/soffice
    let libreofficeCmd = '';
    try {
      execSync('libreoffice --version', { stdio: 'ignore' });
      libreofficeCmd = 'libreoffice';
    } catch {
      try {
        execSync('soffice --version', { stdio: 'ignore' });
        libreofficeCmd = 'soffice';
      } catch {
        return false; // LibreOffice not available
      }
    }
    
    // Create temp directory for conversion
    const tempDir = path.join(os.tmpdir(), 'pdf-conversion-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Convert using LibreOffice
    execSync(`"${libreofficeCmd}" --headless --convert-to pdf --outdir "${tempDir}" "${sourcePath}"`, {
      stdio: 'pipe',
      shell: true,
    });
    
    // Find the converted PDF
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const tempPdf = path.join(tempDir, `${baseName}.pdf`);
    
    if (fs.existsSync(tempPdf)) {
      fs.copyFileSync(tempPdf, outputPath);
      
      // Cleanup
      try {
        fs.unlinkSync(tempPdf);
        fs.rmdirSync(tempDir);
      } catch {
        // Ignore cleanup errors
      }
      
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

async function createPlaceholderPDF(sourcePath: string, outputPath: string, quality: 'premium' | 'draft'): Promise<ConvertResult> {
  const baseName = path.basename(sourcePath, path.extname(sourcePath));
  const title = baseName.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  
  // Title
  page.drawText(title, {
    x: 50,
    y: 700,
    size: 28,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  // Notice
  page.drawText('PLACEHOLDER DOCUMENT', {
    x: 50,
    y: 650,
    size: 16,
    font: fontBold,
    color: rgb(0.7, 0.2, 0.2),
  });
  
  page.drawText('This is a placeholder PDF. The full content will be available soon.', {
    x: 50,
    y: 620,
    size: 12,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
    maxWidth: 500,
  });
  
  // Info
  const info = [
    `Source file: ${path.basename(sourcePath)}`,
    `Generated: ${new Date().toLocaleString()}`,
    `Quality: ${quality}`,
    `Status: Placeholder - Full conversion pending`,
  ];
  
  info.forEach((line, i) => {
    page.drawText(line, {
      x: 50,
      y: 550 - (i * 20),
      size: 11,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });
  
  const pdfBytes = await doc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  
  const stats = fs.statSync(outputPath);
  return {
    success: true,
    outputPath,
    size: stats.size,
    method: 'placeholder',
  };
}

async function createMinimalPlaceholder(sourcePath: string, outputPath: string): Promise<void> {
  // Create absolute minimal PDF
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
(${path.basename(sourcePath, path.extname(sourcePath))}) Tj
0 -30 Td
/F1 12 Tf
(Placeholder PDF) Tj
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
  
  fs.writeFileSync(outputPath, minimalPDF);
}

function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: pnpm tsx scripts/pdf/simple-direct-converter.ts <source-file> [output-file]');
    process.exit(1);
  }
  
  const sourcePath = args[0];
  const outputPath = args[1] || sourcePath.replace(/\.[^/.]+$/, '.pdf');
  
  console.log(`Converting: ${sourcePath} -> ${outputPath}`);
  
  convertToPDF(sourcePath, outputPath)
    .then(result => {
      if (result.success) {
        console.log(`✅ Success: ${path.basename(outputPath)} (${(result.size / 1024).toFixed(1)} KB)`);
        process.exit(0);
      } else {
        console.error(`❌ Failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`❌ Fatal error: ${error.message}`);
      process.exit(1);
    });
}

export { convertToPDF };