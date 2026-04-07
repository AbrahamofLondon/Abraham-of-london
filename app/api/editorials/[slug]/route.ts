// app/api/editorials/epub/[slug]/route.ts

import { NextResponse } from 'next/server';
import { getPublicationBySlug } from '@/lib/editorial/catalogue';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const publication = getPublicationBySlug(params.slug);
  if (!publication?.epubEnabled) {
    return new NextResponse('Not found', { status: 404 });
  }

  const epubPath = path.join(process.cwd(), 'public', 'epubs', `${params.slug}.epub`);
  
  try {
    const file = await fs.readFile(epubPath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${params.slug}.epub"`,
      },
    });
  } catch {
    return new NextResponse('EPUB not generated yet', { status: 404 });
  }
}