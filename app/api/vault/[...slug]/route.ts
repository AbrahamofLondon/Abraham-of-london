import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Use the singleton
import { decryptDocument } from '@/lib/security';

/**
 * GET /api/vault/[...slug]
 * Secure retrieval and decryption of institutional assets.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const resolvedParams = await params;
  
  if (!resolvedParams.slug || resolvedParams.slug.length === 0) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const slugPath = resolvedParams.slug.join('/');
  console.log(`[VAULT_LOOKUP]: Requesting Asset >> ${slugPath}`);

  try {
    // 1. Interrogate Registry via Singleton
    const asset = await prisma.contentMetadata.findUnique({
      where: { slug: slugPath }
    });

    if (!asset) {
      console.warn(`[VAULT_MISSING]: ${slugPath} not in registry.`);
      return NextResponse.json({ error: 'Asset not found in Registry' }, { status: 404 });
    }

    // 2. Security Envelope Validation
    let security;
    try {
      security = typeof asset.metadata === 'string' 
        ? JSON.parse(asset.metadata) 
        : asset.metadata;
    } catch (e) {
      throw new Error("Registry metadata is malformed or corrupted.");
    }

    if (!security?.content || !security?.iv || !security?.authTag) {
      throw new Error("Incomplete security envelope (missing IV or AuthTag).");
    }

    // 3. Decryption Engine Execution
    let decrypted: string;
    try {
      decrypted = decryptDocument(
        security.content,
        security.iv,
        security.authTag
      );
    } catch (cryptoErr: any) {
      console.error(`[VAULT_DECRYPT_FAIL]: ${slugPath} - ${cryptoErr.message}`);
      return NextResponse.json({ 
        error: 'Security Handshake Failed', 
        details: 'Decryption failed. Check system encryption keys.' 
      }, { status: 403 });
    }

    // 4. Return Verified Payload
    return NextResponse.json({
      ok: true,
      asset: {
        title: asset.title,
        content: decrypted,
        classification: asset.classification,
        lastUpdated: asset.updatedAt,
        type: asset.type
      }
    });

  } catch (error: any) {
    console.error(`[VAULT_CRITICAL_ERROR]:`, error.message);
    return NextResponse.json({ 
      error: 'Internal System Failure', 
      details: error.message 
    }, { status: 500 });
  }
  // Note: No need for $disconnect() here when using a singleton pool
}