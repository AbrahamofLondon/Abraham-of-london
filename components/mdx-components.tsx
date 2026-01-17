/* components/mdx-components.tsx - ULTIMATE FIXED VERSION */
import * as React from "react";
import type { ComponentType, ReactNode } from "react";

// ===== LUCIDE ICONS =====
import { 
  Lock, Book, Calendar, ChevronRight, ExternalLink,
  FileText, Globe, Heart, Home, Mail, MessageSquare,
  Search, Share2, Star, Tag, User, Award, Clock,
  BookOpen, Coffee, Crown, Diamond, Eye, Filter,
  Flag, Gem, Gift, Lightbulb, Link, List,
  MapPin, Menu, Moon, Package, PenTool, Phone,
  PieChart, Plus, RefreshCw, Settings, Shield,
  ShoppingBag, SkipForward, Sun, ThumbsUp, TrendingUp,
  Trophy, Users, Zap, ArrowRight, CheckCircle,
  XCircle, AlertCircle, Info
} from "lucide-react";

// ===== IMPORT MINIMAL MDX COMPONENTS =====
import * as MinimalMdxComponentsModule from "./mdx/MinimalMdxComponents";

// ===== CORE MDX COMPONENTS =====
import Divider from "./Divider";
import Rule from "./Rule";
import Grid from "./mdx/Grid";
import PullLine from "./mdx/PullLine";
import Callout from "./mdx/Callout";
import Quote from "./mdx/Quote";
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
import { CTAPreset as CTAPresetComponent } from "./mdx/CTAPreset";
import { CTA, ctas } from "./mdx/ctas";
import CtaPresetComponent from "./mdx/CtaPresetComponent";

import { FallbackComponent } from "./mdx/FallbackComponent";
import HeroEyebrow from "./mdx/HeroEyebrow";
import JsonLd from "./mdx/JsonLd";
import { MDXContentWrapper } from "./mdx/MDXContentWrapper";

import MissingComponent from "./mdx/MissingComponent";
import ResourcesCTA from "./mdx/ResourcesCTA";
import ShareRow from "./mdx/ShareRow";
import shortcodes from "./mdx/shortcodes";
import Verse from "./mdx/Verse";

// ===== ADMIN =====
import ShortsAnalytics from "./admin/ShortsAnalytics";

// ===== TYPES =====
interface MDXComponentProps {
  children?: ReactNode;
  [key: string]: any;
}

// ===== HELPER FUNCTIONS =====
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ===== CREATE LUCIDE ICON MAP =====
const LucideIcons: Record<string, ComponentType<any>> = {
  Lock, Book, Calendar, ChevronRight, ExternalLink,
  FileText, Globe, Heart, Home, Mail, MessageSquare,
  Search, Share2, Star, Tag, User, Award, Clock,
  BookOpen, Coffee, Crown, Diamond, Eye, Filter,
  Flag, Gem, Gift, Lightbulb, Link, List,
  MapPin, Menu, Moon, Package, PenTool, Phone,
  PieChart, Plus, RefreshCw, Settings, Shield,
  ShoppingBag, SkipForward, Sun, ThumbsUp, TrendingUp,
  Trophy, Users, Zap, ArrowRight, CheckCircle,
  XCircle, AlertCircle, Info
};

// ===== MINIMAL MDX COMPONENTS HANDLING =====
// Safely extract components from MinimalMdxComponentsModule
const MinimalMdxExport: unknown = MinimalMdxComponentsModule;

// Helper to safely extract component map
function extractComponentMap(module: any): Record<string, ComponentType<any>> {
  if (!module || typeof module !== 'object') return {};
  
  // If module is a single component (function or React component)
  if (typeof module === 'function' || (module.$$typeof && typeof module.render === 'function')) {
    return { MinimalMdxComponents: module as ComponentType<any> };
  }
  
  // If module has a default export that's a component map
  if (module.default && typeof module.default === 'object') {
    const result: Record<string, ComponentType<any>> = {};
    for (const [key, value] of Object.entries(module.default)) {
      if (typeof value === 'function' || 
          (value && typeof value === 'object' && '$$typeof' in value)) {
        result[key] = value as ComponentType<any>;
      }
    }
    return result;
  }
  
  // If module itself is a component map
  const result: Record<string, ComponentType<any>> = {};
  for (const [key, value] of Object.entries(module)) {
    if (typeof value === 'function' || 
        (value && typeof value === 'object' && '$$typeof' in value)) {
      result[key] = value as ComponentType<any>;
    }
  }
  return result;
}

const MinimalMdxBridge: Record<string, ComponentType<any>> = extractComponentMap(MinimalMdxExport);

