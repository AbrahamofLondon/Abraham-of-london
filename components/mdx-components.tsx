/* components/mdx-components.tsx - FINAL WORKING VERSION (EXPORT-SHAPE SAFE) */
import * as React from "react";
import * as Lucide from "lucide-react";

// ===== CORE MDX COMPONENTS =====
import Divider from "./Divider";
import Rule from "./Rule";
import Grid from "./mdx/Grid";
import PullLine from "./mdx/PullLine";
import Callout from "./mdx/Callout";
import Quote from "./mdx/Quote";

// ✅ Note is NOT a named export according to your error → import default
import Note from "./mdx/Note";

import Caption from "./mdx/Caption";
import CanonReference from "./CanonReference";
import GlossaryTerm from "./GlossaryTerm";
import EmbossedBrandMark from "./EmbossedBrandMark";
import EmbossedSign from "./print/EmbossedSign";

// ===== CARD COMPONENTS =====
import BaseCard from "./Cards/BaseCard";
import BlogPostCard from "./Cards/BlogPostCard";
import BookCard from "./Cards/BookCard";
import CanonPrimaryCard from "./Cards/CanonPrimaryCard";
import CanonResourceCard from "./Cards/CanonResourceCard";
import ArticleHero from "./Cards/ArticleHero";

// ===== UI COMPONENTS =====
import Box from "./ui/Box";
import Button from "./ui/Button";
import InteractiveElement from "./ui/InteractiveElement";
import SectionHeading from "./ui/SectionHeading";
import SilentSurface from "./ui/SilentSurface";

// ===== MEDIA & ICONS =====
import { CoverFrame } from "./media/CoverFrame";
import BrandLogo from "./icons/BrandLogo";
import LockClosedIcon from "./icons/LockClosedIcon";

// ===== SEO COMPONENTS =====
import BookJsonLd from "./seo/BookJsonLd";
import EventJsonLd from "./seo/EventJsonLd";

// ===== BLOG COMPONENTS =====
import BlogContent from "./blog/BlogContent";
import BlogFooter from "./blog/BlogFooter";
import BlogHeader from "./blog/BlogHeader";
import BlogPostPreview from "./blog/BlogPostPreview";
import BlogSidebar from "./blog/BlogSidebar";
import RelatedPosts from "./blog/RelatedPosts";
import ResourceGrid from "./blog/ResourceGrid";

// ===== SHORTS COMPONENTS =====
import RelatedShorts from "./shorts/RelatedShorts";
import ShortActions from "./shorts/ShortActions";
import ShortComments from "./shorts/ShortComments";
import ShortContent from "./shorts/ShortContent";
import ShortHero from "./shorts/ShortHero";
import ShortMetadata from "./shorts/ShortMetadata";
import ShortNavigation from "./shorts/ShortNavigation";
import ShortShare from "./shorts/ShortShare";

// ===== RESOURCES COMPONENTS =====
import RelatedResources from "./resources/RelatedResources";
import ResourceActions from "./resources/ResourceActions";
import ResourceCard from "./resources/ResourceCard";
import ResourceContent from "./resources/ResourceContent";
import ResourceDownload from "./resources/ResourceDownload";
import ResourceHero from "./resources/ResourceHero";
import ResourceMetadata from "./resources/ResourceMetadata";

// ===== HOMEPAGE COMPONENTS =====
import AboutSection from "./homepage/AboutSection";
import ContentShowcase from "./homepage/ContentShowcase";
import EventsSection from "./homepage/EventsSection";
import HeroBanner from "./homepage/HeroBanner";
import HeroSection from "./homepage/HeroSection";
import MilestonesTimeline from "./homepage/MilestonesTimeline";
import StatsBar from "./homepage/StatsBar";
import StrategicFunnelStrip from "./homepage/StrategicFunnelStrip";
import TestimonialsSection from "./homepage/TestimonialsSection";
import VenturesSection from "./homepage/VenturesSection";

// ===== DIAGRAMS =====
import LegacyDiagram from "./diagrams/LegacyDiagram";

// ===== MDX SPECIFIC COMPONENTS =====
import Badge from "./mdx/Badge";
import BadgeRow from "./mdx/BadgeRow";
import BrandFrame from "./mdx/BrandFrame";

import { createDynamicComponent } from "./mdx/component-resolver";
import { ctaPresets } from "./mdx/cta-presets";
import { CTAPreset } from "./mdx/CTAPreset";
import { CTA, ctas } from "./mdx/ctas";
import CtaPresetComponent from "./mdx/CtaPresetComponent";

