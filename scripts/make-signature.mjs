// scripts/make-signature.mjs
// Generates AbrahamOfLondon cursive signature as PNG (transparent) and JPG (white bg).
// Uses an OFL/Apache-licensed script font you provide at:
//   assets/fonts/Signature.ttf   (e.g. "Great Vibes", "Allura", "Dancing Script", etc.)
//
// Usage:
//   node scripts/make-signature.mjs
//
// Outputs:
//   public/brand/signature/AbrahamOfLondon-signature.png
//   public/brand/signature/AbrahamOfLondon-signature.jpg
//
// Tuning flags:
//   --text "Abraham of London"    (default "Abraham of London")
//   --size  840                   (font size px)
//   --pad   80                    (padding px)
//   --color "#0B1221"             (ink color)
//   --bg "#FFFFFF"                (JPEG background, PNG stays transparent)

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const argv = process.argv.slice(2);
const VAL = (f, def=null) => { const i = argv.indexOf(f); return i>-1 ? argv[i+1] : def; };

const TEXT  = VAL('--text', 'Abraham of London');
const SIZE  = Number(VAL('--size', '840'));
const PAD   = Number(VAL('--pad', '80'));
const COLOR = VAL('--color', '#0B1221');
const BG    = VAL('--bg', '#FFFFFF');

const FONT_PATH = path.join(process.cwd(), 'assets/fonts/Signature.ttf');
const OUT_DIR   = path.join(process.cwd(), 'public/brand/signature');
fs.mkdirSync(OUT_DIR, { recursive: true });

// SVG using embedded @font-face to ensure rendering with sharp
const svg = (w,h) => `
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

async function main() {
  if (!fs.existsSync(FONT_PATH)) {
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
  fs.writeFileSync(outPng, pngPadded);

  // Also create a high-quality JPEG on white for places that need JPEG
  const outJpg = path.join(OUT_DIR, 'AbrahamOfLondon-signature.jpg');
  await sharp(pngPadded)
    .flatten({ background: BG })
    .jpeg({ quality: 96, mozjpeg: true })
    .toFile(outJpg);

  console.log('Signature saved:\n ', path.relative(process.cwd(), outPng), '\n ', path.relative(process.cwd(), outJpg));
}

main().catch((e)=>{ console.error(e); process.exit(2); });
