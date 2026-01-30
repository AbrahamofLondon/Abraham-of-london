// scripts/pdf/file-pdf-converter/converters/base-converter.ts
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { PDF_CONFIG, FileDocument, DocumentTier, Format, Quality } from '../config';

export abstract class BaseConverter {
  abstract convert(
    document: FileDocument,
    tier: DocumentTier,
    format: Format,
    quality: Quality
  ): Promise<ConversionResult>;
  
  protected async ensureTempDir(): Promise<string> {
    const tempDir = PDF_CONFIG.tempDir;
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
  }
  
  protected getOutputPath(
    document: FileDocument,
    tier: DocumentTier,
    format: Format,
    quality: Quality
  ): string {
    const baseName = `${document.pdfName}-${format.toLowerCase()}-${quality}-${tier.slug}.pdf`;
    return path.join(PDF_CONFIG.outputDir, baseName);
  }
  
  protected async createPdfWithMetadata(
    document: FileDocument,
    tier: DocumentTier,
    quality: Quality
  ): Promise<PDFDocument> {
    const pdfDoc = await PDFDocument.create();
    
    // Add comprehensive metadata
    pdfDoc.setTitle(`${document.displayName} - ${tier.displayName} Tier`);
    pdfDoc.setAuthor('Abraham of London');
    pdfDoc.setSubject(document.description);
    pdfDoc.setKeywords([
      document.category,
      tier.slug,
      quality,
      document.fileType,
      'converted'
    ]);
    pdfDoc.setProducer('Abraham of London Enterprise PDF Converter');
    pdfDoc.setCreator(`File-to-PDF Converter (${document.fileType})`);
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    
    return pdfDoc;
  }
  
  protected addWatermark(page: any, tier: DocumentTier, format: Format) {
    // Basic watermark implementation
    const { width, height } = page.getSize();
    
    if (tier.slug === 'free') {
      page.drawText('FREE VERSION', {
        x: width / 2 - 80,
        y: height / 2,
        size: 32,
        color: { r: 0.9, g: 0.9, b: 0.9 },
        opacity: 0.2,
        rotate: { type: 'degrees', angle: 45 }
      });
    }
  }
}

export interface ConversionResult {
  success: boolean;
  outputPath: string;
  size: number;
  error?: string;
  metadata?: {
    pages: number;
    originalType: string;
    conversionMethod: string;
    timestamp: string;
  };
}