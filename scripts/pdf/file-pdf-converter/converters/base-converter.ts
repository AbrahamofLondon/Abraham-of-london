import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PDFDocument, rgb } from "pdf-lib";
import { PDF_CONFIG, FileDocument, DocumentTier, Format, Quality } from "../config";

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
    md5?: string;
  };
}

/**
 * BaseConverter — Production Grade
 * - Deterministic output paths (tier buckets)
 * - Atomic writes
 * - Strong metadata
 * - Tier watermark (subtle, premium)
 * - Integrity checks (header + size)
 */
export abstract class BaseConverter {
  abstract convert(document: FileDocument, tier: DocumentTier, format: Format, quality: Quality): Promise<ConversionResult>;

  protected ensureDir(p: string) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }

  protected async ensureTempDir(): Promise<string> {
    const base = PDF_CONFIG.tempDir;
    this.ensureDir(base);

    // unique subdir per run to prevent collisions
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const temp = path.join(base, `run-${runId}`);
    this.ensureDir(temp);
    return temp;
  }

  protected getOutputPath(document: FileDocument, tier: DocumentTier, format: Format, quality: Quality): string {
    // Prefer your modern public bucket structure if available
    // Otherwise fall back to PDF_CONFIG.outputDir
    const baseOut = PDF_CONFIG.outputDir;

    const fileName = `${document.pdfName}-${format.toLowerCase()}-${quality}.pdf`;

    // Place into tier folder for clean UX + deterministic precedence
    // e.g. outputDir/member/xxx.pdf, outputDir/architect/xxx.pdf
    const tierDir = tier?.slug ? String(tier.slug) : "free";

    return path.join(baseOut, tierDir, fileName);
  }

  protected async createPdfWithMetadata(document: FileDocument, tier: DocumentTier, quality: Quality): Promise<PDFDocument> {
    const pdfDoc = await PDFDocument.create();

    const title = String(document.displayName || document.pdfName || "Document");
    const tierName = String(tier?.displayName || tier?.slug || "Tier");
    const desc = String(document.description || "").trim();

    pdfDoc.setTitle(`${title} — ${tierName}`);
    pdfDoc.setAuthor("Abraham of London");
    if (desc) pdfDoc.setSubject(desc);

    pdfDoc.setKeywords([
      String(document.category || "downloads"),
      String(tier?.slug || "free"),
      String(quality || "premium"),
      String(document.fileType || "file"),
      "abraham-of-london",
      "converted",
    ]);

    pdfDoc.setProducer("Abraham of London — Enterprise PDF Converter");
    pdfDoc.setCreator(`File-to-PDF Converter (${String(document.fileType || "unknown")})`);
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    return pdfDoc;
  }

  protected md5Bytes(bytes: Uint8Array): string {
    return crypto.createHash("md5").update(Buffer.from(bytes)).digest("hex");
  }

  protected isPdfHeaderBytes(bytes: Uint8Array): boolean {
    if (!bytes || bytes.length < 4) return false;
    return Buffer.from(bytes.slice(0, 4)).toString("utf8") === "%PDF";
  }

  protected atomicWrite(absPath: string, bytes: Uint8Array) {
    this.ensureDir(path.dirname(absPath));
    const tmp = absPath.replace(/\.pdf$/i, `.__tmp__.pdf`);
    fs.writeFileSync(tmp, Buffer.from(bytes));
    fs.renameSync(tmp, absPath);
  }

  protected validatePdfOrThrow(absPath: string, minBytes = 8000) {
    if (!fs.existsSync(absPath)) throw new Error(`PDF missing at ${absPath}`);
    const st = fs.statSync(absPath);
    if (!st.isFile()) throw new Error(`Not a file: ${absPath}`);
    if (st.size < minBytes) throw new Error(`PDF too small (${st.size} bytes) at ${absPath}`);

    const fd = fs.openSync(absPath, "r");
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);

    if (buf.toString("utf8") !== "%PDF") throw new Error(`Invalid PDF header at ${absPath}`);
  }

  /**
   * Premium watermark rules:
   * - free: subtle "FREE VERSION"
   * - member: subtle "MEMBER"
   * - architect/inner-circle: subtle tier stamp
   */
  protected addWatermark(page: any, tier: DocumentTier) {
    const slug = String(tier?.slug || "free").toLowerCase();
    const { width, height } = page.getSize();

    const label =
      slug === "free"
        ? "FREE VERSION"
        : slug === "member"
          ? "MEMBER"
          : slug === "architect"
            ? "ARCHITECT"
            : slug === "inner-circle"
              ? "INNER CIRCLE"
              : slug.toUpperCase();

    // subtle diagonal watermark
    page.drawText(`ABRAHAM OF LONDON • ${label}`, {
      x: width * 0.12,
      y: height * 0.52,
      size: 26,
      color: rgb(0.90, 0.90, 0.92),
      opacity: 0.22,
      rotate: { type: "degrees", angle: 25 },
    });
  }
}