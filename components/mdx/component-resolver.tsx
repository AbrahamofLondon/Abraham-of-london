// components/mdx/component-resolver.tsx
import * as React from "react";

import Badge from "@/components/mdx/Badge";
import BadgeRow from "@/components/mdx/BadgeRow";
import BrandFrame from "@/components/mdx/BrandFrame";
import BriefAlert from "@/components/mdx/BriefAlert";
import BriefSummaryCard from "@/components/mdx/BriefSummaryCard";
import Callout from "@/components/mdx/Callout";
import Caption from "@/components/mdx/Caption";
import CTA from "@/components/mdx/CTA";
import CTAPreset from "@/components/mdx/CTAPreset";
import CtaPresetComponent from "@/components/mdx/CtaPresetComponent";
import Divider from "@/components/mdx/Divider";
import DocumentFooter from "@/components/mdx/DocumentFooter";
import DocumentHeader from "@/components/mdx/DocumentHeader";
import DownloadCard from "@/components/mdx/DownloadCard";
import EmbossedBrandMark from "@/components/mdx/EmbossedBrandMark";
import FallbackComponent from "@/components/mdx/FallbackComponent";
import Grid from "@/components/mdx/Grid";
import HeroEyebrow from "@/components/mdx/HeroEyebrow";
import JsonLd from "@/components/mdx/JsonLd";
import LexiconLink from "@/components/mdx/LexiconLink";
// Note: We do NOT import MDXComponents here if it is just a mapping object.
import MDXContentWrapper from "@/components/mdx/MDXContentWrapper";
import MDXLayoutRenderer from "@/components/mdx/MDXLayoutRenderer";
import MinimalMdxComponents from "@/components/mdx/MinimalMdxComponents";
import MissingComponent from "@/components/mdx/MissingComponent";
import Note from "@/components/mdx/Note";
import ProcessSteps from "@/components/mdx/ProcessSteps";
import PullLine from "@/components/mdx/PullLine";
import Quote from "@/components/mdx/Quote";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import Responsibility from "@/components/mdx/Responsibility";
import ResponsibilityGrid from "@/components/mdx/ResponsibilityGrid";
import Rule from "@/components/mdx/Rule";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import ShareRow from "@/components/mdx/ShareRow";
import Step from "@/components/mdx/Step";
import Verse from "@/components/mdx/Verse";

type AnyComp = React.ComponentType<any>;

// Use 'any' cast for the registry object to prevent the build from stalling on complex union types
const REGISTRY: Record<string, AnyComp> = {
  Badge,
  BadgeRow,
  BrandFrame,
  BriefAlert,
  BriefSummaryCard,
  Callout,
  Caption,
  CTA,
  CTAPreset,
  CtaPresetComponent,
  Divider,
  DocumentFooter,
  DocumentHeader,
  DownloadCard,
  EmbossedBrandMark,
  FallbackComponent,
  Grid,
  HeroEyebrow,
  JsonLd,
  LexiconLink,
  // MDXComponents removed - it is a collection, not a single component
  MDXContentWrapper,
  MDXLayoutRenderer,
  MinimalMdxComponents,
  MissingComponent,
  Note,
  ProcessSteps,
  PullLine,
  Quote,
  ResourcesCTA,
  Responsibility,
  ResponsibilityGrid,
  Rule,
  SafeMDXRenderer,
  ShareRow,
  Step,
  Verse,
} as any; 

// Aliases for legacy MDX tags used across your content
const ALIASES: Record<string, string> = {
  Alert: "BriefAlert", 
  ProTip: "Callout",
  Tip: "Callout",
  Warning: "Callout",
};

function resolveName(name: string) {
  return ALIASES[name] ?? name;
}

export function getComponentSync(componentName: string): AnyComp {
  const name = resolveName(componentName);
  const Component = REGISTRY[name];
  
  if (Component) return Component;

  // Return a stable functional component for missing items
  const Missing: React.FC<any> = (props) => (
    <MissingComponent componentName={componentName} {...props} />
  );
  return Missing;
}

/**
 * Prefer sync resolution. This returns a stable component (no async during render),
 * which avoids hydration issues and “works on my machine” build variance.
 */
export function createDynamicComponent(componentName: string): React.FC<any> {
  const Resolved = getComponentSync(componentName);
  const Wrapped: React.FC<any> = (props) => <Resolved {...props} />;
  Wrapped.displayName = `MDX(${componentName})`;
  return React.memo(Wrapped);
}

// Back-compat for any callers expecting async
export async function getComponent(componentName: string): Promise<AnyComp> {
  return getComponentSync(componentName);
}