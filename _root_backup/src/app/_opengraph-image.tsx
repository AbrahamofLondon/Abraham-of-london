import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  // Load font data (alternative approach)
  const fontData = await fetch(
    new URL('https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYhQ.woff2')
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div tw="flex w-full h-full bg-black flex-col items-center justify-center p-10">
        {/* Main Title */}
        <div tw="flex text-7xl font-bold text-[#D4AF37] mb-6" style={{ fontFamily: 'Playfair' }}>
          Abraham of London
        </div>
        
        {/* Subtitle */}
        <div tw="text-4xl text-white mb-8" style={{ fontFamily: 'Playfair' }}>
          Luxury Brand Strategist
        </div>
        
        {/* Accent Elements */}
        <div tw="absolute bottom-8 right-8 text-2xl text-white/30">
          abrahamoflondon.org
        </div>
        
        {/* Decorative Elements */}
        <div tw="absolute top-0 left-0 w-full h-2 bg-[#D4AF37]"/>
        <div tw="absolute bottom-0 right-0 w-32 h-32 border-t-4 border-r-4 border-[#D4AF37]"/>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Playfair',
          data: fontData,
          style: 'normal',
        },
      ],
    }
  );
}