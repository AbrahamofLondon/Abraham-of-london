// scripts/pdf/mdx-pdf-converter/converter.ts
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import crypto from 'crypto';
import { PDF_CONFIG, DOCUMENT_REGISTRY, MdxDocument } from './config';

export class MdxToPdfConverter {
  private processedCount = 0;
  private errors: string[] = [];
  
  async convertDocument(mdxDoc: MdxDocument, tierSlug: string, format: 'A4' | 'Letter' | 'A3', quality: string) {
    try {
      console.log(`📄 Converting: ${mdxDoc.displayName} (${tierSlug}/${format}/${quality})`);
      
      // Read MDX content
      const mdxContent = fs.readFileSync(mdxDoc.mdxPath, 'utf-8');
      
      // Parse MDX (simplified - for production, use proper MDX parser)
      const htmlContent = await this.mdxToHtml(mdxContent);
      
      // Create PDF
      const pdfDoc = await PDFDocument.create();
      
      // Get tier config
      const tier = mdxDoc.tiers.find(t => t.slug === tierSlug);
      if (!tier) throw new Error(`Tier ${tierSlug} not configured for ${mdxDoc.pdfName}`);
      
      // Add metadata
      pdfDoc.setTitle(`${mdxDoc.displayName} - ${tier.displayName} Tier`);
      pdfDoc.setAuthor('Abraham of London');
      pdfDoc.setSubject(mdxDoc.description);
      pdfDoc.setKeywords([mdxDoc.category, tierSlug, quality, format]);
      pdfDoc.setProducer('Abraham of London PDF Engine');
      pdfDoc.setCreator('MDX-to-PDF Converter');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());
      
      // Add page
      const page = pdfDoc.addPage([PDF_CONFIG.margins[format].width, PDF_CONFIG.margins[format].height]);
      const { width, height } = page.getSize();
      
      // Embed fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Draw header
      await this.drawHeader(page, mdxDoc, tier, quality, format, font, fontBold, width, height);
      
      // Draw content (simplified - would need proper HTML-to-PDF conversion)
      await this.drawContent(page, htmlContent, font, fontBold, width, height);
      
      // Draw footer
      await this.drawFooter(page, mdxDoc, tier, format, font, width, height);
      
      // Add watermark for lower tiers
      if (tierSlug !== 'architect') {
        await this.drawWatermark(page, tier, format, font, width, height);
      }
      
      // Generate checksum
      const checksum = this.generateChecksum(mdxDoc, tierSlug, format, quality);
      
      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const outputPath = this.getOutputPath(mdxDoc, tierSlug, format, quality);
      
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, pdfBytes);
      
      const stats = fs.statSync(outputPath);
      console.log(`  ✅ ${path.basename(outputPath)} (${(stats.size / 1024).toFixed(1)} KB)`);
      
      this.processedCount++;
      return { success: true, path: outputPath, size: stats.size, checksum };
      
    } catch (error: any) {
      const errorMsg = `Failed to convert ${mdxDoc.pdfName}: ${error.message}`;
      console.error(`  ❌ ${errorMsg}`);
      this.errors.push(errorMsg);
      return { success: false, error: error.message };
    }
  }
  
  private async mdxToHtml(mdxContent: string): Promise<string> {
    try {
      // Strip MDX components and frontmatter for basic conversion
      let cleanContent = mdxContent
        .replace(/---[\s\S]*?---/g, '') // Remove frontmatter
        .replace(/import[^;]+;/g, '')   // Remove imports
        .replace(/<[^>]+\/>/g, '')      // Remove self-closing components
        .replace(/\{[^}]+\}/g, '');     // Remove inline JSX
      
      // Use remark for basic markdown conversion
      const processor = unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeStringify);
      
      const file = await processor.process(cleanContent);
      return String(file);
    } catch (error) {
      // Fallback to plain text
      return `<div>${mdxContent.replace(/[<>]/g, '').substring(0, 5000)}...</div>`;
    }
  }
  
  private async drawHeader(
    page: any,
    doc: MdxDocument,
    tier: any,
    quality: string,
    format: string,
    font: any,
    fontBold: any,
    width: number,
    height: number
  ) {
    // Title
    page.drawText(doc.displayName, {
      x: 50,
      y: height - 70,
      size: 24,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    // Subtitle
    page.drawText(doc.description, {
      x: 50,
      y: height - 100,
      size: 12,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    // Tier/Quality badge
    const badgeText = `${tier.displayName.toUpperCase()} • ${quality.toUpperCase()} • ${format}`;
    page.drawText(badgeText, {
      x: 50,
      y: height - 130,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.4, 0.8),
    });
    
    // Separator line
    page.drawLine({
      start: { x: 50, y: height - 140 },
      end: { x: width - 50, y: height - 140 },
      thickness: 2,
      color: rgb(0.8, 0.8, 0.8),
    });
  }
  
  private async drawContent(
    page: any,
    htmlContent: string,
    font: any,
    fontBold: any,
    width: number,
    height: number
  ) {
    // Simplified content rendering
    // In production, you'd want a proper HTML-to-PDF renderer
    const lines = htmlContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 2000)
      .match(/.{1,80}/g) || [];
    
    let y = height - 180;
    for (let i = 0; i < Math.min(lines.length, 40); i++) {
      if (y < 100) break;
      
      page.drawText(lines[i], {
        x: 50,
        y,
        size: 11,
        font: i === 0 ? fontBold : font,
        color: rgb(0.2, 0.2, 0.2),
      });
      
      y -= 20;
    }
    
    // Add continuation notice if content truncated
    if (lines.length > 40) {
      page.drawText('... [Content continues in full PDF] ...', {
        x: 50,
        y: y - 20,
        size: 10,
        font: font,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
  }
  
  private async drawFooter(
    page: any,
    doc: MdxDocument,
    tier: any,
    format: string,
    font: any,
    width: number,
    height: number
  ) {
    const footerY = 40;
    const date = new Date().toLocaleDateString('en-GB');
    
    page.drawText(
      `© ${new Date().getFullYear()} Abraham of London • ${doc.category} • ${tier.displayName} Tier • ${date}`,
      {
        x: 50,
        y: footerY,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
    
    page.drawText(
      `Page 1 of 1 • Generated: ${new Date().toISOString()}`,
      {
        x: width - 250,
        y: footerY,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
  }
  
  private async drawWatermark(
    page: any,
    tier: any,
    format: string,
    font: any,
    width: number,
    height: number
  ) {
    page.drawText(tier.displayName.toUpperCase(), {
      x: width / 2 - 100,
      y: height / 2,
      size: 48,
      font: font,
      color: rgb(0.95, 0.95, 0.95),
      opacity: 0.3,
      rotate: { type: 'degrees', angle: 45 },
    });
  }
  
  private generateChecksum(
    doc: MdxDocument,
    tierSlug: string,
    format: string,
    quality: string
  ): string {
    const seed = `${doc.pdfName}|${tierSlug}|${format}|${quality}|${new Date().toISOString().slice(0, 10)}`;
    return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 16).toUpperCase();
  }
  
  private getOutputPath(
    doc: MdxDocument,
    tierSlug: string,
    format: string,
    quality: string
  ): string {
    const baseName = `${doc.pdfName}-${format.toLowerCase()}-${quality}-${tierSlug}.pdf`;
    return path.join(PDF_CONFIG.outputDir, baseName);
  }
  
  getStats() {
    return {
      processed: this.processedCount,
      errors: this.errors.length,
      errorMessages: this.errors
    };
  }
}