// scripts/pdf/file-pdf-converter/converters/text-converter.ts
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { BaseConverter, type ConversionResult } from "./base-converter";
import { FileDocument, DocumentTier, Format, Quality } from "../config";

function pageSize(format: Format) {
  if (format === "A3") return { w: 841.89, h: 1190.55 };
  if (format === "Letter") return { w: 612, h: 792 };
  return { w: 595.28, h: 841.89 };
}

export class TextConverter extends BaseConverter {
  async convert(document: FileDocument, tier: DocumentTier, format: Format, quality: Quality): Promise<ConversionResult> {
    const outputPath = this.getOutputPath(document, tier, format, quality);

    try {
      console.log(`📜 Converting Text → PDF: ${document.displayName}`);

      const sourceAbs = path.isAbsolute(document.sourcePath) ? document.sourcePath : path.join(process.cwd(), document.sourcePath);
      if (!fs.existsSync(sourceAbs)) throw new Error(`Source missing: ${sourceAbs}`);

      const raw = fs.readFileSync(sourceAbs, "utf8").replace(/\r\n/g, "\n");
      const { w, h } = pageSize(format);

      const pdfDoc = await this.createPdfWithMetadata(document, tier, quality);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const marginX = 56;
      const marginTop = 64;
      const marginBottom = 56;
      const bodySize = quality === "enterprise" ? 11.5 : quality === "premium" ? 11 : 10.5;
      const lineH = bodySize * 1.45;

      const title = String(document.displayName || document.pdfName);
      const lines = raw.split("\n");

      let page = pdfDoc.addPage([w, h]);
      this.addWatermark(page as any, tier);

      page.drawText(title, { x: marginX, y: h - marginTop, size: 18, font: bold, color: rgb(0.1, 0.1, 0.12) });
      let y = h - marginTop - 36;

      for (const lnRaw of lines) {
        const ln = lnRaw.length > 160 ? lnRaw.slice(0, 160) + "…" : lnRaw;

        if (y < marginBottom + 30) {
          page = pdfDoc.addPage([w, h]);
          this.addWatermark(page as any, tier);
          y = h - marginTop;
        }

        page.drawText(ln, { x: marginX, y, size: bodySize, font, color: rgb(0.2, 0.2, 0.22) });
        y -= lineH;
      }

      const outBytes = await pdfDoc.save();
      this.atomicWrite(outputPath, outBytes);
      this.validatePdfOrThrow(outputPath, 8000);

      const st = fs.statSync(outputPath);

      return {
        success: true,
        outputPath,
        size: st.size,
        metadata: {
          pages: pdfDoc.getPageCount(),
          originalType: "text",
          conversionMethod: "pdf-lib",
          timestamp: new Date().toISOString(),
          md5: this.md5Bytes(outBytes),
        },
      };
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error(`❌ Text conversion failed: ${msg}`);
      return { success: false, outputPath, size: 0, error: msg };
    }
  }
}