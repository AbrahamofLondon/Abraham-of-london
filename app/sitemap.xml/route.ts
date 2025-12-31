// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";

// Minimal, robust sitemap that includes /vault and /downloads
// (Does not depend on Contentlayer in runtime — avoids edge/runtime pitfalls.)
export async function GET() {
  const base = "https://www.abrahamoflondon.org";

  // Add core routes you always want indexed.
  const urls = [
    "/",
    "/vault",
    "/downloads",
    "/inner-circle",
    "/books",
    "/content",
  ];

  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (p) => `<url><loc>${base}${p}</loc><lastmod>${now}</lastmod></url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate",
    },
  });
}
