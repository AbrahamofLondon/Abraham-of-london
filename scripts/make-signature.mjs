// scripts/make-signature.mjs
// Generates AbrahamOfLondon cursive signature as PNG (transparent) and JPG (white bg).
// Uses an OFL/Apache-licensed script font you provide at:
//    assets/fonts/Signature.ttf
//
// Usage:
//    node scripts/make-signature.mjs
//
// Outputs:
//    public/brand/signature/AbrahamOfLondon-signature.png
//    public/brand/signature/AbrahamOfLondon-signature.jpg
//
// Tuning flags:
//    --text "Abraham of London"     (default "Abraham of London")
//    --size  880                    (font size px)
//    --pad   100                    (padding px)
//    --color "#0B2E1F"              (ink color)
//    --bg    "#FAF7F2"              (JPEG background, PNG stays transparent)

import fsp from 'node:fs/promises';
import { constants } from 'node:fs';
import path from "path";
import sharp from 'sharp';

const argv = process.argv.slice(2);
const VAL = (f, def = null) => { const i = argv.indexOf(f); return i > -1 ? argv[i + 1] : def; };

const TEXT  = VAL('--text', 'Abraham of London');
const SIZE  = Number(VAL('--size', '880'));      // slightly larger for luxe feel
const PAD   = Number(VAL('--pad', '100'));       // more breathing room
const COLOR = VAL('--color', '#0B2E1F');         // Deep Forest ink
const BG    = VAL('--bg', '#FAF7F2');            // Warm Cream background for JPG

const FONT_PATH = path.join(process.cwd(), 'assets/fonts/Signature.ttf');
const OUT_DIR   = path.join(process.cwd(), 'public/brand/signature');

// SVG using embedded @font-face to ensure rendering with sharp
const svg = (w, h) => `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: "Signature";
        src: url("file://${FONT_PATH}") format("truetype");
      }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="none"/>
  <g>
    <text x="50%" y="50%" fill="${COLOR}" font-family="Signature, 'Great Vibes', 'Allura', 'Dancing Script', cursive"
          font-size="${SIZE}" font-weight="400" dominant-baseline="middle" text-anchor="middle">
      ${TEXT}
    </text>
  </g>
</svg>
`;

async function fileExists(filePath) {
  try {
    await fsp.access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true }); // Use async mkdir

  if (!(await fileExists(FONT_PATH))) {
    console.error(`Font not found at ${FONT_PATH}
Please add an open-licensed cursive TTF as assets/fonts/Signature.ttf (e.g., OFL: Great Vibes).`);
    process.exit(1);
  }

  // Start with a large canvas; sharp will trim and add padding.
  const W = Math.round(SIZE * 8);
  const H = Math.round(SIZE * 2.5);

  const svgBuf = Buffer.from(svg(W, H));

  // Rasterize SVG to PNG, trim, then extend padding (transparent)
  let img = sharp(svgBuf).png();
  const trimmed = await img.trim(10).toBuffer(); // remove empty margins

  // Add padding on all sides
  const pngPadded = await sharp(trimmed)
    .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r:0, g:0, b:0, alpha:0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const outPng = path.join(OUT_DIR, 'AbrahamOfLondon-signature.png');
  await fsp.writeFile(outPng, pngPadded); // Use async writeFile

  // Also create a high-quality JPEG on white for places that need JPEG
  const outJpg = path.join(OUT_DIR, 'AbrahamOfLondon-signature.jpg');
  await sharp(pngPadded)
    .flatten({ background: BG })
    .jpeg({ quality: 96, mozjpeg: true })
    .toFile(outJpg); // sharp's toFile is already promise-based

  console.log('Signature saved:\n ', path.relative(process.cwd(), outPng), '\n ', path.relative(process.cwd(), outJpg));
}

main().catch((e) => { console.error(e); process.exit(2); });