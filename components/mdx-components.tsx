/* eslint-disable @typescript-eslint/no-explicit-any */
// components/mdx-components.tsx — RECALIBRATED
import * as React from "react";
import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowUpRight } from "lucide-react";

import Badge from "@/components/mdx/Badge";
import BadgeRow from "@/components/mdx/BadgeRow";
import BrandFrame from "@/components/mdx/BrandFrame";
import BriefAlert from "@/components/mdx/BriefAlert";
import BriefSummaryCard from "@/components/mdx/BriefSummaryCard";
import Callout from "@/components/mdx/Callout";
import Caption from "@/components/mdx/Caption";
// ✅ Only import Default CTA to avoid export errors
import CTA from "@/components/mdx/CTA"; 
import DocumentFooter from "@/components/mdx/DocumentFooter";
import DocumentHeader from "@/components/mdx/DocumentHeader";
import DownloadCard from "@/components/mdx/DownloadCard";
import EmbossedBrandMark from "@/components/mdx/EmbossedBrandMark";
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
import Grid from "@/components/mdx/Grid";

const CTAGroup = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-wrap gap-4 my-8 ${className}`}>{children}</div>
);

type AnyProps = Record<string, any>;
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const A: ComponentType<any> = (props: AnyProps) => {
  const href = String(props?.href || "");
  const styles = "text-amber-500 underline underline-offset-4 decoration-amber-500/30 hover:decoration-amber-500 transition-all";
  if (href.startsWith("/") || href.startsWith("#")) return <Link href={href} className={cx(styles, props.className)}>{props.children}</Link>;
  return <a {...props} href={href} target="_blank" rel="noopener noreferrer" className={cx(styles, "inline-flex items-center gap-1", props.className)}>{props.children} <ArrowUpRight className="h-3 w-3 opacity-50" /></a>;
};

const H1: ComponentType<any> = (props: AnyProps) => <h1 {...props} className={cx("font-serif text-4xl text-white mb-8 mt-16 tracking-tight", props?.className)} />;
const H2: ComponentType<any> = (props: AnyProps) => <h2 {...props} className={cx("font-serif text-2xl text-white/90 mb-6 mt-12 border-b border-white/5 pb-2", props?.className)} />;
const P: ComponentType<any> = (props: AnyProps) => <p {...props} className="font-sans text-lg leading-relaxed text-white/70 my-6 font-light" />;
const Hr: ComponentType<any> = (props: AnyProps) => <hr {...props} className="my-16 border-t border-white/10" />;

const mdxComponents: Record<string, ComponentType<any>> = {
  a: A, h1: H1, h2: H2, p: P, hr: Hr,
  Badge, BadgeRow, BrandFrame, BriefAlert, BriefSummaryCard, Callout, Caption, CTA, CTAGroup, 
  DocumentFooter, DocumentHeader, DownloadCard, EmbossedBrandMark, Grid, HeroEyebrow, JsonLd, 
  Note, ProcessSteps, PullLine, Quote, ResourcesCTA, Responsibility, ResponsibilityGrid, Rule, 
  ShareRow, Step, Verse,
  
  // ✅ Mappings for MDX tags
  Divider: Rule,
  Callout: Callout,
  Quote: Quote,
  Note: Note,
  // Safety fallbacks for the missing CTA exports
  FatherhoodCTA: CTA,
  LeadershipCTA: CTA,
  BrotherhoodCTA: CTA,
  MentorshipCTA: CTA,
  FreeResourcesCTA: CTA,
  PremiumCTA: CTA,
  CommunityCTA: CTA,
  NewsletterCTA: CTA
};

export default mdxComponents;