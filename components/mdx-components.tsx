// components/mdx-components.tsx
import dynamic from 'next/dynamic';
import Image from 'next/image';
import * as React from 'react';
import type { MDXRemoteProps } from 'next-mdx-remote'; 

// Error boundary for MDX components
const withErrorBoundary = (Component: React.ComponentType<any>) => {
  return (props: any) => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      console.warn('MDX component error:', error);
      return React.createElement('div', { 
        className: 'bg-yellow-50 border border-yellow-200 p-4 rounded'
      }, `Component: ${Component.displayName || 'Unknown'}`);
    }
  };
};

// --- Import All Dynamic Modules with Error Handling ---
const BrandFrame = dynamic(() => import('@/components/print/BrandFrame').catch(() => 
  () => <div className="border rounded p-4">Brand Frame Placeholder</div>
), { ssr: false });

const ResourcesCTA = dynamic(() => import('@/components/mdx/ResourcesCTA').catch(() => 
  () => <div className="bg-blue-50 p-4 rounded">Resources CTA Placeholder</div>
), { ssr: false });

// Placeholder components for any missing ones
const EmbossedBrandMark = () => <div>Embossed Brand Mark</div>;
const EmbossedSign = () => <div>Embossed Sign</div>;
const Rule = () => <hr className="my-8 border-gray-300" />;
const PullLine = ({ children }: any) => <div className="border-l-4 border-gold pl-4 my-4">{children}</div>;
const Note = ({ children }: any) => <div className="bg-yellow-50 border border-yellow-200 p-4 rounded my-4">{children}</div>;
const Verse = ({ children }: any) => <div className="italic text-gray-600 my-4">{children}</div>;
const JsonLd = () => null;
const DownloadCard = () => <div className="border rounded p-4 my-4">Download Card</div>;
const Caption = ({ children }: any) => <div className="text-sm text-gray-600 mt-2">{children}</div>;
const CTA = ({ children }: any) => <div className="bg-blue-100 p-4 rounded my-4">{children}</div>;
const Callout = ({ children }: any) => <div className="bg-purple-50 border border-purple-200 p-4 rounded my-4">{children}</div>;
const HeroEyebrow = ({ children }: any) => <div className="text-sm uppercase tracking-wider text-gray-500 mb-2">{children}</div>;
const ShareRow = () => <div className="my-4 p-4 bg-gray-100 rounded">Share Buttons</div>;
const Badge = ({ children }: any) => <span className="bg-gray-200 px-2 py-1 rounded text-sm">{children}</span>;
const BadgeRow = ({ children }: any) => <div className="flex gap-2 my-4">{children}</div>;

// --- Injected Components (Grid/Quote) ---
const Grid: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
    {children}
  </div>
);

const Quote: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <blockquote className={`border-l-4 border-yellow-400 pl-4 italic text-gray-600 ${className}`}>
    {children}
  </blockquote>
);

/**
 * The map of components used by the MDXRenderer.
 */
const mdxComponents: MDXRemoteProps['components'] = {
  // Standard HTML tags
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { width, height, ...rest } = props;
    
    return (
      <Image 
        src={String(props.src)} 
        alt={props.alt ?? ''} 
        width={1200}
        height={800}
        sizes="(max-width: 768px) 100vw, 50vw" 
        loading="lazy" 
        {...rest}
        className="rounded-lg" 
      />
    );
  },
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

export { mdxComponents };
export default mdxComponents;