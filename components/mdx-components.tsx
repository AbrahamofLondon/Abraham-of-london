// components/mdx-components.tsx
import dynamic from 'next/dynamic';
import Image from 'next/image';
import * as React from 'react';

// --- Fixing Module Not Found Errors (Adjusting Paths) ---

// Assuming all basic MDX components are one level up, or correctly placed:
// (The error suggests '@/components/mdx/...' is wrong.)
const BrandFrame = dynamic(() => import('@/components/print/BrandFrame'), { ssr: false });
const Rule = dynamic(() => import('@/components/mdx/Rule'), { ssr: false });
const PullLine = dynamic(() => import('@/components/mdx/PullLine'), { ssr: false });
const Note = dynamic(() => import('@/components/mdx/Note'), { ssr: false });
const ResourcesCTA = dynamic(() => import('@/components/mdx/ResourcesCTA'), { ssr: false });
const Verse = dynamic(() => import('@/components/mdx/Verse'), { ssr: false });
const JsonLd = dynamic(() => import('@/components/mdx/JsonLd'), { ssr: false });
const EmbossedBrandMark = dynamic(() => import('@/components/print/EmbossedBrandMark'), { ssr: false });
const EmbossedSign = dynamic(() => import('@/components/print/EmbossedSign'), { ssr: false });


// Components that caused Fatal Errors (Need path verification):
// We must assume the files exist in these paths. If they don't, you must create them.
const Callout = dynamic(() => import('@/components/mdx/Callout'), { ssr: false });
const HeroEyebrow = dynamic(() => import('@/components/mdx/HeroEyebrow'), { ssr: false });
const ShareRow = dynamic(() => import('@/components/mdx/ShareRow'), { ssr: false });
const Badge = dynamic(() => import('@/components/mdx/Badge'), { ssr: false });
const BadgeRow = dynamic(() => import('@/components/mdx/BadgeRow'), { ssr: false });
const Caption = dynamic(() => import('@/components/mdx/Caption'), { ssr: false });
const CTA = dynamic(() => import('@/components/mdx/CTA'), { ssr: false });
const DownloadCard = dynamic(() => import('@/components/mdx/DownloadCard'), { ssr: false });

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

export default mdxComponents;