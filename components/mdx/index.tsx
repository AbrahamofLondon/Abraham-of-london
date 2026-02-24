/* components/mdx/index.tsx — CENTRAL COMPONENT REGISTRY */
import * as React from "react";

// Individual Component Exports
export { default as Badge } from "./Badge";
export { default as Callout } from "./Callout";
export { default as CTA } from "./CTA";
export { default as Quote } from "./Quote";
export { default as Rule } from "./Rule";
export { default as Verse } from "./Verse";
export { default as Note } from "./Note";
export { default as Grid } from "./Grid";
export { default as PullLine } from "./PullLine";
export { default as BrandFrame } from "./BrandFrame";
export { default as HeroEyebrow } from "./HeroEyebrow";
export { default as ShareRow } from "./ShareRow";
export { default as JsonLd } from "./JsonLd";
export { default as ResourcesCTA } from "./ResourcesCTA";
export { default as Caption } from "./Caption";

// Implementation of the mdxComponents object for lib/mdx-components.ts
import Badge from "./Badge";
import Callout from "./Callout";
import CTA from "./CTA";
import Quote from "./Quote";
import Rule from "./Rule";
import Verse from "./Verse";
import Note from "./Note";
import Grid from "./Grid";
import PullLine from "./PullLine";
import BrandFrame from "./BrandFrame";
import HeroEyebrow from "./HeroEyebrow";
import ShareRow from "./ShareRow";
import JsonLd from "./JsonLd";
import ResourcesCTA from "./ResourcesCTA";
import Caption from "./Caption";

export const mdxComponents = {
  Badge,
  Callout,
  CTA,
  Quote,
  Rule,
  Verse,
  Note,
  Grid,
  PullLine,
  BrandFrame,
  HeroEyebrow,
  ShareRow,
  JsonLd,
  ResourcesCTA,
  Caption,
  // Add global typography overrides if needed for the portfolio style
  hr: Rule,
};

export default mdxComponents;