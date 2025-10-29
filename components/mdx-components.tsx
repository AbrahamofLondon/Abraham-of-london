import dynamic from 'next/dynamic';
import Image from 'next/image';

// Proactively Dynamic Imports for stability and crash prevention (ssr: false)
const BrandFrame = dynamic(() => import('@/components/print/BrandFrame.tsx'), { ssr: false });
const EmbossedBrandMark = dynamic(() => import('@/components/print/EmbossedBrandMark.tsx'), { ssr: false });
const EmbossedSign = dynamic(() => import('@/components/print/EmbossedSign.tsx'), { ssr: false });

// 🏆 Proactively adding all known MDX shortcodes that use client logic or need tracing
const ResourcesCTA = dynamic(() => import('@/components/mdx/ResourcesCTA.tsx'), { ssr: false }); 
const CTA = dynamic(() => import('@/components/mdx/CTA.tsx'), { ssr: false });
const Note = dynamic(() => import('@/components/mdx/Note.tsx'), { ssr: false });
const Rule = dynamic(() => import('@/components/mdx/Rule.tsx'), { ssr: false });

// CRITICAL FIXES: Adding components that caused the current error (PullLine) and your suggestion (Callout)
const PullLine = dynamic(() => import('@/components/mdx/PullLine.tsx'), { ssr: false });
const Callout = dynamic(() => import('@/components/mdx/Callout.tsx'), { ssr: false });


const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mdx-content-wrapper">{children}</div>
);

export const MDXComponents = {
    // Standard and Safe Components
    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
        <Image src={String(props.src)} alt={props.alt ?? ''} width={1200} height={800} style={{ height: 'auto', width: '100%' }} sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" {...props} />
    ),
    hr: (p: React.HTMLAttributes<HTMLHRElement>) => <hr {...p} />,
    wrapper: Wrapper,

    // Dynamically Imported Client Components
    BrandFrame,
    EmbossedBrandMark,
    EmbossedSign,
    ResourcesCTA,
    CTA,
    Note,
    Rule,
    PullLine,
    Callout,
};
export default MDXComponents;