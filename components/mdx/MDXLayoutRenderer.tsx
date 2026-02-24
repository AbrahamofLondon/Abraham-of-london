/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
import Divider from "./Divider"; // ✅ FIX: Divider exists in your folder — bind it here

import { components as shortcodes } from "./shortcodes";
import MissingComponent from "./MissingComponent";

// Components explicitly imported (so we can avoid shortcode duplicates)
const explicitComponents = [
  "Badge",
  "BadgeRow",
  "BrandFrame",
  "Callout",
  "Caption",
  "CTA",
  "CTAPreset",
  "CtaPresetComponent",
  "DownloadCard",
  "EmbossedBrandMark",
  "Grid",
  "HeroEyebrow",
  "Note",
  "PullLine",
  "Quote",
  "ResourcesCTA",
  "Rule",
  "ShareRow",
  "Verse",
  "Divider",
];

// Filter out any components from shortcodes that we explicitly import
const filteredShortcodes = Object.entries(shortcodes).reduce((acc, [key, value]) => {
  if (!explicitComponents.includes(key)) acc[key] = value;
  return acc;
}, {} as Record<string, any>);

// Small helper
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ✅ HARDENED MDX COMPONENT REGISTRY
const mdxComponents: any = {
  Image,
  JsonLd,

  // ---------- Markdown primitives ----------
  a: ({ href, className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const h = String(href || "");
    const isInternal = h.startsWith("/") || h.startsWith("#");

    const base = cx(
      "text-amber-500 underline underline-offset-4 decoration-amber-500/30 transition-all",
      "hover:text-white hover:decoration-amber-500/60",
      className
    );

    if (isInternal) {
      return (
        <Link href={h || "#"} {...(props as any)} className={base}>
          {(props as any).children}
        </Link>
      );
    }

    return (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={h}
        {...props}
        className={cx(base, "border-b border-amber-500/20 no-underline")}
      />
    );
  },

  hr: (p: any) => <Rule {...p} className={cx("my-16 opacity-20", p?.className)} />,

  h1: (p: any) => (
    <h1
      {...p}
      className={cx("font-serif text-4xl md:text-6xl italic mb-12 text-white leading-tight tracking-tight", p?.className)}
    />
  ),

  h2: (p: any) => (
    <h2
      {...p}
      className={cx(
        "text-amber-500 font-mono text-[10px] uppercase tracking-[0.4em]",
        "border-b border-white/5 pb-4 mt-20 mb-8",
        p?.className
      )}
    />
  ),

  h3: (p: any) => <h3 {...p} className={cx("font-serif text-2xl italic text-zinc-200 mt-12 mb-4", p?.className)} />,

  p: (p: any) => (
    <p {...p} className={cx("font-sans text-lg font-light leading-relaxed text-zinc-400 mb-8", p?.className)} />
  ),

  strong: (p: any) => <strong {...p} className={cx("font-bold text-amber-500/90", p?.className)} />,

  ul: (p: any) => <ul {...p} className={cx("space-y-4 mb-8 list-none", p?.className)} />,

  li: (p: any) => (
    <li className={cx("flex gap-4 items-start text-zinc-400 font-sans text-base", p?.className)}>
      <span className="h-1 w-1 bg-amber-500 mt-2.5 shrink-0" />
      {p.children}
    </li>
  ),

  // ---------- Institutional components ----------
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

  // ✅ FIX: Divider binding + aliases (authoring-safe)
  Divider,
  divider: Divider,
  DIVIDER: Divider,
  DividerLine: Divider,

  // Spread filtered shortcodes (without duplicates)
  ...filteredShortcodes,

  // Fallbacks
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
  // 1) Resolve compiled MDX "code" to a component, if present.
  const MDXContent = React.useMemo(() => {
    if (source) return null;

    if (code && typeof code === "string" && code.trim()) {
      try {
        const functionBody = `
          const {jsx: _jsx, jsxs: _jsxs, Fragment: _Fragment} = arguments[0];
          ${code}
          return { default: MDXContent };
        `;
        const fn = new Function("runtime", functionBody);
        return fn(runtime).default;
      } catch (e) {
        console.error("MDX Runtime Error:", e);
        if (process.env.NODE_ENV === "development") {
          console.error("Offending code snippet:", code.slice(0, 800));
        }
        const ErrorFallback = () => (
          <div className="p-8 border border-red-500/20 bg-red-500/5 text-red-500 font-mono text-[10px] uppercase tracking-widest">
            ERROR // SYSTEM_DECRYPTION_FAILURE: {e instanceof Error ? e.message : "Critical runtime error."}
          </div>
        );
        return ErrorFallback;
      }
    }

    return null;
  }, [code, source]);

  // 2) Structured Data (SEO)
  const structuredData = React.useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Report",
      headline: title || "Abraham of London Dispatch",
      description: excerpt || "Institutional thinking: purpose, governance, cadence, durable execution.",
      datePublished: date,
      author: { "@type": "Organization", name: author || "Abraham of London" },
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

  const ContentComponent = source ? (
    <MDXRemote {...source} components={mdxComponents} />
  ) : MDXContent ? (
    <MDXContent components={mdxComponents} {...rest} />
  ) : null;

  return (
    <article className="max-w-none">
      <JsonLd data={structuredData} />

      <div className="prose-hardened relative">{ContentComponent}</div>

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