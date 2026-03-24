// components/mdx/MDXComponents.tsx
import * as React from "react";
import baseComponents from "@/components/mdx-components";

import Badge from "@/components/mdx/Badge";
import BadgeRow from "@/components/mdx/BadgeRow";
import BrandFrame from "@/components/mdx/BrandFrame";
import BriefAlert from "@/components/mdx/BriefAlert";
import BriefSummaryCard from "@/components/mdx/BriefSummaryCard";
import Caption from "@/components/mdx/Caption";
import Callout from "@/components/mdx/Callout";
import Quote from "@/components/mdx/Quote";
import Divider from "@/components/mdx/Divider";
import CTA from "@/components/mdx/CTA";
import DocumentFooter from "@/components/mdx/DocumentFooter";
import DocumentHeader from "@/components/mdx/DocumentHeader";
import DownloadCard from "@/components/mdx/DownloadCard";
import EmbossedBrandMark from "@/components/mdx/EmbossedBrandMark";
import Grid from "@/components/mdx/Grid";
import HeroEyebrow from "@/components/mdx/HeroEyebrow";
import JsonLd from "@/components/mdx/JsonLd";
import LexiconLink from "@/components/mdx/LexiconLink";
import Note from "@/components/mdx/Note";
import ProcessSteps from "@/components/mdx/ProcessSteps";
import PullLine from "@/components/mdx/PullLine";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import Responsibility from "@/components/mdx/Responsibility";
import ResponsibilityGrid from "@/components/mdx/ResponsibilityGrid";
import Rule from "@/components/mdx/Rule";
import ShareRow from "@/components/mdx/ShareRow";
import Step from "@/components/mdx/Step";
import Verse from "@/components/mdx/Verse";

// More flexible type that matches React.ComponentType
type MDXComponent = React.ComponentType<any>;
type ComponentMap = Record<string, MDXComponent>;

function FallbackBlock(name: string): MDXComponent {
  const Comp = ({ children, className, ...rest }: any) => (
    <div
      className={["mdx-fallback", name.toLowerCase(), className]
        .filter(Boolean)
        .join(" ")}
      data-mdx-fallback={name}
      {...rest}
    >
      {children}
    </div>
  );

  Comp.displayName = `${name}Fallback`;
  return Comp;
}

const base = (baseComponents || {}) as ComponentMap;

const requiredFallbacks = {
  BrandFrame: FallbackBlock("BrandFrame"),
  HeroEyebrow: FallbackBlock("HeroEyebrow"),
  ResourcesCTA: FallbackBlock("ResourcesCTA"),
  JsonLd: FallbackBlock("JsonLd"),
  Caption: FallbackBlock("Caption"),
  CTA: FallbackBlock("CTA"),
  BriefAlert: FallbackBlock("BriefAlert"),
  DocumentFooter: FallbackBlock("DocumentFooter"),
  Callout: FallbackBlock("Callout"),
  Quote: FallbackBlock("Quote"),
  Divider: FallbackBlock("Divider"),
  Note: FallbackBlock("Note"),
  DownloadCard: FallbackBlock("DownloadCard"),
} satisfies ComponentMap;

const explicitComponents: ComponentMap = {
  ...base,

  Badge,
  BadgeRow,
  BrandFrame,
  BriefAlert,
  BriefSummaryCard,
  Caption,
  Callout,
  Quote,
  Divider,
  CTA,
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

  // aliases
  callout: Callout,
  divider: Divider,
  CALLOUT: Callout,
  DIVIDER: Divider,
  DividerLine: Divider,
  HorizontalRule: Rule,
  HR: Rule,

  FatherhoodCTA: CTA,
  LeadershipCTA: CTA,
  BrotherhoodCTA: CTA,
  MentorshipCTA: CTA,
  FreeResourcesCTA: CTA,
  PremiumCTA: CTA,
  CommunityCTA: CTA,
  NewsletterCTA: CTA,
};

export function getSafeComponents(
  custom?: Partial<Record<string, React.ComponentType<any>>>,
): ComponentMap {
  const merged: ComponentMap = {
    ...requiredFallbacks,
    ...explicitComponents,
  };

  if (custom) {
    for (const [key, value] of Object.entries(custom)) {
      if (value) {
        merged[key] = value as MDXComponent;
      }
    }
  }

  return merged;
}

const MDX_COMPONENTS = getSafeComponents();

export default MDX_COMPONENTS;