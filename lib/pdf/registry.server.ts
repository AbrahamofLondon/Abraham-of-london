// lib/pdf/registry.server.ts
import "server-only";
import fs from "fs";
import path from "path";
import { GENERATED_PDF_CONFIGS } from "./pdf-registry.generated";

export type PDFItem = (typeof GENERATED_PDF_CONFIGS)[number];

function fileExistsOnDisk(publicPath: string): boolean {
  // publicPath like "/assets/downloads/foo.pdf"
  const abs = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  try {
    return fs.existsSync(abs);
  } catch {
    return false;
  }
}

export function getAllPDFItemsServer(opts?: { includeMissing?: boolean }) {
  const includeMissing = Boolean(opts?.includeMissing);
  const items = Array.isArray(GENERATED_PDF_CONFIGS) ? [...GENERATED_PDF_CONFIGS] : [];

  // If exists field is already accurate, keep it; otherwise verify here.
  const normalized = items.map((x) => {
    const url = (x.outputPath || "").toString();
    const exists = typeof x.exists === "boolean" ? x.exists : fileExistsOnDisk(url);
    return { ...x, exists };
  });

  return includeMissing ? normalized : normalized.filter((x) => x.exists);
}