// components/mdx-components.tsx (FULLY ROBUST FINAL VERSION)

import dynamic from 'next/dynamic';
import Image from 'next/image';
import * as React from 'react';
import type { MDXRemoteProps } from 'next-mdx-remote'; 

// --- Import All Dynamic Modules ---
const BrandFrame = dynamic(() => import('@/components/print/BrandFrame'), { ssr: false });
const EmbossedBrandMark = dynamic(() => import('@/components/print/EmbossedBrandMark'), { ssr: false });
const EmbossedSign = dynamic(() => import('@/components/print/EmbossedSign'), { ssr: false });
const Rule = dynamic(() => import('@/components/mdx/Rule'), { ssr: false });
const PullLine = dynamic(() => import('@/components/mdx/PullLine'), { ssr: false });
const Note = dynamic(() => import('@/components/mdx/Note'), { ssr: false });
const ResourcesCTA = dynamic(() => import('@/components/mdx/ResourcesCTA'), { ssr: false });
const Verse = dynamic(() => import('@/components/mdx/Verse'), { ssr: false });
const JsonLd = dynamic(() => import('@/components/mdx/JsonLd'), { ssr: false });
const DownloadCard = dynamic(() => import('@/components/mdx/DownloadCard'), { ssr: false }); 
const Caption = dynamic(() => import('@/components/mdx/Caption'), { ssr: false });
const CTA = dynamic(() => import('@/components/mdx/CTA'), { ssr: false });
const Callout = dynamic(() => import('@/components/mdx/Callout'), { ssr: false });
const HeroEyebrow = dynamic(() => import('@/components/mdx/HeroEyebrow'), { ssr: false });
const ShareRow = dynamic(() => import('@/components/mdx/ShareRow'), { ssr: false });
const Badge = dynamic(() => import('@/components/mdx/Badge'), { ssr: false });
const BadgeRow = dynamic(() => import('@/components/mdx/BadgeRow'), { ssr: false });


// --- Injected Components (Grid/Quote) ---
const Grid: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
    {children}
  </div>
);

const Quote: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <blockquote className={`border-l-4 border-muted-gold pl-4 italic text-gray-600 ${className}`}>
    {children}
  </blockquote>
);

/**
 * The map of components used by the MDXRenderer.
 */
const mdxComponents: MDXRemoteProps['components'] = {
  // Standard HTML tags
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // ✅ CRITICAL FIX: Destructure conflicting width/height props out.
    // This prevents the HTML attributes (string) from overriding the Next.js attributes (number).
    const { width, height, ...rest } = props;
    
    return (
      <Image 
        src={String(props.src)} 
        alt={props.alt ?? ''} 
        width={1200} // Use the hardcoded number
        height={800} // Use the hardcoded number
        sizes="(max-width: 768px) 100vw, 50vw" 
        loading="lazy" 
        {...rest} // Spread the rest of the non-conflicting props
        className="rounded-lg" 
      />
    );
  },
  hr: Rule,
  blockquote: Quote,

  // MDX Components (mapped to imported constants)
  BrandFrame,
  EmbossedBrandMark,
  EmbossedSign,
  Rule,
  PullLine,
  Note,
  Callout,
  ResourcesCTA,
  HeroEyebrow,
  ShareRow,
  Verse,
  Badge,
  BadgeRow,
  Caption,
  JsonLd,
  CTA,
  DownloadCard,
  Grid,
  Quote,
};

// CRITICAL FIX: Export the map explicitly and as default.
export { mdxComponents };
export default mdxComponents;