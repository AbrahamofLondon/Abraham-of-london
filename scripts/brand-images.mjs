// ===== LUXURY BRAND GATES (Deep Forest / Warm Cream / Muted Gold) =====
const BRAND = {
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
    ppi:    110,   // effective density (derived; heuristic)
  },

  // Aspect-ratio whitelists per placement
  aspect: {
    cover:  [1.3, 1.5, 1.6],  // ~4:3 → ~16:10
    hero:   [1.6, 1.77],      // 16:10 → 16:9
    card:   [1.3, 1.6],       // flexible cards
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
    vignette: 0.10,     // subtle edge falloff on generated fallback
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
