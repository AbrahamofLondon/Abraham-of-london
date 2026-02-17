/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import * as runtime from "react/jsx-runtime";

// ✅ INSTITUTIONAL REGISTRY COMPONENTS
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

// List of components we're explicitly importing to avoid duplicates
const explicitComponents = [
  'Badge',
  'BadgeRow',
  'BrandFrame',
  'Callout',
  'Caption',
  'CTA',
  'CTAPreset',
  'CtaPresetComponent',
  'DownloadCard',
  'EmbossedBrandMark',
  'Grid',
  'HeroEyebrow',
  'Note',
  'PullLine',
  'Quote',
  'ResourcesCTA',
  'Rule',
  'ShareRow',
  'Verse'
];

// Filter out any components from shortcodes that we're explicitly importing
const filteredShortcodes = Object.entries(shortcodes).reduce((acc, [key, value]) => {
  if (!explicitComponents.includes(key)) {
    acc[key] = value;
  }
  return acc;
}, {} as Record<string, any>);

// ✅ HARDENED MDX COMPONENT REGISTRY
const mdxComponents: any = {
  Image,
  JsonLd,
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternal = href?.startsWith("/") || href?.startsWith("#");
    if (isInternal) {
      return (
        <Link
          href={href || "#"}
          {...props}
          className="text-amber-500 hover:text-white underline underline-offset-4 decoration-amber-500/30 transition-all"
        />
      );
    }
    return (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={href}
        {...props}
        className="text-amber-500/80 hover:text-white transition-colors border-b border-amber-500/20"
      />
    );
  },
  hr: (p: any) => <Rule {...p} className="my-16 opacity-20" />,
  h1: (p: any) => (
    <h1
      {...p}
      className="font-serif text-4xl md:text-6xl italic mb-12 text-white leading-tight tracking-tight"
    />
  ),
  h2: (p: any) => (
    <h2
      {...p}
      className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.4em] border-b border-white/5 pb-4 mt-20 mb-8"
    />
  ),
  h3: (p: any) => (
    <h3 {...p} className="font-serif text-2xl italic text-zinc-200 mt-12 mb-4" />
  ),
  p: (p: any) => (
    <p
      {...p}
      className="font-sans text-lg font-light leading-relaxed text-zinc-400 mb-8 italic"
    />
  ),
  strong: (p: any) => (
    <strong {...p} className="font-bold text-amber-500/90" />
  ),
  ul: (p: any) => <ul {...p} className="space-y-4 mb-8 list-none" />,
  li: (p: any) => (
    <li className="flex gap-4 items-start text-zinc-400 font-sans text-base">
      <span className="h-1 w-1 bg-amber-500 mt-2.5 shrink-0" />
      {p.children}
    </li>
  ),
  // Explicitly imported components
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
  // Spread filtered shortcodes (without duplicates)
  ...filteredShortcodes,
  Unknown: MissingComponent,
};

type MDXProps = {
  code?: string | null | undefined;
  source?: MDXRemoteSerializeResult;
  title?: string;
  excerpt?: string;
  author?: string;
  date?: string;
  coverImage?: string;
  [key: string]: any;
};

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
  // ✅ 1. RESOLVE COMPONENT
  const MDXContent = React.useMemo(() => {
    if (source) return null;

    if (code && typeof code === "string" && code.trim()) {
      try {
        // Construct a safe function body – avoid template literal issues
        const functionBody = `
          const {jsx: _jsx, jsxs: _jsxs, Fragment: _Fragment} = arguments[0];
          ${code}
          return { default: MDXContent };
        `;
        // Use Function constructor with the runtime as first argument
        const fn = new Function("runtime", functionBody);
        return fn(runtime).default;
      } catch (e) {
        console.error("MDX Runtime Error:", e);
        // Optionally log the offending code in development
        if (process.env.NODE_ENV === "development") {
          console.error("Offending code snippet:", code.slice(0, 500));
        }
        // Return a fallback component that shows the error
        const ErrorFallback = () => (
          <div className="p-8 border border-red-500/20 bg-red-500/5 text-red-500 font-mono text-[10px] uppercase tracking-widest">
            ERROR // SYSTEM_DECRYPTION_FAILURE:{" "}
            {e instanceof Error ? e.message : "Critical runtime error in dispatch content."}
          </div>
        );
        return ErrorFallback;
      }
    }
    return null;
  }, [code, source]);

  // ✅ 2. STRUCTURED DATA (SEO)
  const structuredData = React.useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Report",
      headline: title || "Abraham of London Intelligence Brief",
      description: excerpt || "Strategic insights and tactical blueprints.",
      datePublished: date,
      author: {
        "@type": "Organization",
        name: author || "Abraham of London",
      },
      image: coverImage ? `https://www.abrahamoflondon.org${coverImage}` : undefined,
    }),
    [title, excerpt, date, author, coverImage]
  );

  if (!code && !source) {
    return (
      <div className="space-y-4 py-12">
        <div className="h-4 w-3/4 bg-zinc-900 animate-pulse" />
        <div className="h-4 w-full bg-zinc-900 animate-pulse" />
        <div className="h-4 w-5/6 bg-zinc-900 animate-pulse" />
      </div>
    );
  }

  // If we have a source, use MDXRemote; otherwise use the compiled component
  const ContentComponent = source ? (
    <MDXRemote {...source} components={mdxComponents} />
  ) : MDXContent ? (
    <MDXContent components={mdxComponents} {...rest} />
  ) : null;

  return (
    <article className="max-w-none">
      <JsonLd data={structuredData} />

      <div className="prose-hardened relative">{ContentComponent}</div>

      {/* Institutional Source Verification */}
      <footer className="mt-24 border-t border-white/5 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-amber-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              End of Dispatch // Ref: {date || "2026-ARCHIVE"}
            </span>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-700">
            Source Verified by Abraham of London Registry
          </div>
        </div>
      </footer>
    </article>
  );
}

export default MDXLayoutRenderer;