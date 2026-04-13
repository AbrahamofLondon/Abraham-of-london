// lib/server/diagnostics/export-pdf.ts
import "server-only";
import { signPayload } from "./signing";
import { buildWatermarkLines } from "./watermark";
import type { ReportWatermarkPayload } from "./types";

type PdfChunk = Buffer | Uint8Array | string;

type PdfDocumentLike = {
  y: number;
  on: (
    event: "data" | "end" | "error",
    handler: ((chunk: PdfChunk) => void) | (() => void) | ((error: unknown) => void),
  ) => void;
  save: () => PdfDocumentLike;
  rotate: (angle: number, options: { origin: [number, number] }) => PdfDocumentLike;
  fillColor: (color: string) => PdfDocumentLike;
  opacity: (value: number) => PdfDocumentLike;
  fontSize: (size: number) => PdfDocumentLike;
  text: (
    text: string,
    xOrOptions?:
      | number
      | { width?: number; align?: string; underline?: boolean; lineGap?: number },
    yOrOptions?:
      | number
      | { width?: number; align?: string; underline?: boolean; lineGap?: number },
    options?: { width?: number; align?: string; underline?: boolean; lineGap?: number },
  ) => PdfDocumentLike;
  restore: () => PdfDocumentLike;
  moveDown: (lines?: number) => PdfDocumentLike;
  rect: (x: number, y: number, width: number, height: number) => PdfDocumentLike;
  strokeColor: (color: string) => PdfDocumentLike;
  stroke: () => PdfDocumentLike;
  moveTo: (x: number, y: number) => PdfDocumentLike;
  lineTo: (x: number, y: number) => PdfDocumentLike;
  end: () => void;
};

type PdfDocumentConstructor = new (options: {
  margin: number;
  size: string;
}) => PdfDocumentLike;

export async function renderDiagnosticPdf(input: {
  title: string;
  diagnosticRef: string;
  reportId: string;
  version: string;
  subjectName?: string | null;
  narrative: string;
  sections: Array<{ heading: string; body: string }>;
  score?: number | null;
  viewerEmail?: string | null;
  entitlementKey?: string | null;
}) {
  const pdfkitModulePath = "pdfkit";
  const imported = (await import(pdfkitModulePath)) as {
    default: PdfDocumentConstructor;
  };
  const PDFKit = imported.default;

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFKit({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (c: PdfChunk) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const wmPayload: ReportWatermarkPayload = {
      diagnosticRef: input.diagnosticRef,
      reportId: input.reportId,
      version: input.version,
      viewerEmail: input.viewerEmail || null,
      generatedAtISO: new Date().toISOString(),
      entitlementKey: input.entitlementKey || null,
    };

    const watermarkLines = buildWatermarkLines(wmPayload);
    const signed = signPayload({
      diagnosticRef: input.diagnosticRef,
      reportId: input.reportId,
      version: input.version,
      score: input.score ?? null,
      generatedAtISO: wmPayload.generatedAtISO,
    });

    // Background watermark
    doc.save();
    doc.rotate(-35, { origin: [300, 420] });
    doc.fillColor("#999999").opacity(0.08).fontSize(34).text(watermarkLines.join("  •  "), 10, 360, {
      width: 700,
      align: "center",
    });
    doc.restore();

    // Header
    doc.opacity(1);
    doc.fillColor("#000000").fontSize(22).text(input.title, { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#555555").text(`Diagnostic Ref: ${input.diagnosticRef}`);
    doc.text(`Report ID: ${input.reportId}`);
    doc.text(`Version: ${input.version}`);
    if (input.subjectName) doc.text(`Subject: ${input.subjectName}`);
    if (typeof input.score === "number") doc.text(`Score: ${input.score}`);
    doc.moveDown();

    // Watermark block
    doc.rect(48, doc.y, 500, 54).strokeColor("#DDDDDD").stroke();
    doc.fontSize(8).fillColor("#444444");
    watermarkLines.forEach((line, i) => {
      doc.text(line, 56, doc.y + (i === 0 ? 8 : 2), { width: 484 });
    });
    doc.moveDown(4);

    // Narrative
    doc.fillColor("#111111").fontSize(13).text("Executive Narrative", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#222222").text(input.narrative, {
      width: 500,
      align: "left",
      lineGap: 3,
    });
    doc.moveDown();

    input.sections.forEach((section) => {
      doc.fontSize(12).fillColor("#111111").text(section.heading, { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10.5).fillColor("#222222").text(section.body, {
        width: 500,
        lineGap: 3,
      });
      doc.moveDown();
    });

    // Signature footer
    doc.moveDown(2);
    doc.strokeColor("#DDDDDD").moveTo(48, doc.y).lineTo(548, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor("#444444").text(`Integrity Signature: ${signed.sig}`);
    doc.text(`Signed Payload: ${signed.body}`);
    doc.text(`Tamper Notice: Any mismatch between payload and signature invalidates document trust.`);

    doc.end();
  });
}
