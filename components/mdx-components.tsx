// components/mdx-components.tsx
import dynamic from 'next/dynamic';
import Image from 'next/image';

// --- Import all custom components used in your MDX files ---
// NOTE: Ensure these paths are correct for your project structure.
const BrandFrame = dynamic(() => import('@/components/print/BrandFrame'), { ssr: false });
const EmbossedBrandMark = dynamic(() => import('@/components/print/EmbossedBrandMark'), { ssr: false });
const EmbossedSign = dynamic(() => import('@/components/print/EmbossedSign'), { ssr: false });
const Rule = dynamic(() => import('@/components/mdx/Rule'), { ssr: false });
const PullLine = dynamic(() => import('@/components/mdx/PullLine'), { ssr: false });
const Note = dynamic(() => import('@/components/mdx/Note'), { ssr: false });
const Callout = dynamic(() => import('@/components/mdx/Callout'), { ssr: false });
const ResourcesCTA = dynamic(() => import('@/components/mdx/ResourcesCTA'), { ssr: false });
const HeroEyebrow = dynamic(() => import('@/components/mdx/HeroEyebrow'), { ssr: false });
const ShareRow = dynamic(() => import('@/components/mdx/ShareRow'), { ssr: false });
const Verse = dynamic(() => import('@/components/mdx/Verse'), { ssr: false });
const Badge = dynamic(() => import('@/components/mdx/Badge'), { ssr: false });
const BadgeRow = dynamic(() => import('@/components/mdx/BadgeRow'), { ssr: false });
const Caption = dynamic(() => import('@/components/mdx/Caption'), { ssr: false });
const JsonLd = dynamic(() => import('@/components/mdx/JsonLd'), { ssr: false });
const CTA = dynamic(() => import('@/components/mdx/CTA'), { ssr: false });

const mdxComponents = {
  // ✅ FIX: Use props.src directly. The assetPath helper was server-side.
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <Image src={String(props.src)} alt={props.alt ?? ''} width={1200} height={800} sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" {...props} className="rounded-lg" />
  ),
  hr: Rule,

  // Map all custom components
  BrandFrame,
  BadgeRow,
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
  Caption,
  JsonLd,
  CTA,
};

// ✅ FIX: Use a DEFAULT EXPORT to solve the import mismatch
export default mdxComponents;