/* eslint-disable @typescript-eslint/no-explicit-any */
// components/mdx-components.tsx — PRODUCTION MDX REGISTRY (FULL RESOLUTION)

import * as React from "react";
import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowUpRight } from "lucide-react";

// ---- Institutional MDX blocks (your existing components) ----
import Badge from "@/components/mdx/Badge";
import BadgeRow from "@/components/mdx/BadgeRow";
import BrandFrame from "@/components/mdx/BrandFrame";
import BriefAlert from "@/components/mdx/BriefAlert";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import Callout from "@/components/mdx/Callout";
import Caption from "@/components/mdx/Caption";
import CTA from "@/components/mdx/CTA";
import DocumentFooter from "@/components/mdx/DocumentFooter";
import DocumentHeader from "@/components/mdx/DocumentHeader";
import DownloadCard from "@/components/mdx/DownloadCard";
import EmbossedBrandMark from "@/components/mdx/EmbossedBrandMark";
import Grid from "@/components/mdx/Grid";
import HeroEyebrow from "@/components/mdx/HeroEyebrow";
import JsonLd from "@/components/mdx/JsonLd";
import Note from "@/components/mdx/Note";
import ProcessSteps from "@/components/mdx/ProcessSteps";
import PullLine from "@/components/mdx/PullLine";
import Quote from "@/components/mdx/Quote";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import Responsibility from "@/components/mdx/Responsibility";
import ResponsibilityGrid from "@/components/mdx/ResponsibilityGrid";
import Rule from "@/components/mdx/Rule";
import ShareRow from "@/components/mdx/ShareRow";
import Step from "@/components/mdx/Step";
import Verse from "@/components/mdx/Verse";

// -----------------------------
// Helpers
// -----------------------------
type AnyProps = Record<string, any>;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// -----------------------------
// Atomic primitives (prose-safe)
// -----------------------------
const A: ComponentType<any> = (props: AnyProps) => {
  const href = String(props?.href || "");
  const className = cx(
    "text-amber-500 underline underline-offset-4 decoration-amber-500/30 hover:decoration-amber-500 transition-all",
    props.className
  );

  // Internal / hash links
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} className={className}>
        {props.children}
      </Link>
    );
  }

  // External link
  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(className, "inline-flex items-center gap-1")}
    >
      {props.children}
      <ArrowUpRight className="h-3 w-3 opacity-60" />
    </a>
  );
};

const H1: ComponentType<any> = (props: AnyProps) => (
  <h1
    {...props}
    className={cx(
      "font-serif text-4xl md:text-5xl text-white mb-8 mt-14 tracking-tight",
      props?.className
    )}
  />
);

const H2: ComponentType<any> = (props: AnyProps) => (
  <h2
    {...props}
    className={cx(
      "font-serif text-2xl md:text-3xl text-white/90 mb-6 mt-12 border-b border-white/5 pb-2",
      props?.className
    )}
  />
);

const H3: ComponentType<any> = (props: AnyProps) => (
  <h3
    {...props}
    className={cx(
      "font-serif text-xl md:text-2xl text-white/90 mb-4 mt-10",
      props?.className
    )}
  />
);

const P: ComponentType<any> = (props: AnyProps) => (
  <p
    {...props}
    className={cx("font-sans text-lg leading-relaxed text-white/70 my-6 font-light", props?.className)}
  />
);

const Ul: ComponentType<any> = (props: AnyProps) => (
  <ul {...props} className={cx("my-6 space-y-2 text-white/70", props?.className)} />
);

const Ol: ComponentType<any> = (props: AnyProps) => (
  <ol {...props} className={cx("my-6 space-y-2 text-white/70", props?.className)} />
);

const Li: ComponentType<any> = (props: AnyProps) => (
  <li {...props} className={cx("leading-relaxed", props?.className)} />
);

const Blockquote: ComponentType<any> = (props: AnyProps) => (
  <blockquote
    {...props}
    className={cx(
      "my-10 border-l border-amber-500/30 pl-6 text-white/70 italic",
      props?.className
    )}
  />
);

const Hr: ComponentType<any> = (props: AnyProps) => (
  <hr {...props} className={cx("my-16 border-t border-white/10", props?.className)} />
);

// -----------------------------
// Institutional wrappers / aliases
// -----------------------------
const Divider: ComponentType<any> = (props: AnyProps) => (
  <div className={cx("my-14", props?.className)}>
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const CTAGroup = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cx("flex flex-wrap gap-4 my-10", className)}>{children}</div>
);

// -----------------------------
// Registry export (MDXRemote components)
// NOTE: MDX tags are case-sensitive.
// -----------------------------
const mdxComponents: Record<string, ComponentType<any>> = {
  // Markdown primitives
  a: A,
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: Ul,
  ol: Ol,
  li: Li,
  blockquote: Blockquote,
  hr: Hr,

  // Your MDX component library
  Badge,
  BadgeRow,
  BrandFrame,
  BriefAlert,
  BriefSummaryCard,
  Callout,
  Caption,
  CTA,
  CTAGroup,
  DocumentFooter,
  DocumentHeader,
  DownloadCard,
  EmbossedBrandMark,
  Grid,
  HeroEyebrow,
  JsonLd,
  Note,
  ProcessSteps,
  PullLine,
  Quote,
  ResourcesCTA,
  Responsibility,
  ResponsibilityGrid,
  Rule,
  ShareRow,
  Step,
  Verse,

  // Canon/Book tags used in your documents
  Divider, // ✅ REAL Divider component
  // Keep explicit duplicates for clarity + safety
  Callout: Callout,
  Note: Note,
  Quote: Quote,

  // Backward-compat: if any doc uses <HR/> etc
  HR: Hr,
  DividerLine: Divider,

  // CTA fallbacks (some older docs reference these)
  FatherhoodCTA: CTA,
  LeadershipCTA: CTA,
  BrotherhoodCTA: CTA,
  MentorshipCTA: CTA,
  FreeResourcesCTA: CTA,
  PremiumCTA: CTA,
  CommunityCTA: CTA,
  NewsletterCTA: CTA,
};

export default mdxComponents;