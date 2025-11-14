// components/mdx-components.tsx
"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";

// Named exports — as confirmed by your file list
import { Quote } from "@/components/Quote";
import { Rule } from "@/components/Rule";
import { Verse } from "@/components/Verse";
import { Note } from "@/components/Note";
import { JsonLd } from "@/components/JsonLd";
import ShareRow from "@/components/ShareRow"; // default export

// Avoid TS over-strictness: MDX accepts ANY React component
type AnyProps = { children?: ReactNode; [key: string]: any };
const mdxComponents: Record<string, any> = {
  //
  // ==== LINKS ====
  //
  a: ({ href, children, ...props }: AnyProps) => {
    const isExternal =
      typeof href === "string" &&
      (href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//"));

    if (!href)
      return (
        <span className="text-forest underline decoration-dotted" {...props}>
          {children}
        </span>
      );

    if (isExternal)
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest underline decoration-forest/40 hover:decoration-forest"
          {...props}
        >
          {children}
        </a>
      );

    return (
      <Link
        href={href}
        className="text-forest underline decoration-forest/40 hover:decoration-forest"
        {...props}
      >
        {children}
      </Link>
    );
  },

  //
  // ==== IMAGES ====
  //
  img: ({ src, alt, ...props }: AnyProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || ""}
      className="my-4 h-auto max-w-full rounded-xl shadow-sm"
      {...props}
    />
  ),

  //
  // ==== HEADINGS ====
  //
  h1: ({ children, ...props }: AnyProps) => (
    <h1
      className="mb-4 mt-6 font-serif text-4xl font-semibold text-deepCharcoal"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: AnyProps) => (
    <h2
      className="mb-3 mt-6 font-serif text-3xl font-semibold text-deepCharcoal"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: AnyProps) => (
    <h3
      className="mb-2 mt-5 font-serif text-2xl font-semibold text-deepCharcoal"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: AnyProps) => (
    <h4
      className="mb-2 mt-4 text-xl font-semibold text-deepCharcoal"
      {...props}
    >
      {children}
    </h4>
  ),

  //
  // ==== PARAGRAPHS ====
  //
  p: ({ children, ...props }: AnyProps) => (
    <p className="my-3 leading-relaxed text-gray-800" {...props}>
      {children}
    </p>
  ),

  strong: ({ children, ...props }: AnyProps) => (
    <strong className="font-semibold text-deepCharcoal" {...props}>
      {children}
    </strong>
  ),

  em: ({ children, ...props }: AnyProps) => (
    <em className="italic" {...props}>{children}</em>
  ),

  inlineCode: ({ children, ...props }: AnyProps) => (
    <code
      className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-800"
      {...props}
    >
      {children}
    </code>
  ),

  //
  // ==== LISTS ====
  //
  ul: ({ children, ...props }: AnyProps) => (
    <ul className="my-3 ml-5 list-disc space-y-1 text-gray-800" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: AnyProps) => (
    <ol className="my-3 ml-5 list-decimal space-y-1 text-gray-800" {...props}>
      {children}
    </ol>
  ),

  //
  // ==== CODE BLOCKS ====
  //
  pre: ({ children, ...props }: AnyProps) => (
    <pre
      className="my-4 overflow-x-auto rounded-xl bg-gray-950/90 p-4 font-mono text-sm text-gray-100"
      {...props}
    >
      {children}
    </pre>
  ),

  //
  // ==== TABLES ====
  //
  table: ({ children, ...props }: AnyProps) => (
    <div className="my-4 overflow-x-auto">
      <table
        className="w-full border-collapse text-sm text-gray-800"
        {...props}
      >
        {children}
      </table>
    </div>
  ),

  //
  // ==== BLOCKQUOTE ====
  //
  blockquote: ({ children, ...props }: AnyProps) => (
    <blockquote
      className="my-4 border-l-4 border-forest/40 bg-forest/5 px-4 py-3 italic text-gray-800"
      {...props}
    >
      {children}
    </blockquote>
  ),

  //
  // ==== CUSTOM MDX COMPONENTS ====
  //
  Callout: ({ children, ...props }: AnyProps) => (
    <div
      className="my-6 rounded-2xl border border-amber-500/40 bg-amber-50/70 px-4 py-3 text-sm text-neutral-900 shadow-sm"
      {...props}
    >
      {children}
    </div>
  ),

  Caption: ({ children, ...props }: AnyProps) => (
    <p className="mt-2 text-xs italic text-neutral-500" {...props}>
      {children}
    </p>
  ),

  EmbossedBrandMark: ({ children, ...props }: AnyProps) => (
    <div className="mt-8 text-xs tracking-[0.25em] uppercase text-neutral-400" {...props}>
      {children ?? "Abraham of London"}
    </div>
  ),

  EmbossedSign: ({ children, ...props }: AnyProps) => (
    <div className="mt-10 text-right text-lg font-[cursive] text-neutral-700" {...props}>
      {children ?? "AbrahamofLondon"}
    </div>
  ),

  //
  // ==== PROJECT COMPONENTS ====
  //
  Quote,
  Rule,
  Verse,
  Note,
  JsonLd,
  ShareRow,
};

export default mdxComponents;