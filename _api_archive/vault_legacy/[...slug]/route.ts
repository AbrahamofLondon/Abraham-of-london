import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { decryptDocument } from '@/lib/security';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  // params.slug comes in as an array: ['blog', 'christianity-not-extremism']
  const slugPath = params.slug.join('/');
  
  try {
    const asset = await prisma.contentMetadata.findUnique({
      where: { slug: slugPath }
    });

    if (!asset || !asset.metadata) {
      return NextResponse.json(
        { error: `Asset [${slugPath}] not found.` },
        { status: 404 }
      );
    }

    const security = JSON.parse(asset.metadata);
    const decrypted = decryptDocument(
      security.content,
      security.iv,
      security.authTag
    );

    return NextResponse.json({
      ok: true,
      asset: {
        title: asset.title,
        content: decrypted,
        classification: asset.classification,
        updatedAt: asset.updatedAt
      }
    });

  } catch (error) {
    console.error(`[VAULT_FAILURE]:`, error);
    return NextResponse.json({ error: 'Decryption failed.' }, { status: 500 });
  }
}