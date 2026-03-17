/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import * as runtime from "react/jsx-runtime";

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
import Divider from "./Divider";
import { components as shortcodes } from "./shortcodes";
import MissingComponent from "./MissingComponent";

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

const filteredShortcodes = Object.entries(shortcodes).reduce(
  (acc, [key, value]) => {
    if (!explicitComponents.includes(key)) acc[key] = value;
    return acc;
  },
  {} as Record<string, any>
);

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function slugify(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function headingFactory(level: 1 | 2 | 3 | 4 | 5 | 6, className: string) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const Heading = ({ id, children, ...props }: any) => {
    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children)
        ? children
            .map((child) =>
              typeof child === "string"
                ? child
                : typeof child?.props?.children === "string"
                ? child.props.children
                : ""
            )
            .join(" ")
        : typeof children?.props?.children === "string"
        ? children.props.children
        : "";

    const safeId = id || slugify(text);
    return (
      <Tag id={safeId} {...props} className={cx(className, props?.className)}>
        {children}
      </Tag>
    );
  };
  Heading.displayName = `MDXHeading${level}`;
  return Heading;
}

const TableWrapper = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx("my-10 overflow-x-auto rounded-2xl border border-white/10 bg-black/30", className)}>
    <table {...props} className="min-w-full border-collapse text-left text-sm text-zinc-200" />
  </div>
);

const mdxComponents: any = {
  Image,
  JsonLd,
  a: ({ href, className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const h = String(href || "");
    const isInternal = h.startsWith("/") || h.startsWith("#");
    const base = cx(
      "text-amber-500 underline underline-offset-4 decoration-amber-500/30 transition-all",
      "hover:text-white hover:decoration-amber-500/60",
      className
    );
    if (isInternal) {
      return <Link href={h || "#"} {...(props as any)} className={base} />;
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
  h1: headingFactory(1, "mb-12 font-serif text-4xl italic leading-tight tracking-tight text-white md:text-6xl"),
  h2: headingFactory(
    2,
    "mt-20 mb-8 border-b border-white/5 pb-4 font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500 scroll-mt-32"
  ),
  h3: headingFactory(3, "mt-12 mb-4 font-serif text-2xl italic text-zinc-200 scroll-mt-32"),
  h4: headingFactory(4, "mt-10 mb-3 font-serif text-xl italic text-zinc-300 scroll-mt-32"),
  h5: headingFactory(5, "mt-8 mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-amber-200/80 scroll-mt-32"),
  h6: headingFactory(6, "mt-6 mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 scroll-mt-32"),
  p: (p: any) => <p {...p} className={cx("mb-8 font-sans text-lg font-light leading-relaxed text-zinc-400", p?.className)} />,
  strong: (p: any) => <strong {...p} className={cx("font-bold text-amber-500/90", p?.className)} />,
  ul: (p: any) => <ul {...p} className={cx("mb-8 list-none space-y-4", p?.className)} />,
  ol: (p: any) => <ol {...p} className={cx("mb-8 ml-6 list-decimal space-y-3 font-sans text-base leading-relaxed text-zinc-300", p?.className)} />,
  li: (p: any) => (
    <li className={cx("flex items-start gap-4 font-sans text-base text-zinc-400", p?.className)}>
      <span className="mt-2.5 h-1 w-1 shrink-0 bg-amber-500" />
      <span className="min-w-0 flex-1">{p.children}</span>
    </li>
  ),
  blockquote: (p: any) => (
    <blockquote
      {...p}
      className={cx("my-10 border-l-2 border-amber-500/40 pl-6 font-serif text-xl italic leading-relaxed text-zinc-200", p?.className)}
    />
  ),
  code: ({ className, children, ...props }: any) => {
    const isBlock = String(className || "").includes("language-");
    if (isBlock) {
      return (
        <code
          {...props}
          className={cx("block overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-5 font-mono text-sm text-zinc-200", className)}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        {...props}
        className={cx("rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.9em] text-amber-200", className)}
      >
        {children}
      </code>
    );
  },
  pre: (p: any) => <pre {...p} className={cx("my-8 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-5", p?.className)} />,
  table: TableWrapper,
  thead: (p: any) => <thead {...p} className={cx("bg-white/[0.03]", p.className)} />,
  tbody: (p: any) => <tbody {...p} className={cx("divide-y divide-white/10", p.className)} />,
  tr: (p: any) => <tr {...p} className={cx("border-b border-white/10", p.className)} />,
  th: (p: any) => <th {...p} className={cx("px-4 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/80", p.className)} />,
  td: (p: any) => <td {...p} className={cx("px-4 py-3 align-top font-sans text-sm leading-relaxed text-zinc-300", p.className)} />,

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
  Divider,

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
  const MDXContent = React.useMemo(() => {
    if (source) return null;
    if (!code || typeof code !== "string" || !code.trim()) return null;

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
        console.error("Code snippet:", code.slice(0, 1200));
      }
      return () => (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-8 font-mono text-sm text-red-300">
          <div className="mb-2 font-bold uppercase tracking-wider">MDX Rendering Failure</div>
          <div>{e instanceof Error ? e.message : String(e)}</div>
        </div>
      );
    }
  }, [code, source]);

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

  const content = source ? (
    <MDXRemote {...source} components={mdxComponents} />
  ) : MDXContent ? (
    <MDXContent components={mdxComponents} {...rest} />
  ) : (
    <div className="py-16 text-center font-mono text-sm uppercase tracking-widest text-zinc-600">
      No content available
    </div>
  );

  return (
    <article className="max-w-none">
      <JsonLd data={structuredData} />
      <div className="prose-hardened aol-mdx-content relative scroll-smooth">
        {content}
      </div>
      <footer className="mt-24 border-t border-white/5 pt-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
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