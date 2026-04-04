/* components/mdx/registry.tsx — PURE COMPONENT REGISTRY */
import * as React from "react";

// Low-level MDX components only
import Badge from "./Badge";
import BadgeRow from "./BadgeRow";
import BrandFrame from "./BrandFrame";
import BriefAlert from "./BriefAlert";
import BriefSummaryCard from "./BriefSummaryCard";
import Callout from "./Callout";
import Caption from "./Caption";
import CTA from "./CTA";
import CTAPreset from "./CTAPreset";
import CtaPresetComponent from "./CtaPresetComponent";
import Divider from "./Divider";
import DownloadCard from "./DownloadCard";
import EmbossedBrandMark from "./EmbossedBrandMark";
import Grid from "./Grid";
import HeroEyebrow from "./HeroEyebrow";
import JsonLd from "./JsonLd";
import LexiconLink from "./LexiconLink";
import MissingComponent from "./MissingComponent";
import Note from "./Note";
import ProcessSteps from "./ProcessSteps";
import PullLine from "./PullLine";
import Quote from "./Quote";
import ResourcesCTA from "./ResourcesCTA";
import Responsibility from "./Responsibility";
import ResponsibilityGrid from "./ResponsibilityGrid";
import Rule from "./Rule";
import ShareRow from "./ShareRow";
import Step from "./Step";
import Verse from "./Verse";

type AnyComponent = React.ComponentType<any>;

const LOW_LEVEL_COMPONENTS: Record<string, AnyComponent> = {
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
  DownloadCard,
  EmbossedBrandMark,
  Grid,
  HeroEyebrow,
  JsonLd,
  LexiconLink,
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
};

const ALIASES: Record<string, string> = {
  Alert: "BriefAlert",
  ProTip: "Callout",
  Tip: "Callout",
  Warning: "Callout",
};

export function resolveComponentName(name: string): string {
  return ALIASES[name] ?? name;
}

export function getComponentSync(componentName: string): AnyComponent {
  const resolved = resolveComponentName(componentName);
  const Component = LOW_LEVEL_COMPONENTS[resolved];
  
  if (Component) return Component;

  // Return a component that renders MissingComponent
  const Missing: React.FC<{ componentName: string }> = (props) => {
    return React.createElement(MissingComponent, { componentName: componentName, ...props });
  };
  return Missing;
}

export function createDynamicComponent(componentName: string): React.FC<any> {
  const Component = getComponentSync(componentName);
  const Wrapped: React.FC<any> = (props) => React.createElement(Component, props);
  Wrapped.displayName = `MDX(${componentName})`;
  return React.memo(Wrapped);
}
