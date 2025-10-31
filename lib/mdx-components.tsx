// lib/mdx-components.tsx (Final verified correct version)
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { type MDXComponents } from "mdx/types";

// --- CORE / PRINT (All must exist and be default-exported in their files) ---
import BrandFrame from "@/components/print/BrandFrame";

// --- MDX BLOCKS (All must exist and be default-exported in their files) ---
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
import Grid from "@/components/mdx/Grid";
import Caption from "@/components/mdx/Caption";
import Quote from "@/components/mdx/Quote";

// Optional bag of named extras only (no default export)
import * as Shortcodes from "@/components/mdx/shortcodes";


// --- HTML overrides ---

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
  href?: string;
}

const A: React.FC<LinkProps> = ({ href = "#", className, ...rest }) => (
  <Link
    href={href}
    prefetch={false}
    className={[
      "underline underline-offset-2",
      "decoration-softGold/60 hover:decoration-softGold",
      className,
    ].filter(Boolean).join(" ")}
    {...rest} // Spread remaining props after href and className
  />
);

const IMG: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => {
  const { src = "", alt = "", width = 1200, height = 800, ...rest } = props;
  
  // Explicitly check for valid, local source
  if (!src || typeof src !== "string" || !src.startsWith("/")) { 
      // Fallback <img> element, required for external/unhandled images.
      // eslint-disable-next-line @next/next/no-img-element
      return <img alt={alt} {...props} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      // Ensure width and height are numeric, falling back to defaults
      width={Number(width) || 1200}
      height={Number(height) || 800}
      // Ensure the Image component has correct layout styles
      className="h-auto w-full rounded-md" 
      {...rest} 
    />
  );
};

const PRE: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ className, ...rest }) => (
  <pre
    className={[
      "my-6 overflow-x-auto rounded-lg border border-gray-200 p-4 text-[13px] dark:border-gray-800",
      className,
    ].filter(Boolean).join(" ")}
    {...rest}
  />
);

// --- FINAL MAP ---
export const mdxComponents: MDXComponents = {
  // HTML
  a: A,
  img: IMG,
  pre: PRE,

  // Blocks (alphabetical)
  Badge,
  BadgeRow,
  BrandFrame,
  Callout,
  Caption,
  CTA,
  DownloadCard,
  Grid,
  HeroEyebrow,
  JsonLd,
  Note,
  PullLine,
  Quote,
  ResourcesCTA,
  Rule,
  ShareRow,
  Verse,

  // Named extras
  ...Shortcodes,
};

export default mdxComponents;