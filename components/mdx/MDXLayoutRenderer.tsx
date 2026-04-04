/* components/mdx/MDXLayoutRenderer.tsx */
"use client";

import * as React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";
import JsonLd from "./JsonLd";
import SafeMDXRenderer from "./SafeMDXRenderer";
import { mdxComponents } from "./MDXComponents";

interface MDXLayoutRendererProps {
  code?: string | null;
  source?: any; // legacy support
  title?: string;
  excerpt?: string;
  author?: string;
  date?: string;
  coverImage?: string;
  [key: string]: any;
}

function MDXFooter({ date }: { date?: string }) {
  return (
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
  );
}

export function MDXLayoutRenderer({
  code,
  source,
  title,
  excerpt,
  author,
  date,
  coverImage,
  ...rest
}: MDXLayoutRendererProps) {
  const structuredData = React.useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title || "Abraham of London",
      description: excerpt || "Institutional thinking.",
      datePublished: date,
      author: { "@type": "Organization", name: author || "Abraham of London" },
      image: coverImage ? `https://www.abrahamoflondon.org${coverImage}` : undefined,
    }),
    [title, excerpt, date, author, coverImage]
  );

  // Prefer Contentlayer's compiled code (most reliable)
  const hasValidCode = code && typeof code === "string" && code.trim().length > 0;

  // Legacy source support (next-mdx-remote)
  if (source && !hasValidCode) {
    return (
      <article className="max-w-none">
        <JsonLd data={structuredData} />
        <div className="prose-hardened aol-mdx-content relative">
          {/* If you still need MDXRemote, keep it here. Otherwise remove. */}
          {/* <MDXRemote {...source} components={mdxComponents} /> */}
          <div className="text-amber-400 font-mono text-xs p-4 border border-amber-500/20 rounded-2xl">
            Legacy MDXRemote source detected — consider migrating to Contentlayer code.
          </div>
        </div>
        <MDXFooter date={date} />
      </article>
    );
  }

  return (
    <article className="max-w-none">
      <JsonLd data={structuredData} />

      <div className="prose-hardened aol-mdx-content relative scroll-smooth">
        {hasValidCode ? (
          <SafeMDXRenderer 
            code={code} 
            components={mdxComponents} 
            debug={process.env.NODE_ENV === "development"}
          />
        ) : (
          <div className="py-20 text-center">
            <div className="mx-auto w-16 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mb-6" />
            <p className="font-mono text-sm uppercase tracking-widest text-zinc-500">
              No content available
            </p>
          </div>
        )}
      </div>

      <MDXFooter date={date} />
    </article>
  );
}

export default MDXLayoutRenderer;