/* components/mdx-components.tsx - ENHANCED, PRODUCTION-SAFE (NO SVGR ASSUMPTIONS) */
import * as React from "react";
import * as Lucide from "lucide-react";

// Core MDX components
import Divider from "./Divider";
import Rule from "./Rule";
import Grid from "./Grid";
import PullLine from "./mdx/PullLine";
import Callout from "./Callout";
import Quote from "./Quote";
import { Note } from "./Note";
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
import CoverFrame from "./media/CoverFrame";
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

// ===== OTHER MDX COMPONENTS =====
import Badge from "./mdx/Badge";
import BadgeRow from "./mdx/BadgeRow";
import BrandFrame from "./mdx/BrandFrame";
import componentResolver from "./mdx/component-resolver";
import { ctaPresets } from "./mdx/cta-presets";
import CTA from "./mdx/CTA";
import CTAPreset from "./mdx/CTAPreset";
import CtaPresetComponent from "./mdx/CtaPresetComponent";
import { ctas } from "./mdx/ctas";
import FallbackComponent from "./mdx/FallbackComponent";
import HeroEyebrow from "./mdx/HeroEyebrow";
import JsonLd from "./mdx/JsonLd";
import MDXContentWrapper from "./mdx/MDXContentWrapper";
import MinimalMdxComponents from "./mdx/MinimalMdxComponents";
import MissingComponent from "./mdx/MissingComponent";
import ResourcesCTA from "./mdx/ResourcesCTA";
import ShareRow from "./mdx/ShareRow";
import { shortcodes } from "./mdx/shortcodes";
import Verse from "./mdx/Verse";

// ===== ADMIN =====
import ShortsAnalytics from "./admin/ShortsAnalytics";

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

function Pre(props: React.HTMLAttributes<HTMLPreElement>) {
  const { className, ...rest } = props;
  return (
    <pre
      {...rest}
      className={cx(
        "my-8 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-5 text-sm leading-relaxed text-gray-200",
        className
      )}
    />
  );
}

// ===== CARD WRAPPERS FOR MDX (safe defaults, pass-through) =====
function MdxBlogPostCard(props: Record<string, any>) {
  const {
    slug,
    title = "Untitled Post",
    excerpt = "",
    date = "",
    coverImage = "/assets/images/placeholder.jpg",
    author = "Abraham of London",
    readTime = "5 min",
  } = props;

  if (!slug) return null;

  return (
    <div className="my-6">
      <BlogPostCard
        slug={String(slug)}
        title={String(title)}
        excerpt={String(excerpt)}
        date={String(date)}
        coverImage={String(coverImage)}
        author={String(author)}
        readTime={readTime}
      />
    </div>
  );
}

function MdxBookCard(props: Record<string, any>) {
  const {
    slug,
    title = "Untitled Book",
    author = "Unknown Author",
    isbn = "",
    coverImage = "/assets/images/placeholder.jpg",
    description = "",
  } = props;

  if (!slug) return null;

  return (
    <div className="my-6">
      <BookCard
        slug={String(slug)}
        title={String(title)}
        author={String(author)}
        isbn={String(isbn)}
        coverImage={String(coverImage)}
        description={String(description)}
      />
    </div>
  );
}

function MdxResourceCard(props: Record<string, any>) {
  const {
    slug,
    title = "Untitled Resource",
    description = "",
    tags = [],
    coverImage = "/assets/images/placeholder.jpg",
    accessLevel = "public",
  } = props;

  if (!slug) return null;

  return (
    <div className="my-6">
      <ResourceCard
        slug={String(slug)}
        title={String(title)}
        description={String(description)}
        tags={Array.isArray(tags) ? tags : []}
        coverImage={String(coverImage)}
        accessLevel={String(accessLevel)}
      />
    </div>
  );
}

function MdxCanonCard(props: Record<string, any>) {
  const {
    slug,
    title = "Untitled Canon",
    volumeNumber = 1,
    description = "",
    coverImage = "/assets/images/placeholder.jpg",
    date = new Date().toISOString(),
  } = props;

  if (!slug) return null;

  return (
    <div className="my-6">
      <CanonPrimaryCard
        slug={String(slug)}
        title={String(title)}
        volumeNumber={Number(volumeNumber) || 1}
        description={String(description)}
        coverImage={String(coverImage)}
        date={String(date)}
      />
    </div>
  );
}

// ===== SOCIAL ICON (no SVGR dependency) =====
function SocialIcon({
  platform,
  size = 24,
  className,
}: {
  platform: string;
  size?: number;
  className?: string;
}) {
  const base = "inline-block rounded";
  const style: React.CSSProperties = { width: size, height: size };

  const map: Record<string, string> = {
    facebook: "bg-blue-600",
    instagram: "bg-pink-600",
    linkedin: "bg-blue-700",
    twitter: "bg-sky-500",
    mail: "bg-gray-600",
    phone: "bg-green-600",
  };

  return <span className={cx(base, map[platform] ?? "bg-gray-500", className)} style={style} />;
}

