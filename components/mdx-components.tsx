/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * components/mdx/MDXComponents.tsx — AUTHORITATIVE MDX REGISTRY (BUILD-SAFE, RUNTIME-SAFE)
 * Single source of truth for ALL MDX routes (/content/*, /blog/*, /books/*, etc.)
 */

"use client";

import * as React from "react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

// ---- Institutional MDX blocks ----
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
import LexiconLink from "@/components/mdx/LexiconLink";

type AnyProps = Record<string, any>;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* -----------------------------
   Adapters (authoring-safe)
----------------------------- */

// Normalize common callout variants (author-facing)
type CalloutVariant = "info" | "note" | "warning" | "success" | "danger" | "strategy" | "default";
type CalloutTypeActual = "info" | "note" | "success" | "warning" | "danger";

function normalizeCalloutVariant(input: unknown): CalloutVariant {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "info";
  if (raw === "warn" || raw === "alert" || raw === "caution") return "warning";
  if (raw === "ok" || raw === "positive") return "success";
  if (raw === "error" || raw === "critical") return "danger";
  if (raw === "tip" || raw === "hint") return "note";
  if (["info", "note", "warning", "success", "danger", "strategy", "default"].includes(raw)) return raw as CalloutVariant;
  return "info";
}

function toCalloutType(v: CalloutVariant): CalloutTypeActual {
  if (v === "strategy") return "note";
  if (v === "default") return "info";
  return v as CalloutTypeActual;
}

const CalloutAdapter: ComponentType<AnyProps> = (props) => {
  const v = normalizeCalloutVariant(props?.variant ?? props?.type ?? props?.intent ?? props?.tone ?? props?.kind);
  const t = toCalloutType(v);

  const { type, variant, intent, tone, kind, className, children, ...rest } = props ?? {};
  const nextClassName = cx(className, v === "strategy" && "callout--strategy");

  return (
    <Callout {...rest} className={nextClassName} type={t}>
      {children ?? null}
    </Callout>
  );
};

const QuoteAdapter: ComponentType<AnyProps> = (props) => {
  const { children, ...rest } = props ?? {};
  return <Quote {...rest}>{children ?? null}</Quote>;
};

const DividerAdapter: ComponentType<AnyProps> = (props) => {
  return (
    <div className={cx("my-14", props?.className)}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};

/* -----------------------------
   Markdown primitives (prose-safe)
----------------------------- */

const A: ComponentType<AnyProps> = (props) => {
  const href = String(props?.href || "");
  const className = cx(
    "text-amber-400 underline underline-offset-4 decoration-amber-500/30 hover:decoration-amber-500 transition-all",
    props.className
  );

  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} className={className}>
        {props.children}
      </Link>
    );
  }

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

const H1: ComponentType<AnyProps> = (props) => (
  <h1 {...props} className={cx("font-serif text-4xl md:text-5xl text-white mb-8 mt-14 tracking-tight", props?.className)} />
);

const H2: ComponentType<AnyProps> = (props) => (
  <h2 {...props} className={cx("font-serif text-2xl md:text-3xl text-white/90 mb-6 mt-12 border-b border-white/5 pb-2", props?.className)} />
);

const H3: ComponentType<AnyProps> = (props) => (
  <h3 {...props} className={cx("font-serif text-xl md:text-2xl text-white/90 mb-4 mt-10", props?.className)} />
);

const P: ComponentType<AnyProps> = (props) => (
  <p {...props} className={cx("font-sans text-lg leading-relaxed text-white/70 my-6 font-light", props?.className)} />
);

const Ul: ComponentType<AnyProps> = (props) => <ul {...props} className={cx("my-6 space-y-2 text-white/70", props?.className)} />;
const Ol: ComponentType<AnyProps> = (props) => <ol {...props} className={cx("my-6 space-y-2 text-white/70", props?.className)} />;
const Li: ComponentType<AnyProps> = (props) => <li {...props} className={cx("leading-relaxed", props?.className)} />;

const Blockquote: ComponentType<AnyProps> = (props) => (
  <blockquote {...props} className={cx("my-10 border-l border-amber-500/30 pl-6 text-white/70 italic", props?.className)} />
);

const Hr: ComponentType<AnyProps> = (props) => <hr {...props} className={cx("my-16 border-t border-white/10", props?.className)} />;

const CTAGroup = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={cx("flex flex-wrap gap-4 my-10", className)}>{children}</div>
);

/* -----------------------------
   Export registry
----------------------------- */

const MDX_COMPONENTS: Record<string, ComponentType<any>> = {
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

  // Institutional components
  Badge,
  BadgeRow,
  BrandFrame,
  BriefAlert,
  BriefSummaryCard,
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
  LexiconLink,
  Note,
  ProcessSteps,
  PullLine,
  ResourcesCTA,
  Responsibility,
  ResponsibilityGrid,
  Rule,
  ShareRow,
  Step,
  Verse,

  // Hard bindings (the ones that crash if missing)
  Callout: CalloutAdapter,
  Quote: QuoteAdapter,
  Divider: DividerAdapter,

  // Alias safety (authors will be inconsistent; we will not crash)
  callout: CalloutAdapter as any,
  CALLOUT: CalloutAdapter as any,
  divider: DividerAdapter as any,
  DIVIDER: DividerAdapter as any,
  DividerLine: DividerAdapter as any,
  HorizontalRule: Hr,
  HR: Hr,

  // CTA fallbacks (legacy tags)
  FatherhoodCTA: CTA,
  LeadershipCTA: CTA,
  BrotherhoodCTA: CTA,
  MentorshipCTA: CTA,
  FreeResourcesCTA: CTA,
  PremiumCTA: CTA,
  CommunityCTA: CTA,
  NewsletterCTA: CTA,
};

export default MDX_COMPONENTS;