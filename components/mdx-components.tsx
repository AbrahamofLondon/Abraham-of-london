// components/mdx-components.tsx
import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { MDXRemoteProps } from "next-mdx-remote";

/** Simple error boundary wrapper for MDX components */
const withErrorBoundary =
  (Component: React.ComponentType<any>, name = Component.displayName || Component.name || "Component") =>
  (props: any) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      // Avoid crashing the whole MDX tree if a leaf throws.
      // Surface a visible but non-fatal placeholder.
      console.warn(`MDX component error in ${name}:`, error);
      return (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          {name} failed to render.
        </div>
      );
    }
  };

/* -------------------------------------------------------------------------- */
/*  Lazy components with graceful fallbacks                                   */
/* -------------------------------------------------------------------------- */

const BrandFrame = dynamic(
  () =>
    import("@/components/print/BrandFrame").catch(() => () => (
      <div className="rounded border p-4">Brand Frame Placeholder</div>
    )),
  { ssr: false }
);

const ResourcesCTA = dynamic(
  () =>
    import("@/components/mdx/ResourcesCTA").catch(() => () => (
      <div className="rounded bg-blue-50 p-4">Resources CTA Placeholder</div>
    )),
  { ssr: false }
);

/* -------------------------------------------------------------------------- */
/*  Lightweight placeholders for optional shortcodes                          */
/* -------------------------------------------------------------------------- */

const EmbossedBrandMark: React.FC = () => <div>Embossed Brand Mark</div>;
const EmbossedSign: React.FC = () => <div>Embossed Sign</div>;
const Rule: React.FC = () => <hr className="my-8 border-gray-300" />;
const PullLine: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="my-4 border-l-4 border-yellow-400 pl-4">{children}</div>
);
const Note: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="my-4 rounded border border-yellow-200 bg-yellow-50 p-4">{children}</div>
);
const Verse: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="my-4 italic text-gray-600">{children}</div>
);
const JsonLd: React.FC = () => null;
const DownloadCard: React.FC = () => <div className="my-4 rounded border p-4">Download Card</div>;
const Caption: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="mt-2 text-sm text-gray-600">{children}</div>
);
const CTA: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="my-4 rounded bg-blue-100 p-4">{children}</div>
);
const Callout: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="my-4 rounded border border-purple-200 bg-purple-50 p-4">{children}</div>
);
const HeroEyebrow: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="mb-2 text-sm uppercase tracking-wider text-gray-500">{children}</div>
);
const ShareRow: React.FC = () => <div className="my-4 rounded bg-gray-100 p-4">Share Buttons</div>;
const Badge: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="rounded bg-gray-200 px-2 py-1 text-sm">{children}</span>
);
const BadgeRow: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="my-4 flex gap-2">{children}</div>
);

const Grid: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`}>{children}</div>
);

const Quote: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <blockquote className={`border-l-4 border-yellow-400 pl-4 italic text-gray-600 ${className}`}>{children}</blockquote>
);

/* -------------------------------------------------------------------------- */
/*  MDX component map                                                         */
/* -------------------------------------------------------------------------- */

const mdxComponents: MDXRemoteProps["components"] = {
  // HTML tag overrides
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { src = "", alt = "", ...rest } = props;
    // Use Next/Image when possible with sensible defaults
    return (
      <Image
        src={String(src)}
        alt={alt}
        width={1200}
        height={800}
        sizes="(max-width: 768px) 100vw, 50vw"
        loading="lazy"
        className="rounded-lg"
        {...rest}
      />
    );
  },
  hr: Rule,
  blockquote: Quote,

  // Custom shortcodes / components
  BrandFrame: withErrorBoundary(BrandFrame as unknown as React.ComponentType<any>, "BrandFrame"),
  ResourcesCTA: withErrorBoundary(ResourcesCTA as unknown as React.ComponentType<any>, "ResourcesCTA"),
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
  JsonLd,
  CTA,
  DownloadCard,
  Grid,
  Quote
};

export { mdxComponents };
export default mdxComponents;