// ===== DOWNLOAD CARD (resilient) =====
function DownloadCard(props: {
  title?: string;
  label?: string;
  href?: string;
  slug?: string;
  fileSize?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) {
  const title = typeof props.title === "string" ? props.title : "Download";
  const label = typeof props.label === "string" ? props.label : "Download";
  const href =
    typeof props.href === "string" && props.href.trim()
      ? props.href.trim()
      : typeof props.slug === "string" && props.slug.trim()
        ? `/downloads/${props.slug.trim()}`
        : null;

  return (
    <div className="my-6 rounded-2xl border border-gold/20 bg-charcoal/80 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/20">
          <Lucide.Download className="h-6 w-6 text-gold" aria-hidden="true" />
        </div>

        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-cream">{title}</h3>

          {props.children ? (
            <div className="mt-2 text-sm leading-relaxed text-gold/70">{props.children}</div>
          ) : null}

          {typeof props.fileSize === "string" && props.fileSize.trim() ? (
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-gold/50">
              {props.fileSize.trim()}
            </p>
          ) : null}

          {href ? (
            <a
              href={href}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-amber-200"
            >
              {label}
              <Lucide.ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENT MAP =====
export const mdxComponents: Record<string, unknown> = {
  // headings
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 {...props} className={cx("mt-16 mb-8 font-serif text-4xl font-semibold text-cream", props.className)} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} className={cx("mt-14 mb-5 font-serif text-2xl font-semibold text-cream", props.className)} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className={cx("mt-10 mb-4 font-serif text-xl font-semibold text-cream", props.className)} />
  ),

  // text
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className={cx("my-6 text-lg leading-relaxed text-gray-300", props.className)} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong {...props} className={cx("font-semibold text-cream", props.className)} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em {...props} className={cx("italic text-gold/90", props.className)} />
  ),

  // lists
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className={cx("my-6 list-disc space-y-2 pl-6 text-gray-300", props.className)} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className={cx("my-6 list-decimal space-y-2 pl-6 text-gray-300", props.className)} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...props} className={cx("leading-relaxed", props.className)} />
  ),

  // links / code
  a: Anchor,
  code: InlineCode,
  pre: Pre,

  // images
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      className={cx("my-8 w-full rounded-2xl border border-white/10", props.className)}
      alt={props.alt ?? ""}
      loading={props.loading ?? "lazy"}
    />
  ),

  // core components
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

  // cards
  BaseCard,
  BlogPostCard: MdxBlogPostCard,
  BookCard: MdxBookCard,
  CanonCard: MdxCanonCard,
  ResourceCard: MdxResourceCard,
  ArticleHero,
  CanonPrimaryCard,
  CanonResourceCard,

  // ui
  Box,
  Button,
  InteractiveElement,
  SectionHeading,
  SilentSurface,

  // media/icons
  CoverFrame,
  BrandLogo,
  LockClosedIcon,

  // seo
  BookJsonLd,
  EventJsonLd,

  // blog
  BlogContent,
  BlogFooter,
  BlogHeader,
  BlogPostPreview,
  BlogSidebar,
  RelatedPosts,
  ResourceGrid,

  // shorts
  RelatedShorts,
  ShortActions,
  ShortComments,
  ShortContent,
  ShortHero,
  ShortMetadata,
  ShortNavigation,
  ShortShare,

  // resources
  RelatedResources,
  ResourceActions,
  ResourceContent,
  ResourceDownload,
  ResourceHero,
  ResourceMetadata,

  // homepage
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

  // diagrams
  LegacyDiagram,

  // other mdx
  Badge,
  BadgeRow,
  BrandFrame,
  componentResolver,
  ctaPresets,
  CTA,
  CTAPreset,
  CtaPresetComponent,
  ctas,
  FallbackComponent,
  HeroEyebrow,
  JsonLd,
  MDXContentWrapper,
  MinimalMdxComponents,
  MissingComponent,
  ResourcesCTA,
  ShareRow,
  shortcodes,
  Verse,

  // admin
  ShortsAnalytics,

  // utilities as components
  SocialIcon,
  DownloadCard,

  Icon: ({
    name,
    size = 20,
    ...props
  }: {
    name: keyof typeof Lucide | string;
    size?: number;
    [key: string]: any;
  }) => {
    const LucideIcon = (Lucide as any)[name];
    if (!LucideIcon) return null;
    return <LucideIcon size={size} aria-hidden="true" focusable="false" {...props} />;
  },

  Container: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={cx("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  ),

  Section: ({
    children,
    className,
    bg = "default",
    ...props
  }: React.HTMLAttributes<HTMLElement> & { bg?: "default" | "light" | "dark" | "gradient" }) => {
    const backgrounds = {
      default: "bg-transparent",
      light: "bg-gray-50",
      dark: "bg-charcoal",
      gradient: "bg-gradient-to-b from-charcoal to-black",
    } as const;

    return (
      <section {...props} className={cx("py-12 lg:py-16", backgrounds[bg], className)}>
        {children}
      </section>
    );
  },
};

export default mdxComponents;