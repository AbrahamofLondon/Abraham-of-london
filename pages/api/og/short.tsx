import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Dynamic params from the short
    const title = searchParams.get('title') || 'Field Note';
    const category = searchParams.get('category') || 'INTEL';
    const readTime = searchParams.get('readTime') || '2 MIN';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#000',
            padding: '80px',
            position: 'relative',
          }}
        >
          {/* Topographic Background Texture Substitute */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.05,
              backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Branded Border */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '40px',
              right: '40px',
              bottom: '40px',
              border: '1px solid rgba(212, 175, 55, 0.1)',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10 }}>
            {/* Metadata Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '40px',
              }}
            >
              <div style={{ width: '40px', height: '1px', backgroundColor: '#D4AF37' }} />
              <span
                style={{
                  color: '#D4AF37',
                  fontSize: '18px',
                  fontWeight: 900,
                  letterSpacing: '0.5em',
                  textTransform: 'uppercase',
                }}
              >
                {category} // BRIEFING
              </span>
            </div>

            {/* Main Title */}
            <h1
              style={{
                fontSize: '100px',
                fontFamily: 'serif',
                fontStyle: 'italic',
                color: 'white',
                lineHeight: 1.1,
                marginBottom: '60px',
                maxWidth: '900px',
              }}
            >
              {title}.
            </h1>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '1000px',
                marginTop: 'auto',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', letterSpacing: '0.2em' }}>
                  ABRAHAM OF LONDON
                </span>
                <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '12px', marginTop: '5px' }}>
                  SECURE PROTOCOL v2.026
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                 <span style={{ color: 'rgba(212, 175, 55, 0.4)', fontSize: '16px', fontWeight: 'bold' }}>
                   {readTime} ANALYSIS
                 </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}