// ✅ no default export per your error → import named
import { FallbackComponent } from "./mdx/FallbackComponent";

import HeroEyebrow from "./mdx/HeroEyebrow";
import JsonLd from "./mdx/JsonLd";

// ✅ no default export per your error → import named
import { MDXContentWrapper } from "./mdx/MDXContentWrapper";

import MinimalMdxComponents from "./mdx/MinimalMdxComponents";
import MissingComponent from "./mdx/MissingComponent";
import ResourcesCTA from "./mdx/ResourcesCTA";
import ShareRow from "./mdx/ShareRow";

// ✅ shortcodes is NOT exported as a named symbol per your error → import default
import shortcodes from "./mdx/shortcodes";

import Verse from "./mdx/Verse";

// ===== ADMIN =====
import ShortsAnalytics from "./admin/ShortsAnalytics";

// ===== HELPER FUNCTION =====
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ===== BASIC ELEMENTS =====
function Anchor(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { className, ...rest } = props;
  const href = typeof rest.href === "string" ? rest.href : "";
  const isExternal = href.startsWith("http");

  return (
    <a
      {...rest}
      className={cx(
        "text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold",
        className
      )}
      rel={rest.rel ?? (isExternal ? "noopener noreferrer" : undefined)}
      target={rest.target ?? (isExternal ? "_blank" : undefined)}
    />
  );
}

function InlineCode(props: React.HTMLAttributes<HTMLElement>) {
  const { className, ...rest } = props;
  return (
    <code
      {...rest}
      className={cx(
        "rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[0.95em] text-cream",
        className
      )}
    />
  );
}

// ============================================================================
// Dynamic component bridge for MDX
// Usage in MDX: <Dynamic name="SomeComponent" />
// ============================================================================
export const Dynamic: React.FC<{ name: string; [key: string]: any }> = ({
  name,
  ...props
}) => {
  const Comp = React.useMemo(() => createDynamicComponent(name), [name]);
  return <Comp {...props} />;
};
Dynamic.displayName = "Dynamic";

// ============================================================================
// MDX COMPONENT MAP
// ============================================================================
export const mdxComponents: Record<string, React.ComponentType<any>> = {
  // Standard MDX element overrides
  a: Anchor,
  code: InlineCode,

  // namespaces
  Lucide,

  // Core MDX
  Divider,
  Rule,
  Grid,
  PullLine,
  Callout,
  Quote,
  Note,
  Caption,
  CanonReference,
  GlossaryTerm,
  EmbossedBrandMark,
  EmbossedSign,

  // Cards
  BaseCard,
  BlogPostCard,
  BookCard,
  CanonPrimaryCard,
  CanonResourceCard,
  ArticleHero,

  // UI
  Box,
  Button,
  InteractiveElement,
  SectionHeading,
  SilentSurface,

  // Media / Icons
  CoverFrame,
  BrandLogo,
  LockClosedIcon,

  // SEO
  BookJsonLd,
  EventJsonLd,

  // Blog
  BlogContent,
  BlogFooter,
  BlogHeader,
  BlogPostPreview,
  BlogSidebar,
  RelatedPosts,
  ResourceGrid,

  // Shorts
  RelatedShorts,
  ShortActions,
  ShortComments,
  ShortContent,
  ShortHero,
  ShortMetadata,
  ShortNavigation,
  ShortShare,

  // Resources
  RelatedResources,
  ResourceActions,
  ResourceCard,
  ResourceContent,
  ResourceDownload,
  ResourceHero,
  ResourceMetadata,

  // Homepage
  AboutSection,
  ContentShowcase,
  EventsSection,
  HeroBanner,
  HeroSection,
  MilestonesTimeline,
  StatsBar,
  StrategicFunnelStrip,
  TestimonialsSection,
  VenturesSection,

  // Diagrams
  LegacyDiagram,

  // MDX-specific
  Badge,
  BadgeRow,
  BrandFrame,
  Dynamic,
  MissingComponent,
  FallbackComponent,
  HeroEyebrow,
  JsonLd,
  MDXContentWrapper,
  MinimalMdxComponents,
  ResourcesCTA,
  ShareRow,
  Verse,

  // Shortcode registry (default export)
  shortcodes,

  // CTA system
  CTA,
  CTAPreset,
  CtaPresetComponent,
  ctaPresets,
  ctas,

  // Admin
  ShortsAnalytics,
};

export default mdxComponents;