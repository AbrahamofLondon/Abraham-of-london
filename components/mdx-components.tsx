// components/mdx-components.tsx
import dynamic from 'next/dynamic';
import Image from 'next/image';
import * as React from 'react';

// --- Fix: Assuming these components exist in the project root /components/ ---
// If the actual files are in /components/mdx/, the path is correct.
// The failure suggests the components are simply missing from the project entirely.
// We must assume the path alias @/components/mdx/ is correct and the files must exist.

// Standard components you already have:
const BrandFrame = dynamic(() => import('@/components/print/BrandFrame'), { ssr: false });
const Rule = dynamic(() => import('@/components/mdx/Rule'), { ssr: false });
const PullLine = dynamic(() => import('@/components/mdx/PullLine'), { ssr: false });
const Note = dynamic(() => import('@/components/mdx/Note'), { ssr: false });
const Verse = dynamic(() => import('@/components/mdx/Verse'), { ssr: false });
const Caption = dynamic(() => import('@/components/mdx/Caption'), { ssr: false });
const JsonLd = dynamic(() => import('@/components/mdx/JsonLd'), { ssr: false });
const CTA = dynamic(() => import('@/components/mdx/CTA'), { ssr: false });
const DownloadCard = dynamic(() => import('@/components/mdx/DownloadCard'), { ssr: false });

// Missing components confirmed by the log:
const Callout = dynamic(() => import('@/components/mdx/Callout'), { ssr: false });
const HeroEyebrow = dynamic(() => import('@/components/mdx/HeroEyebrow'), { ssr: false });
const ShareRow = dynamic(() => import('@/components/mdx/ShareRow'), { ssr: false });
const Badge = dynamic(() => import('@/components/mdx/Badge'), { ssr: false });
const BadgeRow = dynamic(() => import('@/components/mdx/BadgeRow'), { ssr: false });
const EmbossedBrandMark = dynamic(() => import('@/components/print/EmbossedBrandMark'), { ssr: false });
const EmbossedSign = dynamic(() => import('@/components/print/EmbossedSign'), { ssr: false });


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

const mdxComponents = {
  // Standard HTML tags
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <Image src={String(props.src)} alt={props.alt ?? ''} width={1200} height={800} sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" {...props} className="rounded-lg" />
  ),
  hr: Rule,
  blockquote: Quote,

  // MDX Components
  BrandFrame,
  EmbossedBrandMark,
  EmbossedSign,
  Rule,
  PullLine,
  Note,
  Callout,
  HeroEyebrow,
  ShareRow,
  Verse,
  Badge,
  BadgeRow,
  Caption,
  JsonLd: dynamic(() => import('@/components/mdx/JsonLd'), { ssr: false }), // Ensure JsonLd is handled correctly
  CTA,
  DownloadCard,
  Grid,
  Quote,
};

export default mdxComponents;