// ===== ELEVATED COMPONENTS =====
const Anchor: ComponentType<any> = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const { className, children, ...rest } = props;
  const href = typeof rest.href === "string" ? rest.href : "";
  const isExternal = href.startsWith("http");

  return (
    <a
      {...rest}
      className={cx(
        "relative inline-flex items-center gap-1",
        "text-gold font-medium tracking-wide",
        "border-b border-gold/20 pb-0.5",
        "transition-all duration-300",
        "hover:text-platinum hover:border-platinum",
        "after:content-[''] after:absolute after:-bottom-0.5 after:left-0",
        "after:w-0 after:h-px after:bg-platinum",
        "after:transition-all after:duration-300",
        "hover:after:w-full",
        isExternal && "pr-5 after:right-0 after:left-auto",
        className
      )}
      rel={rest.rel ?? (isExternal ? "noopener noreferrer" : undefined)}
      target={rest.target ?? (isExternal ? "_blank" : undefined)}
    >
      {children}
      {isExternal && (
        <span className="absolute -right-4 opacity-60">
          <ExternalLink size={12} />
        </span>
      )}
    </a>
  );
};

const InlineCode: ComponentType<any> = (props: React.HTMLAttributes<HTMLElement>) => {
  const { className, children, ...rest } = props;
  return (
    <code
      {...rest}
      className={cx(
        "relative inline-block",
        "px-2 py-1 mx-0.5",
        "font-mono text-sm leading-tight",
        "text-gold bg-black/40",
        "border border-gold/10 rounded",
        "shadow-sm shadow-black/20",
        "before:content-[''] before:absolute before:inset-0",
        "before:rounded before:bg-gradient-to-br",
        "before:from-transparent before:via-white/5 before:to-transparent",
        "before:pointer-events-none",
        "transition-all duration-200",
        "hover:text-platinum hover:border-platinum/30",
        className
      )}
    >
      {children}
    </code>
  );
};

const H1: ComponentType<any> = (props: React.HTMLAttributes<HTMLHeadingElement>) => {
  const { className, children, ...rest } = props;
  return (
    <h1
      {...rest}
      className={cx(
        "text-4xl md:text-5xl lg:text-6xl font-serif font-light",
        "text-platinum tracking-tight leading-tight",
        "mb-8 mt-12",
        "border-l-4 border-gold pl-6",
        "bg-gradient-to-r from-gold/5 via-transparent to-transparent",
        className
      )}
    >
      {children}
    </h1>
  );
};

const H2: ComponentType<any> = (props: React.HTMLAttributes<HTMLHeadingElement>) => {
  const { className, children, ...rest } = props;
  return (
    <h2
      {...rest}
      className={cx(
        "text-2xl md:text-3xl lg:text-4xl font-serif font-normal",
        "text-platinum tracking-normal leading-snug",
        "mb-6 mt-10",
        "relative",
        "before:content-[''] before:absolute before:-left-4",
        "before:top-1/2 before:-translate-y-1/2",
        "before:w-2 before:h-2 before:bg-gold before:rounded-full",
        className
      )}
    >
      {children}
    </h2>
  );
};

const H3: ComponentType<any> = (props: React.HTMLAttributes<HTMLHeadingElement>) => {
  const { className, children, ...rest } = props;
  return (
    <h3
      {...rest}
      className={cx(
        "text-xl md:text-2xl lg:text-3xl font-serif font-medium",
        "text-cream tracking-wide leading-relaxed",
        "mb-4 mt-8",
        "border-b border-gold/20 pb-2",
        className
      )}
    >
      {children}
    </h3>
  );
};

const Paragraph: ComponentType<any> = (props: React.HTMLAttributes<HTMLParagraphElement>) => {
  const { className, children, ...rest } = props;
  return (
    <p
      {...rest}
      className={cx(
        "text-base md:text-lg font-sans font-light",
        "text-cream/90 tracking-normal leading-relaxed",
        "mb-6",
        "max-w-3xl",
        className
      )}
    >
      {children}
    </p>
  );
};

const Blockquote: ComponentType<any> = (props: React.HTMLAttributes<HTMLQuoteElement>) => {
  const { className, children, ...rest } = props;
  return (
    <blockquote
      {...rest}
      className={cx(
        "relative my-8 pl-8 border-l-4 border-gold",
        "italic text-lg text-cream/80",
        "bg-gradient-to-r from-gold/10 via-transparent to-transparent",
        "py-4 pr-4 rounded-r-lg",
        "before:content-['\"'] before:absolute before:-left-2",
        "before:top-0 before:text-4xl before:text-gold/30",
        "after:content-['\"'] after:absolute after:-right-2",
        "after:bottom-0 after:text-4xl after:text-gold/30",
        className
      )}
    >
      {children}
    </blockquote>
  );
};

