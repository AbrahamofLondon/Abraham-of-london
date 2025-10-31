#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "fs";
import fsp from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DL_DIR = path.resolve(ROOT, "public", "downloads");
const COVERS_DIR = path.resolve(
  ROOT,
  "public",
  "assets",
  "images",
  "downloads",
);

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const MAKE_COVERS = !args.has("--no-covers");

// From validator errors: create these if missing
const MUST_HAVE = [
  "Fathering_Without_Fear_Teaser-A4.pdf",
  "Family_Altar_Liturgy.pdf",
  "Scripture_Track_John14.pdf",
  "Household_Rhythm_Starter.pdf",
  "Principles_for_My_Son.pdf",
  "Principles_for_My_Son_Cue_Card.pdf",
  "brotherhood-covenant.pdf",
  "brotherhood-cue-card.pdf",
  "fathering-without-fear.pdf",
  "standards-brief.pdf",
  "Fatherhood_Guide.pdf",
  "Fathering_Without_Fear_Teaser_Mobile.pdf",
  "fathering-without-fear-mobile.pdf",
  "Fathering_Without_Fear_Teaser_A4.pdf",
];

function escapePdfText(s) {
  return String(s).replace(/[()\\]/g, (m) => `\\${m}`);
}
function baseNoExt(n) {
  return n.replace(/\.pdf$/i, "");
}
function toKebab(n) {
  return baseNoExt(n)
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
function titleFrom(n) {
  return baseNoExt(n)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w.toUpperCase() === w ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function makePdfBuffer(titleLine, subtitleLine) {
  const objs = [];
  const header = "%PDF-1.4\n";
  objs.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objs.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objs.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
  );
  objs.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  );

  const lines = [
    `BT /F1 24 Tf 72 770 Td (${escapePdfText(titleLine)}) Tj ET`,
    `BT /F1 14 Tf 72 740 Td (${escapePdfText(subtitleLine)}) Tj ET`,
    `BT /F1 11 Tf 72 720 Td (This placeholder will be replaced by the premium PDF.) Tj ET`,
  ];
  for (let i = 0; i < 220; i++)
    lines.push(`BT /F1 10 Tf 72 ${700 - i * 2} Td (•) Tj ET`);
  const stream = lines.join("\n") + "\n";
  const content = `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`;
  objs.push(content);

  const parts = [header];
  const offsets = [0];
  let pos = header.length;
  for (const obj of objs) {
    offsets.push(pos);
    parts.push(obj);
    pos += Buffer.byteLength(obj, "utf8");
  }
  const xrefStart = pos;
  const count = objs.length + 1;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < count; i++)
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  const trailer = `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  parts.push(xref, trailer);
  return Buffer.from(parts.join(""), "utf8");
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}
async function writePdfIfMissing(name, force) {
  const p = path.join(DL_DIR, name);
  if (!force && fs.existsSync(p)) return false;
  const buf = makePdfBuffer("Abraham of London", `Placeholder - ${name}`);
  await fsp.writeFile(p, buf);
  return true;
}
function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
async function writeCoverIfMissing(name, force) {
  const dest = path.join(COVERS_DIR, `${toKebab(name)}.jpg`);
  if (!force && fs.existsSync(dest)) return false;
  const title = titleFrom(name);
  const svg = `
  <svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1214"/><stop offset="1" stop-color="#14181b"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <text x="80" y="140" fill="#d9c8a1" font-family="Georgia, serif" font-size="42">Abraham of London</text>
    <text x="80" y="240" fill="#eae6df" font-family="Georgia, serif" font-size="64" font-weight="700">${escapeXml(title)}</text>
    <rect x="80" y="280" width="720" height="6" fill="#c9a552"/>
    <text x="80" y="360" fill="#c7c7c7" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, sans-serif" font-size="28">Download - ${escapeXml(name)}</text>
    <text x="80" y="820" fill="#9aa3aa" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, sans-serif" font-size="22">Placeholder artwork - will be replaced</text>
  </svg>`.trim();
  await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(dest);
  return true;
}

async function main() {
  await ensureDir(DL_DIR);
  await ensureDir(COVERS_DIR);
  let created = 0,
    covered = 0;

  for (const name of MUST_HAVE) {
    if (await writePdfIfMissing(name, FORCE)) {
      created++;
      console.log(` Created placeholder PDF: ${name}`);
    }
    if (MAKE_COVERS && (await writeCoverIfMissing(name, FORCE))) {
      covered++;
      console.log(
        `️  Created cover: assets/images/downloads/${toKebab(name)}.jpg`,
      );
    }
  }

  if (MAKE_COVERS) {
    const all = (await fsp.readdir(DL_DIR)).filter((f) =>
      f.toLowerCase().endsWith(".pdf"),
    );
    for (const f of all) {
      if (await writeCoverIfMissing(f, false)) {
        covered++;
        console.log(
          `️  Created cover: assets/images/downloads/${toKebab(f)}.jpg`,
        );
      }
    }
  }

  console.log(
    `\n✅ Done. PDFs created: ${created}, covers created: ${covered}`,
  );
}

main().catch((e) => {
  console.error(`\n FATAL: ${e.stack || e.message}`);
  process.exit(1);
});
