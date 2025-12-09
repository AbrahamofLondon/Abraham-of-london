// app/robots.txt/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: https://www.abrahamoflondon.org/sitemap.xml`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate',
    },
  });
}