'use client';

export {
  Rule, Note, PullLine, Verse, Caption, ShareRow, JsonLd, CTA, Quote,
  Badge, BadgeRow, Grid, DownloadCard, HeroEyebrow, Callout
} from "@/components/mdx";

// optional: JsonLd alias for now so imports don't break
export const JsonLd = ({ children }: any) => children ?? null;
