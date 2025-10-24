// scripts/covers/make-event-covers.mjs
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getAllEvents } from "../../lib/server/events-data.js";

const OUT_DIR = path.join(process.cwd(), "public", "assets", "images", "events");
await fs.mkdir(OUT_DIR, { recursive: true });

const BRAND = {
  bg: "#0D0D0D",
  gold: "#D4AF37",
  ink: "#FAFAF9",
  pad: 96,              // inner padding
  width: 1920,
  height: 1080,
  titleSize: 128,
  subtitleSize: 48,
  keyline: true,
};

const esc = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function svgCover({ title, subtitle }) {
  const { width, height, pad, bg, gold, ink, titleSize, subtitleSize, keyline } = BRAND;
  const innerW = width - pad*2, innerH = height - pad*2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  ${keyline ? `<rect x="32" y="32" width="${width-64}" height="${height-64}" fill="none" stroke="${gold}" stroke-width="4" rx="12"/>` : ""}
  <g transform="translate(${pad},${pad})">
    <text x="${innerW/2}" y="${innerH/2 - 32}" fill="${ink}" font-family="Georgia, 'Times New Roman', serif"
          font-size="${titleSize}" font-weight="700" text-anchor="middle">${esc(title)}</text>
    ${subtitle ? `<text x="${innerW/2}" y="${innerH/2 + 56}" fill="${ink}" opacity="0.85"
            font-family="Georgia, 'Times New Roman', serif" font-size="${subtitleSize}" text-anchor="middle">${esc(subtitle)}</text>` : ""}
    <text x="${innerW - 8}" y="${innerH - 8}" fill="${gold}" font-family="Georgia, 'Times New Roman', serif"
          font-size="28" text-anchor="end">EST. MMXXIV</text>
  </g>
</svg>`;
}

function deriveSubtitle(title) {
  // optional helper; keep it simple
  return title.includes("Founders’ Salon") ? "Clarity, Capital, and Character" : "Standards that Endure";
}

const events = getAllEvents(["slug","title","heroImage"]);
for (const ev of events) {
  const slug = ev.slug;
  const explicit = ev.heroImage && String(ev.heroImage).trim();
  const outPath = path.join(OUT_DIR, `${slug}.jpg`);

  if (explicit) continue; // manual cover declared
  try { await fs.access(outPath); continue; } catch {}

  const svg = svgCover({ title: ev.title, subtitle: deriveSubtitle(ev.title) });
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  await fs.writeFile(outPath, buf);
  console.log("🖼️  cover created:", path.relative(process.cwd(), outPath));
}
