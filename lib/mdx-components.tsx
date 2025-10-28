// lib/mdx-components.tsx (The complete, corrected map with all known dependencies)
import * as React from "react";
import Image from "next/image";
import Link from "next/link";

// --- CORE / PRINT ---
import BrandFrame from "@/components/print/BrandFrame";

// --- MDX BLOCKS (all must default-export) ---
import Badge from "@/components/mdx/Badge";
import BadgeRow from "@/components/mdx/BadgeRow";
import Callout from "@/components/mdx/Callout";
import CTA from "@/components/mdx/CTA";
import DownloadCard from "@/components/mdx/DownloadCard";
import HeroEyebrow from "@/components/mdx/HeroEyebrow";
import JsonLd from "@/components/mdx/JsonLd";
import Note from "@/components/mdx/Note";
import PullLine from "@/components/mdx/PullLine";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import Rule from "@/components/mdx/Rule";
import ShareRow from "@/components/mdx/ShareRow";
import Verse from "@/components/mdx/Verse";

// Optional bag of named extras only (no default export)
import * as Shortcodes from "@/components/mdx/shortcodes";

// ADDED IMPORTS (Likely inserted by your PowerShell script):
import Grid from "@/components/mdx/Grid";
import Caption from "@/components/mdx/Caption";
import Quote from "@/components/mdx/Quote";


// --- HTML overrides ---
const A = (props: any) => (
  <Link
    {...props}
    href={props.href || "#"}
    prefetch={false}
    className={[
      "underline underline-offset-2",
      "decoration-softGold/60 hover:decoration-softGold",
      props.className,
    ].filter(Boolean).join(" ")}
  />
);

const IMG = (props: any) => {
  const { src, alt = "", width = 1200, height = 630 } = props || {};
  if (!src || typeof src !== "string" || !src.startsWith("/")) return <img alt={alt} {...props} />;
  return <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full rounded-md" />;
};

const PRE = (props: any) => (
  <pre
    {...props}
    className={[
      "my-6 overflow-x-auto rounded-lg border border-gray-200 p-4 text-[13px] dark:border-gray-800",
      props.className,
    ].filter(Boolean).join(" ")}
  />
);

// --- FINAL MAP ---
export const mdxComponents: Record<string, React.ComponentType<any>> = {
  // HTML
  a: A,
  img: IMG,
  pre: PRE,

  // Blocks (alphabetical)
  Badge,
  BadgeRow,
  BrandFrame,
  Callout,
  Caption, // 👈 ADDED to the map
  CTA,
  DownloadCard,
  Grid,      // 👈 ADDED to the map
  HeroEyebrow,
  JsonLd,
  Note,
  PullLine,
  Quote,     // 👈 ADDED to the map
  ResourcesCTA,
  Rule,
  ShareRow,
  Verse,

  // Named extras (if any)
  ...Shortcodes,
};

export default mdxComponents;