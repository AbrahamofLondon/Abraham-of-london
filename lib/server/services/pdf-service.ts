/* lib/server/services/pdf-service.ts — CRYPTOGRAPHIC WATERMARKING */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class PdfService {
  /**
   * Inject institutional watermarks into a brief.
   * Ensures every page carries the recipient's identifier.
   */
  static async injectWatermark(pdfBuffer: Buffer, identifier: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    const watermarkText = `VERIFIED ASSET // RECIPIENT: ${identifier} // ${new Date().toISOString()}`;

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      
      // Vertical watermark on the right margin
      page.drawText(watermarkText, {
        x: width - 20,
        y: 50,
        size: 7,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        rotate: { angle: 90, type: 'degrees' },
        opacity: 0.4,
      });

      // Subtle footer watermark
      page.drawText(`Inner Circle Intelligence Asset - Unauthorized Distribution is Prohibited`, {
        x: 50,
        y: 20,
        size: 6,
        font: helveticaFont,
        color: rgb(0.7, 0.1, 0.1),
        opacity: 0.5,
      });
    });

    return await pdfDoc.save();
  }
}