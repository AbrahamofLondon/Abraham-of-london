/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import * as runtime from "react/jsx-runtime";

// ✅ CORE UI COMPONENTS (Institutional Registry)
import JsonLd from "./JsonLd";
import Badge from "./Badge";
import BadgeRow from "./BadgeRow";
import BrandFrame from "./BrandFrame";
import Callout from "./Callout";
import Caption from "./Caption";
import CTA from "./CTA";
import { CTAPreset } from "./CTAPreset";
import CtaPresetComponent from "./CtaPresetComponent";
import DownloadCard from "./DownloadCard";
import EmbossedBrandMark from "./EmbossedBrandMark";
import Grid from "./Grid";
import HeroEyebrow from "./HeroEyebrow";
import Note from "./Note";
import PullLine from "./PullLine";
import Quote from "./Quote";
import ResourcesCTA from "./ResourcesCTA";
import Rule from "./Rule";
import ShareRow from "./ShareRow";
import Verse from "./Verse";
import { components as shortcodes } from "./shortcodes";
import MissingComponent from "./MissingComponent";

// ✅ MDX COMPONENT REGISTRY
const mdxComponents: any = {
  Image,
  JsonLd,
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternal = href?.startsWith("/") || href?.startsWith("#");
    if (isInternal) {
      return <Link href={href || "#"} {...props} className="text-gold hover:text-white underline underline-offset-4 transition-colors" />;
    }
    return <a target="_blank" rel="noopener noreferrer" href={href} {...props} />;
  },
  hr: (p: any) => <Rule {...p} />,
  h1: (p: any) => <h1 {...p} className="heading-statement text-4xl md:text-6xl font-serif italic mb-12 text-white leading-tight" />,
  h2: (p: any) => <h2 {...p} className="text-gold font-mono text-sm uppercase tracking-[0.3em] border-b border-white/5 pb-4 mt-16 mb-6" />,
  Badge,
  BadgeRow,
  BrandFrame,
  Callout,
  Caption,
  CTA,
  CTAPreset,
  CtaPresetComponent,
  DownloadCard,
  EmbossedBrandMark,
  Grid,
  HeroEyebrow,
  Note,
  PullLine,
  Quote,
  ResourcesCTA,
  Rule,
  ShareRow,
  Verse,
  ...shortcodes,
  Unknown: MissingComponent,
};

type MDXProps = {
  /** LEGACY: Compiled string from Contentlayer */
  code?: string | null | undefined;
  /** NEW: Serialized result from next-mdx-remote (getStaticProps) */
  source?: MDXRemoteSerializeResult;
  /** SEO Metadata */
  title?: string;
  excerpt?: string;
  author?: string;
  date?: string;
  coverImage?: string;
  [key: string]: any;
};

/**
 * MDXLayoutRenderer
 * BUILT TO BE UNBREAKABLE:
 * 1. No dynamic imports of contentlayer/client (removes Netlify/Next.js worker crashes).
 * 2. Backward compatible with old 'code' strings.
 * 3. Forward compatible with 'source' serialized objects.
 */
export function MDXLayoutRenderer({ 
  code, 
  source, 
  title, 
  excerpt, 
  author, 
  date, 
  coverImage, 
  ...rest 
}: MDXProps) {
  
  // ✅ 1. RESOLVE THE COMPONENT (Local Bridge)
  const MDXContent = React.useMemo(() => {
    // Priority 1: New serialized source (next-mdx-remote)
    if (source) return null; 

    // Priority 2: Legacy code string (Local Evaluation)
    if (code) {
      try {
        const fullCode = `
          const {jsx: _jsx, jsxs: _jsxs, Fragment: _Fragment} = arguments[0];
          ${code}
          return { default: MDXContent };
        `;
        const fn = new Function(fullCode);
        return fn(runtime).default;
      } catch (e) {
        console.error("MDX Runtime Error:", e);
        return () => <div className="p-4 border border-red-500/50 text-red-500 font-mono text-xs">Runtime Error in Brief Content</div>;
      }
    }
    return null;
  }, [code, source]);

  // ✅ 2. PREPARE STRUCTURED DATA
  const structuredData = React.useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Report",
    "headline": title || "Abraham of London Intelligence Brief",
    "description": excerpt || "Strategic insights and tactical blueprints.",
    "datePublished": date,
    "author": {
      "@type": "Organization",
      "name": author || "Abraham of London"
    },
    "image": coverImage ? `https://www.abrahamoflondon.org${coverImage}` : undefined
  }), [title, excerpt, date, author, coverImage]);

  if (!code && !source) {
    return <div className="animate-pulse bg-white/[0.02] h-64 w-full rounded-2xl border border-white/5" />;
  }

  return (
    <article className="prose prose-invert prose-gold max-w-none prose-p:text-white/70 prose-p:leading-relaxed prose-strong:text-gold">
      <JsonLd data={structuredData} />
      
      {source ? (
        <MDXRemote {...source} components={mdxComponents} />
      ) : (
        MDXContent && <MDXContent components={mdxComponents} {...rest} />
      )}
    </article>
  );
}

export default MDXLayoutRenderer;