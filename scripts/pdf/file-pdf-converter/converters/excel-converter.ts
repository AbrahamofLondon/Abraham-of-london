// scripts/pdf/file-pdf-converter/converters/excel-converter.ts
import { BaseConverter, ConversionResult } from './base-converter';
import { FileDocument, DocumentTier, Format, Quality } from '../config';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class ExcelConverter extends BaseConverter {
  async convert(
    document: FileDocument,
    tier: DocumentTier,
    format: Format,
    quality: Quality
  ): Promise<ConversionResult> {
    try {
      console.log(`📊 Converting Excel: ${document.displayName}`);
      
      // Method 1: Try using external tool (LibreOffice) for best results
      if (await this.hasLibreOffice()) {
        return await this.convertWithLibreOffice(document, tier, format, quality);
      }
      
      // Method 2: Fallback to basic conversion
      return await this.convertBasic(document, tier, format, quality);
      
    } catch (error: any) {
      return {
        success: false,
        outputPath: '',
        size: 0,
        error: `Excel conversion failed: ${error.message}`
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
    const tempPdf = path.join(tempDir, `${document.pdfName}-temp.pdf`);
    
    // Convert Excel to PDF using LibreOffice
    execSync(
      `${PDF_CONFIG.externalTools.libreoffice} --headless --convert-to pdf --outdir "${tempDir}" "${document.sourcePath}"`,
      { stdio: 'pipe' }
    );
    
    // Check if conversion succeeded
    if (!fs.existsSync(tempPdf)) {
      // Look for PDF with different name pattern
      const pdfFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.pdf'));
      if (pdfFiles.length > 0) {
        const actualPdf = path.join(tempDir, pdfFiles[0]);
        fs.renameSync(actualPdf, tempPdf);
      } else {
        throw new Error('LibreOffice conversion failed - no PDF output');
      }
    }
    
    // Add metadata and tier branding
    const outputPath = this.getOutputPath(document, tier, format, quality);
    await this.addMetadataToPdf(tempPdf, outputPath, document, tier, quality);
    
    const stats = fs.statSync(outputPath);
    
    // Cleanup temp file
    fs.unlinkSync(tempPdf);
    
    return {
      success: true,
      outputPath,
      size: stats.size,
      metadata: {
        pages: await this.getPageCount(outputPath),
        originalType: 'excel',
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
    // Create a simple PDF indicating the Excel content
    const pdfDoc = await this.createPdfWithMetadata(document, tier, quality);
    const dimensions = this.getFormatDimensions(format);
    const page = pdfDoc.addPage([dimensions.width, dimensions.height]);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Draw informational message
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
    
    page.drawText('Excel Document', {
      x: margin,
      y,
      size: 14,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    y -= 60;
    
    page.drawText('This is an Excel spreadsheet that requires conversion.', {
      x: margin,
      y,
      size: 12,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    y -= 30;
    
    page.drawText('For best results:', {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    y -= 20;
    
    const tips = [
      '1. Install LibreOffice for automatic conversion',
      '2. Open the Excel file and export as PDF',
      `3. Original file: ${path.basename(document.sourcePath)}`,
      `4. File size: ${(fs.statSync(document.sourcePath).size / 1024).toFixed(1)} KB`
    ];
    
    tips.forEach(tip => {
      page.drawText(tip, {
        x: margin + 20,
        y,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4)
      });
      y -= 18;
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
        originalType: 'excel',
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
  
  private async addMetadataToPdf(
    sourcePdf: string,
    destPdf: string,
    document: FileDocument,
    tier: DocumentTier,
    quality: Quality
  ): Promise<void> {
    const existingPdfBytes = fs.readFileSync(sourcePdf);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Update metadata
    pdfDoc.setTitle(`${document.displayName} - ${tier.displayName} Tier`);
    pdfDoc.setAuthor('Abraham of London');
    pdfDoc.setSubject(`Excel conversion: ${document.description}`);
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(destPdf, pdfBytes);
  }
  
  private async getPageCount(pdfPath: string): Promise<number> {
    try {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      return pdfDoc.getPageCount();
    } catch {
      return 1;
    }
  }
}