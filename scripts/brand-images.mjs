// constants/brand-gates.mjs (Suggested file name)

import sharp from 'sharp';

// ===== LUXURY BRAND GATES (Deep Forest / Warm Cream / Muted Gold) =====
export const BRAND = {
  // Palette anchors for ΔE checks (OKLab) — include light & dark tokens
  palette: [
    '#0B2E1F', // deep-forest (primary)
    '#16573D', // deep-forest hover
    '#FAF7F2', // warm-cream (bg, light surfaces)
    '#333333', // soft-charcoal (body text)
    '#C5A352', // muted-gold (accent)
    '#A0833F', // muted-gold hover
    '#4B8B6B', // subtle-green (bullets/accents)
  ],

  // How strict the palette match should be:
  // ΔE (OK) thresholds: lower = stricter. We use a two-tier check.
  deltaE_primary: 14,  // headings, big brand surfaces
  deltaE_secondary: 18, // images broadly should sit near palette range

  // Resolution floor for “hero/cover” style assets
  min: {
    width:  1200,
    height: 800,
    ppi:    110,    // effective density (derived; heuristic)
  },

  // Aspect-ratio whitelists per placement
  aspect: {
    cover:  [1.3, 1.5, 1.6],  // ~4:3 → ~16:10
    hero:   [1.6, 1.77],      // 16:10 → 16:9
    card:   [1.3, 1.6],        // flexible cards
    square: [1.0],            // icons/thumbs
  },

  // Compression targets (keeps crisp serif & soft paper feel)
  jpeg: { quality: 86, mozjpeg: true },
  webp: { quality: 82, effort: 5 },
  png:  { compressionLevel: 9 },

  // Auto-upgrade policy
  // - only upscale ≤ 1.6x if we can sharpen safely
  // - auto-generate tasteful fallback if file is missing/broken
  upgrade: {
    allowUpscaleFactor: 1.6,
    sharpenSigma: 1.0,
    vignette: 0.10,    // subtle edge falloff on generated fallback
    paperNoise: 0.035,  // gentle texture on fallback
  },

  // File volume limits
  maxKB: {
    hero:  450,
    cover: 380,
    card:  220,
    thumb: 80,
  }
};

// Gentle forest→cream gradient with muted-gold title stripe
export async function generateLuxuryFallback({ w = 1600, h = 1000, title = 'Abraham of London', subtitle = '' }) {
  // Use constants from the BRAND object for consistency
  const forest = BRAND.palette[0];
  const cream = BRAND.palette[2];
  const gold = BRAND.palette[4];

  const svg = `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${cream}" />
        <stop offset="100%" stop-color="${forest}" />
      </linearGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="${BRAND.upgrade.paperNoise}"/> 
        </feComponentTransfer>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="${Math.round(h * 0.18)}" y="${Math.round(h * 0.12)}" fill="${gold}" opacity="0.9" />
    <g filter="url(#grain)">
      <rect width="100%" height="100%" fill="rgba(0,0,0,0)"/>
    </g>
    <g font-family="'Playfair Display', Georgia, serif" fill="#111" text-anchor="middle">
      <text x="${w / 2}" y="${Math.round(h * 0.21)}" font-size="${Math.round(h * 0.09)}" font-weight="700" fill="#0B2E1F">${title}</text>
      ${subtitle ? `<text x="${w / 2}" y="${Math.round(h * 0.32)}" font-size="${Math.round(h * 0.045)}" fill="#333">${subtitle}</text>` : ''}
    </g>
  </svg>`;
  
  const buf = Buffer.from(svg);
  
  // Use quality settings from BRAND object
  return sharp(buf)
    .jpeg(BRAND.jpeg)
    .toBuffer();
}