// scripts/pdf/file-pdf-converter/converters/csv-converter.ts
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

function parseCsv(raw: string): string[][] {
  // simple CSV parser (handles quotes minimally)
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (ch === ",")) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (!inQuotes && (ch === "\n")) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (ch !== "\r") cell += ch;
  }

  if (cell.length || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

export class CsvConverter extends BaseConverter {
  async convert(document: FileDocument, tier: DocumentTier, format: Format, quality: Quality): Promise<ConversionResult> {
    const outputPath = this.getOutputPath(document, tier, format, quality);

    try {
      console.log(`📑 Converting CSV → PDF: ${document.displayName}`);

      const sourceAbs = path.isAbsolute(document.sourcePath) ? document.sourcePath : path.join(process.cwd(), document.sourcePath);
      if (!fs.existsSync(sourceAbs)) throw new Error(`Source missing: ${sourceAbs}`);

      const raw = fs.readFileSync(sourceAbs, "utf8").replace(/\r\n/g, "\n");
      const rows = parseCsv(raw);
      if (!rows.length) throw new Error("CSV has no rows");

      const { w, h } = pageSize(format);
      const pdfDoc = await this.createPdfWithMetadata(document, tier, quality);

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const marginX = 44;
      const marginTop = 56;
      const marginBottom = 56;

      const title = String(document.displayName || document.pdfName);
      const bodySize = quality === "enterprise" ? 10.5 : 10;
      const lineH = bodySize * 1.4;

      const maxCols = Math.min(10, Math.max(...rows.map(r => r.length)));
      const clipped = rows.map(r => r.slice(0, maxCols));

      let page = pdfDoc.addPage([w, h]);
      this.addWatermark(page as any, tier);

      page.drawText(title, { x: marginX, y: h - marginTop, size: 16, font: bold, color: rgb(0.1, 0.1, 0.12) });

      let y = h - marginTop - 34;

      // Column widths
      const tableW = w - marginX * 2;
      const colW = tableW / maxCols;

      const drawRow = (cells: string[], isHeader: boolean) => {
        const yTop = y;
        const rowH = lineH + 10;

        // background stripe
        page.drawRectangle({
          x: marginX,
          y: yTop - rowH + 2,
          width: tableW,
          height: rowH,
          color: isHeader ? rgb(0.95, 0.95, 0.96) : rgb(0.99, 0.99, 0.995),
          borderColor: rgb(0.88, 0.88, 0.9),
          borderWidth: 0.5,
        });

        for (let c = 0; c < maxCols; c++) {
          const txt = String(cells[c] ?? "").slice(0, 42);
          page.drawText(txt, {
            x: marginX + c * colW + 6,
            y: yTop - lineH,
            size: bodySize,
            font: isHeader ? bold : font,
            color: rgb(0.2, 0.2, 0.22),
          });
        }

        y -= rowH;
      };

      const header = clipped[0];
      drawRow(header, true);

      for (let i = 1; i < clipped.length; i++) {
        if (y < marginBottom + 40) {
          page = pdfDoc.addPage([w, h]);
          this.addWatermark(page as any, tier);
          y = h - marginTop;
        }
        drawRow(clipped[i], false);

        // safety cap for huge CSVs
        if (i > 3000) break;
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
          originalType: "csv",
          conversionMethod: "pdf-lib-table",
          timestamp: new Date().toISOString(),
          md5: this.md5Bytes(outBytes),
        },
      };
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error(`❌ CSV conversion failed: ${msg}`);
      return { success: false, outputPath, size: 0, error: msg };
    }
  }
}