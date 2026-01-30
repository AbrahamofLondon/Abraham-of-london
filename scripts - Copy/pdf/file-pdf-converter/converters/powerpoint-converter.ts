// scripts/pdf/file-pdf-converter/converters/powerpoint-converter.ts
import { BaseConverter, ConversionResult } from './base-converter';
import { FileDocument, DocumentTier, Format, Quality } from '../config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class PowerpointConverter extends BaseConverter {
  async convert(
    document: FileDocument,
    tier: DocumentTier,
    format: Format,
    quality: Quality
  ): Promise<ConversionResult> {
    try {
      console.log(`🎨 Converting PowerPoint: ${document.displayName}`);
      
      // Try using external tool first
      if (await this.hasLibreOffice()) {
        return await this.convertWithLibreOffice(document, tier, format, quality);
      }
      
      // Fallback to basic conversion
      return await this.convertBasic(document, tier, format, quality);
      
    } catch (error: any) {
      return {
        success: false,
        outputPath: '',
        size: 0,
        error: `PowerPoint conversion failed: ${error.message}`
      };
    }
  }
  
  private async hasLibreOffice(): Promise<boolean> {
    try {
      execSync(`${PDF_CONFIG.externalTools.libreoffice} --version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  private async convertWithLibreOffice(
    document: FileDocument,
    tier: DocumentTier,
    format: Format,
    quality: Quality
  ): Promise<ConversionResult> {
    const tempDir = await this.ensureTempDir();
    
    // Convert PowerPoint to PDF
    execSync(
      `${PDF_CONFIG.externalTools.libreoffice} --headless --convert-to pdf --outdir "${tempDir}" "${document.sourcePath}"`,
      { stdio: 'pipe' }
    );
    
    // Find the converted PDF
    const pdfFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      throw new Error('PowerPoint conversion failed - no PDF output');
    }
    
    const tempPdf = path.join(tempDir, pdfFiles[0]);
    const outputPath = this.getOutputPath(document, tier, format, quality);
    
    // Copy to final location
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.copyFileSync(tempPdf, outputPath);
    
    const stats = fs.statSync(outputPath);
    
    // Cleanup
    fs.unlinkSync(tempPdf);
    
    return {
      success: true,
      outputPath,
      size: stats.size,
      metadata: {
        pages: await this.getPageCount(outputPath),
        originalType: 'powerpoint',
        conversionMethod: 'libreoffice',
        timestamp: new Date().toISOString()
      }
    };
  }
  
  private async convertBasic(
    document: FileDocument,
    tier: DocumentTier,
    format: Format,
    quality: Quality
  ): Promise<ConversionResult> {
    // Create informational PDF
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.create();
    const dimensions = this.getFormatDimensions(format);
    const page = pdfDoc.addPage([dimensions.width, dimensions.height]);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Draw content
    const margin = 72;
    let y = dimensions.height - margin;
    
    page.drawText(document.displayName, {
      x: margin,
      y,
      size: 20,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1)
    });
    
    y -= 40;
    
    page.drawText('PowerPoint Presentation', {
      x: margin,
      y,
      size: 14,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    y -= 60;
    
    const fileStats = fs.statSync(document.sourcePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    
    const info = [
      'This is a PowerPoint presentation file.',
      'For automatic conversion:',
      '',
      '1. Install LibreOffice',
      '2. Run: pnpm pdfs:convert:all',
      '',
      `File: ${path.basename(document.sourcePath)}`,
      `Size: ${fileSizeMB} MB`,
      `Type: ${path.extname(document.sourcePath).toUpperCase()}`
    ];
    
    info.forEach((line, i) => {
      const size = i === 0 ? 12 : 10;
      const useFont = i === 0 ? fontBold : font;
      
      page.drawText(line, {
        x: margin + (i > 2 ? 20 : 0),
        y,
        size,
        font: useFont,
        color: rgb(0.4, 0.4, 0.4)
      });
      
      y -= i === 0 || i === 2 ? 25 : 18;
    });
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const outputPath = this.getOutputPath(document, tier, format, quality);
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, pdfBytes);
    
    const stats = fs.statSync(outputPath);
    
    return {
      success: true,
      outputPath,
      size: stats.size,
      metadata: {
        pages: 1,
        originalType: 'powerpoint',
        conversionMethod: 'basic-info',
        timestamp: new Date().toISOString()
      }
    };
  }
  
  private getFormatDimensions(format: Format): { width: number; height: number } {
    const pointsPerInch = 72;
    switch (format) {
      case 'A4': return { width: 8.27 * pointsPerInch, height: 11.69 * pointsPerInch };
      case 'Letter': return { width: 8.5 * pointsPerInch, height: 11 * pointsPerInch };
      case 'A3': return { width: 11.69 * pointsPerInch, height: 16.54 * pointsPerInch };
      default: return { width: 8.27 * pointsPerInch, height: 11.69 * pointsPerInch };
    }
  }
  
  private async getPageCount(pdfPath: string): Promise<number> {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      return pdfDoc.getPageCount();
    } catch {
      return 1;
    }
  }
}