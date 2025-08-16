// lib/og.ts
/**
 * Return a high-contrast, crisp SVG data-URI cover image for any slug.
 * No build step, no filesystem writes, works with <Image> just fine.
 */
export function generatedCover(slug: string, title?: string): string {
  const h = Array.from(slug).reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381);
  const hue = h % 360;
  const hue2 = (hue + 35) % 360;
  const safeTitle = (title || slug).replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${safeTitle}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue},70%,18%)"/>
          <stop offset="100%" stop-color="hsl(${hue2},65%,14%)"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <text x="60" y="360" font-family="Georgia, 'Times New Roman', serif"
            font-size="96" font-weight="700" fill="rgba(255,255,255,.94)">
        ${safeTitle.replace(/&/g,"&amp;").replace(/</g,"&lt;")}
      </text>
      <text x="60" y="470" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
            font-size="36" fill="rgba(255,255,255,.75)">Abraham of London</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
