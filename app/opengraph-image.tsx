// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'
export default function() {
  return new ImageResponse(<div>Test OG Image</div>)
}