const UnorderedList: ComponentType<any> = (props: React.HTMLAttributes<HTMLUListElement>) => {
  const { className, children, ...rest } = props;
  return (
    <ul
      {...rest}
      className={cx(
        "my-6 space-y-3",
        "list-none pl-4",
        className
      )}
    >
      {React.Children.map(children, (child, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="mt-2.5 shrink-0 w-1.5 h-1.5 rounded-full bg-gold/60" />
          <span className="text-cream/90">{child}</span>
        </li>
      ))}
    </ul>
  );
};

const OrderedList: ComponentType<any> = (props: React.HTMLAttributes<HTMLOListElement>) => {
  const { className, children, ...rest } = props;
  return (
    <ol
      {...rest}
      className={cx(
        "my-6 space-y-3",
        "list-none pl-4 counter-reset",
        className
      )}
    >
      {React.Children.map(children, (child, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="mt-1 shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full bg-gold/10 text-gold">
            {index + 1}
          </span>
          <span className="text-cream/90">{child}</span>
        </li>
      ))}
    </ol>
  );
};

// ===== DYNAMIC COMPONENT =====
export const Dynamic: ComponentType<any> = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const Comp = React.useMemo(() => createDynamicComponent(name), [name]);
  return <Comp {...props} />;
};
Dynamic.displayName = "Dynamic";

// ===== LUCIDE ICON COMPONENT =====
const LucideIcon: ComponentType<any> = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const IconComponent = LucideIcons[name];
  
  if (!IconComponent) {
    console.warn(`Lucide icon "${name}" not found. Using fallback.`);
    return <span className="inline-block w-4 h-4 bg-gold/20 rounded" />;
  }
  
  return <IconComponent {...props} />;
};
LucideIcon.displayName = "LucideIcon";

// ===== MDX COMPONENT MAP =====
export const mdxComponents: Record<string, ComponentType<any>> = {
  // ===== OVERRIDE BASIC ELEMENTS WITH ELEVATED VERSIONS =====
  a: Anchor,
  code: InlineCode,
  h1: H1,
  h2: H2,
  h3: H3,
  p: Paragraph,
  blockquote: Blockquote,
  ul: UnorderedList,
  ol: OrderedList,

  // ===== LUCIDE ICONS =====
  ...LucideIcons,
  LucideIcon,

  // ===== MINIMAL MDX COMPONENTS (AS OBJECT MAP) =====
  ...MinimalMdxBridge,

  // ===== CORE MDX COMPONENTS =====
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

  // ===== CARDS =====
  BaseCard,
  BlogPostCard,
  BookCard,
  CanonPrimaryCard,
  CanonResourceCard,
  ArticleHero,

  // ===== UI =====
  Box,
  Button,
  InteractiveElement,
  SectionHeading,
  SilentSurface,

  // ===== MEDIA / ICONS =====
  CoverFrame,
  BrandLogo,
  LockClosedIcon,

  // ===== SEO =====
  BookJsonLd,
  EventJsonLd,

  // ===== BLOG =====
  BlogContent,
  BlogFooter,
  BlogHeader,
  BlogPostPreview,
  BlogSidebar,
  RelatedPosts,
  ResourceGrid,

  // ===== SHORTS =====
  RelatedShorts,
  ShortActions,
  ShortComments,
  ShortContent,
  ShortHero,
  ShortMetadata,
  ShortNavigation,
  ShortShare,

  // ===== RESOURCES =====
  RelatedResources,
  ResourceActions,
  ResourceCard,
  ResourceContent,
  ResourceDownload,
  ResourceHero,
  ResourceMetadata,

  // ===== HOMEPAGE =====
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

  // ===== DIAGRAMS =====
  LegacyDiagram,

  // ===== MDX-SPECIFIC =====
  Badge,
  BadgeRow,
  BrandFrame,
  Dynamic,
  MissingComponent,
  FallbackComponent,
  HeroEyebrow,
  JsonLd,
  MDXContentWrapper,
  ResourcesCTA,
  ShareRow,
  Verse,

  // ===== SHORTCODE REGISTRY =====
  shortcodes: shortcodes as unknown as ComponentType<any>,

  // ===== CTA SYSTEM =====
  CTA,
  CTAPreset: CTAPresetComponent,
  CtaPresetComponent,
  // ctaPresets and ctas are configuration objects, not components

  // ===== ADMIN =====
  ShortsAnalytics,
};

// ============================================================================
// EXPORT
// ============================================================================
export default mdxComponents;

export type { MDXComponentProps };