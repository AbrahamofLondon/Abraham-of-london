// components/mdx-components.tsx
import dynamic from 'next/dynamic';
import Image from 'next/image';

// ✅ FIX: Import all custom components used in your MDX files.
// Adjust the paths to where these components are actually located.
const BrandFrame = dynamic(() => import('@/components/print/BrandFrame'), { ssr: false });
const EmbossedBrandMark = dynamic(() => import('@/components/print/EmbossedBrandMark'), { ssr: false });
const Rule = dynamic(() => import('@/components/mdx/Rule'), { ssr: false });
const PullLine = dynamic(() => import('@/components/mdx/PullLine'), { ssr: false });
const Note = dynamic(() => import('@/components/mdx/Note'), { ssr: false });
const HeroEyebrow = dynamic(() => import('@/components/mdx/HeroEyebrow'), { ssr: false });
const ShareRow = dynamic(() => import('@/components/mdx/ShareRow'), { ssr: false });
const Verse = dynamic(() => import('@/components/mdx/Verse'), { ssr: false });
const Badge = dynamic(() => import('@/components/mdx/Badge'), { ssr: false });
const Caption = dynamic(() => import('@/components/mdx/Caption'), { ssr: false });

const mdxComponents = {
  // Standard HTML tags
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <Image src={String(props.src)} alt={props.alt ?? ''} width={1200} height={800} sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" {...props} className="rounded-lg" />
  ),
  hr: Rule,

  // ✅ FIX: Map all custom components here
  BrandFrame,
  EmbossedBrandMark,
  Rule,
  PullLine,
  Note,
  HeroEyebrow,
  ShareRow,
  Verse,
  Badge,
  Caption,
};

export default mdxComponents;