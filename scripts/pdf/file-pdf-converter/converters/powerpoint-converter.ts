import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

import { BaseConverter, type ConversionResult } from "./base-converter";
import { FileDocument, DocumentTier, Format, Quality } from "../config";
import { resolveSoffice, spawnWithTimeout, findFirstPdf } from "./libreoffice-runner";

export class PowerpointConverter extends BaseConverter {
  async convert(document: FileDocument, tier: DocumentTier, format: Format, quality: Quality): Promise<ConversionResult> {
    const started = Date.now();
    const outputPath = this.getOutputPath(document, tier, format, quality);

    try {
      console.log(`🎨 Converting PowerPoint (LibreOffice): ${document.displayName}`);

      const soffice = resolveSoffice();
      const tempRoot = await this.ensureTempDir();
      const tempDir = path.join(tempRoot, `lo-${Date.now()}-${Math.random().toString(16).slice(2)}`);
      this.ensureDir(tempDir);

      const args = [
        "--headless",
        "--nologo",
        "--nolockcheck",
        "--nodefault",
        "--norestore",
        "--invisible",
        "--convert-to",
        "pdf",
        "--outdir",
        tempDir,
        document.sourcePath,
      ];

      // PPT conversions can take longer
      const res = await spawnWithTimeout(soffice, args, 180_000);

      if (res.code !== 0) {
        throw new Error(`LibreOffice failed (code=${res.code}). ${res.stderr || res.stdout || ""}`.trim());
      }

      const produced = findFirstPdf(tempDir);
      if (!produced) throw new Error("LibreOffice produced no PDF output.");

      // Load produced PDF, stamp metadata + watermark, write atomically
      const bytes = fs.readFileSync(produced);
      const pdfDoc = await PDFDocument.load(bytes);

      pdfDoc.setTitle(`${document.displayName} — ${tier.displayName}`);
      pdfDoc.setAuthor("Abraham of London");
      if (document.description) pdfDoc.setSubject(String(document.description));
      pdfDoc.setProducer("Abraham of London — Enterprise PDF Converter");
      pdfDoc.setCreator("PowerPoint-to-PDF (LibreOffice)");
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      const pages = pdfDoc.getPages();
      for (const p of pages) this.addWatermark(p as any, tier);

      const outBytes = await pdfDoc.save();

      this.atomicWrite(outputPath, outBytes);
      this.validatePdfOrThrow(outputPath, 8000);

      const st = fs.statSync(outputPath);

      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}

      return {
        success: true,
        outputPath,
        size: st.size,
        metadata: {
          pages: pages.length || 1,
          originalType: "powerpoint",
          conversionMethod: "libreoffice",
          timestamp: new Date().toISOString(),
          md5: this.md5Bytes(outBytes),
        },
      };
    } catch (error: any) {
      const msg = error?.message || String(error);
      console.error(`❌ PowerPoint conversion failed: ${msg}`);
      return {
        success: false,
        outputPath,
        size: 0,
        error: `PowerPoint conversion failed: ${msg} (elapsed ${Date.now() - started}ms)`,
      };
    }
  }
}