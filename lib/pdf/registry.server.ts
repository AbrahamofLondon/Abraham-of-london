// lib/pdfs/registry.server.ts — SERVER ONLY
import fs from "fs";
import path from "path";
import type { PDFConfig } from "./registry";
import { getAllPDFs } from "./registry";

function toFsPathFromWebPath(webPath: string): string {
  const clean = (webPath || "").trim().replace(/^\/+/, "");
  return path.join(process.cwd(), "public", clean);
}

export function fileExistsForPdf(pdf: PDFConfig): boolean {
  try {
    const abs = toFsPathFromWebPath(pdf.outputPath);
    const st = fs.statSync(abs);
    return st.isFile();
  } catch {
    return false;
  }
}

export function getMissingPdfsServer(): PDFConfig[] {
  return getAllPDFs({ includeMissing: true }).filter((p) => !fileExistsForPdf(p));
}