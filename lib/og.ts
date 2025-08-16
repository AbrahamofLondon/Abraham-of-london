// lib/og.ts
/**
 * Tiny, dependency-free cover "generator".
 * Returns a data: URL for an SVG with a nice gradient + title text.
 * Safe to feed directly to <Image src=... />.
 */

function hashHue(input: string): number {
  // Simple deterministic hash -> 0..359
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}

function slugToTitle(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export function generatedCover(slug: string, title?: string): string {
  const t = (title || slugToTitle(slug)).slice(0, 60);
  const hue = hashHue(slug);
  const hue2 = (hue + 35) % 360;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${t}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},70%,18%)"/>
        <stop offset="100%" stop-color="hsl(${hue2},65%,28%)"/>
      </linearGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feBlend mode="soft-light"/>
      </filter>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <g filter="url(#grain)" opacity="0.08"><rect width="1200" height="630" fill="#000"/></g>
    <text x="60" y="350" fill="white" font-family="Georgia, 'Times New Roman', serif"
          font-size="72" font-weight="700" letter-spacing="0.5" style="paint-order: stroke"
          stroke="rgba(0,0,0,0.25)" stroke-width="1">
      ${t.replace(/&/g,"&amp;").replace(/</g,"&lt;")}
    </text>
    <text x="60" y="430" fill="rgba(255,255,255,.85)" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
          font-size="28" letter-spacing="0.3">Abraham of London • Blog</text>
  </svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
