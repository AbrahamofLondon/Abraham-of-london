import fs from "fs";
import path from "path";

import { sourceFilesForLinkScan, writeJsonReport } from "./pdf-audit-shared";

type RewriteRecord = {
  file: string;
  from: string;
  to: string;
};

const PUBLIC_PDF_URL_PATTERN = /\/[A-Za-z0-9_./~%+-]+\.pdf\b/g;

function isUiSource(relFile: string): boolean {
  const normalized = relFile.replace(/\\/g, "/");
  if (/^(app|pages)\/api\//.test(normalized)) return false;
  return /^(app|pages|components|content)\//.test(normalized);
}

function toDownloadPage(url: string): string {
  const filename = url.split("/").pop() || "";
  const slug = filename.replace(/\.pdf$/i, "");
  return slug ? `/downloads/${slug}` : url;
}

const rewrites: RewriteRecord[] = [];

for (const absFile of sourceFilesForLinkScan()) {
  const relFile = path.relative(process.cwd(), absFile).replace(/\\/g, "/");
  if (!isUiSource(relFile)) continue;

  const original = fs.readFileSync(absFile, "utf8");
  const next = original.replace(PUBLIC_PDF_URL_PATTERN, (match) => {
    const replacement = toDownloadPage(match);
    if (replacement !== match) {
      rewrites.push({ file: relFile, from: match, to: replacement });
    }
    return replacement;
  });

  if (next !== original) {
    fs.writeFileSync(absFile, next, "utf8");
  }
}

const out = writeJsonReport("pdf-link-rewrite-report.json", {
  generatedAt: new Date().toISOString(),
  totals: {
    rewrites: rewrites.length,
    files: new Set(rewrites.map((rewrite) => rewrite.file)).size,
  },
  rewrites,
});

console.log("[pdf:rewrite-links] wrote", path.relative(process.cwd(), out));
console.log("[pdf:rewrite-links] rewrites", rewrites.length);
