// components/mdx-components.tsx
import dynamic from 'next/dynamic';
import Image from 'next/image';

// NOTE: Ensure the paths to these components are correct for your project.
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
const Caption = dynamic(() => import('@/components/mdx/Caption'), { ssr: false });
// ✅ FIX: Corrected the import path from '@/components/JsonLd' to '@/components/mdx/JsonLd'
const JsonLd = dynamic(() => import('@/components/mdx/JsonLd'), { ssr: false });

const mdxComponents = {
  // Standard HTML tags
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <Image src={String(props.src)} alt={props.alt ?? ''} width={1200} height={800} sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" {...props} className="rounded-lg" />
  ),
  hr: Rule,

  // Custom components mapped for MDX
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
  Caption,
  JsonLd,
};

export default mdxComponents;