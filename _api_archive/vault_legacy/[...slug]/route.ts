import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> } // Awaiting params is best practice in Next 15+
) {
  // Ensure params are resolved
  const resolvedParams = await params;
  const slugPath = resolvedParams.slug.join('/');
  
  try {
    // 1. ATOMIC UPDATE & FETCH
    const asset = await prisma.contentMetadata.update({
      where: { slug: slugPath },
      data: { 
        viewCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // 2. CLASSIFICATION GATE
    const classification = asset.classification.toLowerCase();
    const isGated = ['private', 'restricted'].includes(classification);

    // 3. AUDIT LOGGING (Non-blocking)
    // FIX: Added explicit type (Error) to the catch parameter
    prisma.systemAuditLog.create({
      data: {
        action: 'ACCESS_ASSET',
        resourceId: asset.id,
        resourceType: asset.contentType,
        metadata: JSON.stringify({ slug: slugPath, classification }),
        status: 'success'
      }
    }).catch((err: Error) => console.error("Audit failed:", err.message));

    // 4. SECURITY & PREVIEW LOGIC
    if (isGated) {
      if (asset.metadata) {
        try {
          // If authorized (Authorization header logic would go here)
          return NextResponse.json({
            ok: true,
            gated: true,
            classification: asset.classification,
            asset: {
              title: asset.title,
              preview: asset.summary || "Institutional preview restricted.",
              content: null 
            }
          });
        } catch (e) {
          console.error("Decryption trigger failed", e);
        }
      }
    }

    // 5. PUBLIC ACCESS RETURN
    return NextResponse.json({
      ok: true,
      gated: false,
      asset: {
        title: asset.title,
        content: asset.content,
        classification: asset.classification,
        metrics: {
          views: asset.viewCount,
          downloads: asset.totalDownloads
        }
      }
    });

  } catch (error: any) {
    console.error("Vault API Error:", error.message);
    return NextResponse.json({ error: "Institutional Access Error" }, { status: 500 });
  }
}