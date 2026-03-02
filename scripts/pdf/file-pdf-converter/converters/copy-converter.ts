// scripts/pdf/file-pdf-converter/converters/copy-converter.ts
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

import { BaseConverter, type ConversionResult } from "./base-converter";
import { FileDocument, DocumentTier, Format, Quality } from "../config";

export class CopyConverter extends BaseConverter {
  async convert(document: FileDocument, tier: DocumentTier, _format: Format, _quality: Quality): Promise<ConversionResult> {
    const outputPath = this.getOutputPath(document, tier, "A4", "premium");

    try {
      console.log(`📄 Copying PDF (stamp metadata + watermark): ${document.displayName}`);

      if (!fs.existsSync(document.sourcePath) && !fs.existsSync(path.join(process.cwd(), document.sourcePath))) {
        throw new Error(`Source missing: ${document.sourcePath}`);
      }

      const sourceAbs = path.isAbsolute(document.sourcePath) ? document.sourcePath : path.join(process.cwd(), document.sourcePath);
      const bytes = fs.readFileSync(sourceAbs);

      const pdfDoc = await PDFDocument.load(bytes);

      pdfDoc.setTitle(`${document.displayName} — ${tier.displayName}`);
      pdfDoc.setAuthor("Abraham of London");
      if (document.description) pdfDoc.setSubject(String(document.description));
      pdfDoc.setProducer("Abraham of London — Enterprise PDF Converter");
      pdfDoc.setCreator("PDF Copy (Stamped)");
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      const pages = pdfDoc.getPages();
      for (const p of pages) this.addWatermark(p as any, tier);

      const outBytes = await pdfDoc.save();

      this.atomicWrite(outputPath, outBytes);
      this.validatePdfOrThrow(outputPath, 8000);

      const st = fs.statSync(outputPath);

      return {
        success: true,
        outputPath,
        size: st.size,
        metadata: {
          pages: pages.length || 1,
          originalType: "pdf",
          conversionMethod: "copy-stamp",
          timestamp: new Date().toISOString(),
          md5: this.md5Bytes(outBytes),
        },
      };
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error(`❌ PDF copy failed: ${msg}`);
      return { success: false, outputPath, size: 0, error: msg };
    }
  }
}