import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

import { SecurePuppeteerPDFGenerator } from "./secure-puppeteer-generator";

function abs(p: string) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function ensureDirForFile(fileAbs: string) {
  fs.mkdirSync(path.dirname(fileAbs), { recursive: true });
}

// Minimal marked config for print (keeps <div class="page-break"></div>)
function configureMarked() {
  marked.setOptions({
    gfm: true,
    breaks: false,
    mangle: false,
    headerIds: true,
  });
}

async function main() {
  configureMarked();

  const src = abs("scripts/pdf/print-sources/ultimate-purpose-of-man-editorial.print.md");
  const out = abs("public/assets/downloads/ultimate-purpose-of-man-editorial.pdf");

  if (!fs.existsSync(src)) {
    throw new Error(`Missing print source: ${src}`);
  }

  const raw = fs.readFileSync(src, "utf8");
  const { data, content } = matter(raw);

  const title = String(data.title || "Document").trim();
  const subtitle = String(data.subtitle || "").trim() || undefined;
  const description = String(data.description || "").trim() || undefined;
  const tier = String(data.tier || "public").trim();
  const userId = "PUBLIC"; // or inject a real fingerprint per-user downstream

  // Convert markdown -> HTML body
  const htmlBody = String(await marked.parse(content));

  ensureDirForFile(out);

  const gen = new SecurePuppeteerPDFGenerator({
    timeout: 120_000,
    watchdogMs: 180_000,
    maxRetries: 2,
    headless: true,
    // respects env vars:
    // CHROME_PATH / PUPPETEER_EXECUTABLE_PATH
  });

  await gen.generateSecurePDF(htmlBody, out, {
    format: "A4",
    title,
    subtitle,
    description,
    tier,
    userId,
    // IMPORTANT: keep it premium (cover + typography)
    printBackground: true,
    blockExternalRequests: true,
    allowFileUrls: false,
    timeoutMs: 120_000,
    watchdogMs: 180_000,
  });

  await gen.close().catch(() => {});
  console.log(`✅ Flagship eBook PDF written: ${out}`);
}

main().catch((e) => {
  console.error("❌ Render failed:", e?.message || String(e));
  process.exit(1);
});