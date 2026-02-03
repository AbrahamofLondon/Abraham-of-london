// lib/og.ts - Fixed version with static imports
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getAllContentlayerDocs, getDocBySlug } from "@/lib/content/server";
import { getDocKind, getDocHref } from "@/lib/content/shared";

export const runtime = 'edge';

// Helper function to generate OG image for a document
export async function generateDocumentOgImage(
  slug: string,
  options?: {
    title?: string;
    description?: string;
    type?: string;
  }
): Promise<ImageResponse> {
  // Try to get the document first
  let doc = null;
  try {
    doc = getDocBySlug(slug);
  } catch (error) {
    console.error(`Error getting document for OG image: ${slug}`, error);
  }

  const title = options?.title || doc?.title || 'Untitled';
  const description = options?.description || doc?.description || doc?.excerpt || '';
  const type = options?.type || (doc ? getDocKind(doc) : 'document');
  
  // Generate the image
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', marginBottom: '40px' }}>
          <div style={{ fontSize: '72px', fontWeight: 'bold' }}>Sovereign</div>
        </div>
        
        <div style={{ fontSize: '48px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
          {title}
        </div>
        
        {description && (
          <div style={{ fontSize: '28px', textAlign: 'center', opacity: 0.8 }}>
            {description}
          </div>
        )}
        
        <div style={{ position: 'absolute', bottom: '40px', right: '40px', fontSize: '24px' }}>
          {type}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

// Generate OG image for index/home page
export async function generateIndexOgImage(): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', marginBottom: '40px' }}>
          <div style={{ fontSize: '72px', fontWeight: 'bold' }}>Sovereign</div>
        </div>
        
        <div style={{ fontSize: '48px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
          Institutional Intelligence Platform
        </div>
        
        <div style={{ fontSize: '28px', textAlign: 'center', opacity: 0.8 }}>
          Strategic insights for frontier markets and institutional resilience
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

// API route handler for dynamic OG images
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const title = searchParams.get('title');
  const description = searchParams.get('description');
  const type = searchParams.get('type');

  try {
    if (slug) {
      return await generateDocumentOgImage(slug, {
        title: title || undefined,
        description: description || undefined,
        type: type || undefined,
      });
    }
    
    // Default to index image
    return await generateIndexOgImage();
  } catch (error) {
    console.error('Error generating OG image:', error);
    // Return a fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>Sovereign OS</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}

// Helper to get all OG image URLs for sitemap
export function getAllOgImageUrls(): string[] {
  const docs = getAllContentlayerDocs();
  return docs
    .filter(doc => getDocKind(doc) !== 'short') // Exclude shorts if needed
    .map(doc => {
      const slug = doc.slug || doc._raw?.flattenedPath || '';
      return `/api/og?slug=${encodeURIComponent(slug)}`;
    });
}