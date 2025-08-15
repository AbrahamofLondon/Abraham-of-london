// lib/og.ts
export function generatedCover(key: string): string {
  // Deterministic HSL based on key so covers vary nicely
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='hsl(${hue},70%,22%)'/>
        <stop offset='100%' stop-color='hsl(${(hue + 40) % 360},70%,35%)'/>
      </linearGradient>
    </defs>
    <rect width='1200' height='630' fill='url(#g)'/>
    <circle cx='980' cy='140' r='220' fill='rgba(255,255,255,0.07)'/>
    <text x='60' y='520' font-family='system-ui,Segoe UI,Roboto' font-size='80' fill='rgba(255,255,255,0.9)' font-weight='700'>
      Abraham of London
    </text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
