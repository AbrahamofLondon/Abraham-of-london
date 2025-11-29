// app/robots.txt/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const robots = `
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: https://www.abrahamoflondon.org/sitemap.xml
`.trim();

  return new NextResponse(robots, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
