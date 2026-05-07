#!/usr/bin/env node

/**
 * Generate PDF from ABRAHAM_OF_LONDON_ENGINEERING_MANUAL.md using Puppeteer.
 * Renders Markdown → HTML → PDF with professional styling.
 */

import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import puppeteer from "puppeteer";

const INPUT = path.join(process.cwd(), "ABRAHAM_OF_LONDON_ENGINEERING_MANUAL.md");
const OUTPUT = path.join(process.cwd(), "ABRAHAM_OF_LONDON_ENGINEERING_MANUAL.pdf");

const md = fs.readFileSync(INPUT, "utf8");
const html = await marked.parse(md, { gfm: true, breaks: false });

const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 25mm 20mm 25mm 20mm;
    @bottom-center {
      content: counter(page);
      font-size: 9px;
      color: #666;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 11px;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 22px;
    font-weight: 700;
    color: #0a0a0a;
    border-bottom: 2px solid #c9a84c;
    padding-bottom: 8px;
    margin-top: 40px;
    margin-bottom: 16px;
    page-break-after: avoid;
  }
  h1:first-of-type {
    font-size: 28px;
    text-align: center;
    border-bottom: 3px solid #c9a84c;
    margin-top: 60px;
    margin-bottom: 24px;
  }
  h2 {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    border-bottom: 1px solid #e0d5b7;
    padding-bottom: 4px;
    margin-top: 28px;
    margin-bottom: 12px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    margin-top: 20px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }
  h4 {
    font-size: 11.5px;
    font-weight: 600;
    color: #444;
    margin-top: 16px;
    margin-bottom: 6px;
  }
  p { margin: 6px 0; }
  a { color: #6b5b3a; text-decoration: none; }
  strong { font-weight: 600; }
  code {
    font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 10px;
    background: #f5f2eb;
    padding: 1px 4px;
    border-radius: 3px;
    color: #5a4a2a;
  }
  pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 12px 14px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 9.5px;
    line-height: 1.5;
    margin: 10px 0;
    page-break-inside: avoid;
  }
  pre code {
    background: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 10px;
    page-break-inside: avoid;
  }
  th {
    background: #f5f2eb;
    font-weight: 600;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #e0d5b7;
    color: #3a3020;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #e8e2d5;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #faf8f4; }
  blockquote {
    margin: 12px 0;
    padding: 10px 14px;
    border-left: 3px solid #c9a84c;
    background: #faf8f4;
    font-size: 10.5px;
    page-break-inside: avoid;
  }
  blockquote strong { color: #6b5b3a; }
  ul, ol {
    margin: 6px 0;
    padding-left: 20px;
  }
  li { margin: 3px 0; }
  hr {
    border: none;
    border-top: 1px solid #e0d5b7;
    margin: 24px 0;
  }
  img { max-width: 100%; }
</style>
</head>
<body>
${html}
</body>
</html>`;

console.log("Launching Puppeteer...");
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
await page.setContent(styledHtml, { waitUntil: "networkidle0" });

console.log("Generating PDF...");
await page.pdf({
  path: OUTPUT,
  format: "A4",
  margin: { top: "25mm", right: "20mm", bottom: "25mm", left: "20mm" },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;color:#999;text-align:center;width:100%;font-family:system-ui,sans-serif;">Abraham of London — Engineering Manual v3.0</div>`,
  footerTemplate: `<div style="font-size:8px;color:#999;text-align:center;width:100%;font-family:system-ui,sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> &nbsp;|&nbsp; Internal — Engineering &nbsp;|&nbsp; May 2026</div>`,
});

await browser.close();

const stats = fs.statSync(OUTPUT);
console.log(`PDF generated: ${OUTPUT}`);
console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB`);
