'use client';

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

// MDX Components
import Callout from "./Callout";
import Badge from "./Badge";
import CTA from "./CTA";
import Quote from "./Quote";
import Note from "./Note";
import Grid from "./Grid";
import Verse from "./Verse";
import EmbossedBrandMark from "./EmbossedBrandMark";
import { components as shortcodes } from "./shortcodes";

// ✅ Build-safe loader for useMDXComponent across Contentlayer variants
type UseMDXComponentFn = (code: string) => React.ComponentType<any>;

async function loadUseMDXComponent(): Promise<UseMDXComponentFn | null> {
  // Priority 1: contentlayer2 stable export location
  // (Netlify error shows "contentlayer2" root is not exported — so DO NOT use `import {..} from "contentlayer2"`)
  try {
    const m: any = await import("contentlayer2/client");
    if (typeof m?.useMDXComponent === "function") return m.useMDXComponent;
  } catch {}

  // Priority 2: contentlayer v1 client hook
  try {
    const m: any = await import("contentlayer/client");
    if (typeof m?.useMDXComponent === "function") return m.useMDXComponent;
  } catch {}

  // Not available
  return null;
}

const mdxComponents = {
  Image,
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const h = href || "";
    const isInternal = h.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={h}
          {...props}
          className="text-amber-300 hover:text-amber-200 underline underline-offset-4"
        />
      );
    }
    return <a target="_blank" rel="noopener noreferrer" href={h} {...props} />;
  },
  h1: (p: any) => <h1 {...p} className="heading-statement mb-8" />,
  h2: (p: any) => (
    <h2 {...p} className="text-kicker text-xl border-b border-white/10 pb-2 mt-12 mb-4" />
  ),
  Callout,
  Badge,
  CTA,
  Quote,
  Note,
  Grid,
  Verse,
  EmbossedBrandMark,
  ...shortcodes,
};

type MDXProps = {
  code: string | null | undefined;
  [key: string]: any;
};

export function MDXLayoutRenderer({ code, ...rest }: MDXProps) {
  const [useMDXComponent, setUseMDXComponent] = React.useState<UseMDXComponentFn | null>(null);

  React.useEffect(() => {
    let alive = true;
    loadUseMDXComponent().then((fn) => {
      if (alive) setUseMDXComponent(() => fn);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!code) {
    return <div className="animate-pulse bg-white/5 h-64 w-full rounded-xl" />;
  }

  // If hook not present (or during hydration), show a safe fallback
  if (!useMDXComponent) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
        <p className="text-sm">
          Loading content…
        </p>
      </div>
    );
  }

  const MDXComponent = useMDXComponent(code);

  return (
    <article className="prose prose-invert prose-slate max-w-none">
      <MDXComponent components={mdxComponents} {...rest} />
    </article>
  );
}

export default MDXLayoutRenderer;