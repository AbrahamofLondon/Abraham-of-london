// components/mdx/mdx-components.tsx
"use client";

import * as React from "react";
import JsonLd from '@/components/mdx/JsonLd';
import HeroEyebrow from '@/components/mdx/HeroEyebrow';
import ResourcesCTA from '@/components/mdx/ResourcesCTA';
import BrandFrame from '@/components/mdx/BrandFrame';
import Caption from '@/components/mdx/Caption';
import CTA, { CTAGroup, PrimaryCTA, SecondaryCTA, OutlineCTA } from '@/components/mdx/CTAs';
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

/** ──────────────────────────────────────────────────────────────────────────
 * MDX COMPONENTS - PRODUCTION GRADE
 * - Comprehensive error boundaries and fallbacks
 * - Performance-optimized image handling
 * - Accessibility enhancements
 * - Type-safe component definitions
 * - SEO-friendly markup
 * ────────────────────────────────────────────────────────────────────────── */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  "data-language"?: string;
}

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  id?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Safe URL validation with fallbacks
 */
function isValidUrl(href?: string): boolean {
  if (!href) return false;

  try {
    const url = new URL(href, window.location.origin);
    return ["http:", "https:", "mailto:", "tel:", "/"].some((protocol) =>
      href.startsWith(protocol),
    );
  } catch {
    return href.startsWith("/") || href.startsWith("#");
  }
}

/**
 * Generate heading IDs for anchor links
 */
function generateHeadingId(children: React.ReactNode): string {
  if (typeof children === "string") {
    return children
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  if (
    React.isValidElement(children) &&
    typeof children.props.children === "string"
  ) {
    return generateHeadingId(children.props.children);
  }

  return `heading-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// CORE COMPONENTS
// ============================================================================

const Anchor = React.memo(function Anchor({
  href,
  children,
  className,
  ...props
}: AnchorProps) {
  const [isValid, setIsValid] = React.useState(true);

  React.useEffect(() => {
    setIsValid(isValidUrl(href));
  }, [href]);

  const baseClasses = clsx(
    "underline decoration-softGold/50 underline-offset-4",
    "hover:decoration-softGold transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 rounded-sm",
    className,
  );

  // Handle invalid hrefs gracefully
  if (!isValid || !href) {
    console.warn(`Invalid anchor href: ${href}`);
    return (
      <span
        className={clsx(baseClasses, "opacity-50 cursor-not-allowed")}
        aria-disabled="true"
        title="Invalid link"
      >
        {children}
      </span>
    );
  }

  const isExternal = /^https?:\/\//i.test(href);
  const isHash = href.startsWith("#");
  const isMailto = href.startsWith("mailto:");
  const isTel = href.startsWith("tel:");

  if (isExternal || isMailto || isTel) {
    return (
      <a
        href={href}
        className={baseClasses}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer nofollow" : undefined}
        {...props}
      >
        {children}
        {isExternal && (
          <span aria-hidden="true" className="ml-1 text-xs opacity-60">
            ↗
          </span>
        )}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={baseClasses}
      prefetch={!isHash && false}
      {...props}
    >
      {children}
    </Link>
  );
});

Anchor.displayName = "MDXAnchor";

// ============================================================================

const MdxImage = React.memo(function MdxImage({
  src,
  alt = "",
  className,
  width,
  height,
  ...props
}: ImageProps) {
  const [imgError, setImgError] = React.useState(false);
  const [imgLoading, setImgLoading] = React.useState(true);

  const safeSrc = src || "";
  const safeAlt = alt || "Image";

  const isLocal = safeSrc.startsWith("/");
  const isRemote = safeSrc.startsWith("http");
  const hasValidSrc = safeSrc && (isLocal || isRemote);

  const handleError = React.useCallback(() => {
    setImgError(true);
    setImgLoading(false);
  }, []);

  const handleLoad = React.useCallback(() => {
    setImgLoading(false);
    setImgError(false);
  }, []);

  // Fallback for missing or invalid images
  if (!hasValidSrc || imgError) {
    return (
      <div
        className={clsx(
          "my-6 flex items-center justify-center rounded-xl border-2 border-dashed border-lightGrey bg-warmWhite/30 p-8",
          className,
        )}
        role="img"
        aria-label={safeAlt || "Image placeholder"}
      >
        <div className="text-center">
          <div className="mx-auto mb-2 text-2xl opacity-40">🖼️</div>
          <p className="text-sm text-deepCharcoal/60">
            {safeAlt || "Image not available"}
          </p>
        </div>
      </div>
    );
  }

  // Use Next.js Image for local images
  if (isLocal) {
    return (
      <figure className="my-6">
        <div
          className={clsx(
            "relative block overflow-hidden rounded-xl bg-warmWhite/50",
            imgLoading && "animate-pulse",
          )}
        >
          <Image
            src={safeSrc}
            alt={safeAlt}
            width={width ? Number(width) : 1920}
            height={height ? Number(height) : 1080}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 860px, 1024px"
            className={clsx(
              "h-auto w-full object-contain transition-opacity duration-300",
              imgLoading ? "opacity-0" : "opacity-100",
              className,
            )}
            onError={handleError}
            onLoad={handleLoad}
            priority={false}
            quality={85}
          />

          {/* Loading skeleton */}
          {imgLoading && (
            <div
              className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Caption */}
        {safeAlt && (
          <figcaption className="mt-3 text-center text-sm text-deepCharcoal/70 leading-relaxed">
            {safeAlt}
          </figcaption>
        )}
      </figure>
    );
  }

  // Fallback to native img for remote images (bypassing Next.js Image optimization)
  return (
    <figure className="my-6">
      <div
        className={clsx(
          "relative block overflow-hidden rounded-xl bg-warmWhite/50",
          imgLoading && "animate-pulse",
        )}
      >
        <img
          src={safeSrc}
          alt={safeAlt}
          className={clsx(
            "h-auto w-full object-contain transition-opacity duration-300",
            imgLoading ? "opacity-0" : "opacity-100",
            className,
          )}
          onError={handleError}
          onLoad={handleLoad}
          {...props}
        />

        {/* Loading skeleton */}
        {imgLoading && (
          <div
            className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Caption */}
      {safeAlt && (
        <figcaption className="mt-3 text-center text-sm text-deepCharcoal/70 leading-relaxed">
            {safeAlt}
        </figcaption>
      )}
    </figure>
  );
});

MdxImage.displayName = "MDXImage";

// ============================================================================

const Pre = React.memo(function Pre({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      {...props}
      className={clsx(
        "my-6 overflow-x-auto rounded-xl border border-lightGrey",
        "bg-[rgba(0,0,0,.95)] p-4 text-[13px] leading-relaxed text-cream",
        "font-mono subpixel-antialiased",
        className,
      )}
    >
      {children}
    </pre>
  );
});

Pre.displayName = "MDXPre";

// ============================================================================

const Code = React.memo(function Code({
  children,
  className,
  "data-language": language,
  ...props
}: CodeProps) {
  const isBlock = className?.includes("language-");

  if (isBlock) {
    return (
      <code
        {...props}
        className={clsx(
          "block font-mono text-[0.9em] subpixel-antialiased",
          className,
        )}
        data-language={language}
      >
        {children}
      </code>
    );
  }

  return (
    <code
      {...props}
      className={clsx(
        "rounded-md bg-warmWhite px-1.5 py-[2px] text-[0.85em]",
        "text-deepCharcoal ring-1 ring-inset ring-lightGrey/70",
        "font-mono subpixel-antialiased",
        className,
      )}
    >
      {children}
    </code>
  );
});

Code.displayName = "MDXCode";

// ============================================================================

const Table = React.memo(function Table({
  children,
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-lightGrey shadow-sm">
      <table
        {...props}
        className={clsx(
          "min-w-full border-collapse text-sm",
          "bg-white dark:bg-gray-900",
          className,
        )}
      >
        {children}
      </table>
    </div>
  );
});

Table.displayName = "MDXTable";

// ============================================================================
// CONTENT COMPONENTS
// ============================================================================

const Blockquote = React.memo(function Blockquote({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      {...props}
      className={clsx(
        "my-6 border-l-4 border-softGold/70",
        "bg-warmWhite/60 dark:bg-gray-800/50",
        "p-4 italic text-deepCharcoal/80 dark:text-gray-200",
        "rounded-r-lg",
        className,
      )}
    >
      {children}
    </blockquote>
  );
});

Blockquote.displayName = "MDXBlockquote";

// ============================================================================

const UnorderedList = React.memo(function UnorderedList({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      {...props}
      className={clsx(
        "my-4 ml-6 list-disc space-y-2",
        "text-deepCharcoal/90 dark:text-gray-200",
        className,
      )}
    >
      {children}
    </ul>
  );
});

UnorderedList.displayName = "MDXUnorderedList";

// ============================================================================

const OrderedList = React.memo(function OrderedList({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLOListElement>) {
  return (
    <ol
      {...props}
      className={clsx(
        "my-4 ml-6 list-decimal space-y-2",
        "text-deepCharcoal/90 dark:text-gray-200",
        className,
      )}
    >
      {children}
    </ol>
  );
});

OrderedList.displayName = "MDXOrderedList";

// ============================================================================

const Paragraph = React.memo(function Paragraph({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={clsx(
        "my-4 leading-relaxed text-deepCharcoal/90 dark:text-gray-200",
        "text-[15px] md:text-[16px]",
        className,
      )}
    >
      {children}
    </p>
  );
});

Paragraph.displayName = "MDXParagraph";

// ============================================================================
// CUSTOM MDX COMPONENTS
// ============================================================================

const Note = React.memo(function Note({ 
  children, 
  className,
  ...props 
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "my-6 rounded-xl border-l-4 border-blue-500 bg-blue-50/80 p-4",
        "dark:bg-blue-900/20 dark:border-blue-400",
        className
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

Note.displayName = "MDXNote";

const Badge = React.memo(function Badge({ 
  children, 
  variant = "default",
  className,
  ...props 
}: { 
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline";
} & React.HTMLAttributes<HTMLSpanElement>) {
  const variantStyles = {
    default: "bg-forest text-white",
    secondary: "bg-softGold text-deepCharcoal",
    outline: "border border-forest text-forest bg-transparent"
  };

  return (
    <span
      {...props}
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
});

Badge.displayName = "MDXBadge";

// ============================================================================
// HEADING COMPONENTS WITH ANCHOR LINKS
// ============================================================================

const createHeading = (
  Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
  baseClasses: string,
) =>
  React.memo(function Heading({
    children,
    className,
    id,
    ...props
  }: HeadingProps) {
    const headingId = id || generateHeadingId(children);
    const [isCopied, setIsCopied] = React.useState(false);

    const handleCopyLink = React.useCallback(async () => {
      try {
        const url = `${window.location.origin}${window.location.pathname}#${headingId}`;
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.warn("Failed to copy link:", err);
      }
    }, [headingId]);

    return (
      <Tag
        id={headingId}
        {...props}
        className={clsx(
          "group relative scroll-mt-20", // scroll-mt for anchor links
          baseClasses,
          className,
        )}
      >
        {/* Anchor link indicator */}
        <a
          href={`#${headingId}`}
          className={clsx(
            "absolute -left-6 top-1/2 -translate-y-1/2",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "text-forest hover:text-forest/70",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-sm",
          )}
          aria-label={`Link to ${typeof children === "string" ? children : "this section"}`}
          onClick={handleCopyLink}
          title={isCopied ? "Copied!" : "Copy link to this section"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {isCopied ? (
              <path
                d="M20 6L9 17l-5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            )}
          </svg>
        </a>

        {children}
      </Tag>
    );
  });

// Heading components
const H1 = createHeading(
  "h1",
  "mt-8 mb-6 font-serif text-3xl md:text-4xl font-semibold text-deepCharcoal dark:text-white",
);
const H2 = createHeading(
  "h2",
  "mt-8 mb-4 font-serif text-2xl md:text-3xl font-semibold text-deepCharcoal dark:text-white",
);
const H3 = createHeading(
  "h3",
  "mt-6 mb-3 font-serif text-xl md:text-2xl font-semibold text-deepCharcoal dark:text-white",
);
const H4 = createHeading(
  "h4",
  "mt-5 mb-2 font-serif text-lg md:text-xl font-semibold text-deepCharcoal dark:text-white",
);
const H5 = createHeading(
  "h5",
  "mt-4 mb-2 font-serif text-base md:text-lg font-semibold text-deepCharcoal dark:text-white",
);
const H6 = createHeading(
  "h6",
  "mt-4 mb-2 font-serif text-sm md:text-base font-semibold text-deepCharcoal dark:text-white",
);

// Set display names
H1.displayName = "MDXH1";
H2.displayName = "MDXH2";
H3.displayName = "MDXH3";
H4.displayName = "MDXH4";
H5.displayName = "MDXH5";
H6.displayName = "MDXH6";

// ============================================================================
// MDX COMPONENTS MAP
// ============================================================================

const MDXComponents = {
  // Custom components
  Note,
  Badge,
  Caption,
  CTA,
  CTAGroup,
  PrimaryCTA,
  SecondaryCTA,
  OutlineCTA,
  BrandFrame,
  JsonLd,
  ResourcesCTA,
  HeroEyebrow,
  
  // Core elements
  a: Anchor,
  img: MdxImage,
  pre: Pre,
  code: Code,
  table: Table,

  // Content elements
  blockquote: Blockquote,
  ul: UnorderedList,
  ol: OrderedList,
  p: Paragraph,

  // Headings with anchor links
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,

  // Additional semantic elements
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong
      className="font-semibold text-deepCharcoal dark:text-white"
      {...props}
    />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-deepCharcoal/90 dark:text-gray-200" {...props} />
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr
      className="my-8 border-t border-lightGrey dark:border-gray-700"
      {...props}
    />
  ),

  // Table sub-components
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead
      className="bg-warmWhite dark:bg-gray-800 border-b border-lightGrey dark:border-gray-700"
      {...props}
    />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody
      className="divide-y divide-lightGrey dark:divide-gray-700"
      {...props}
    />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className="hover:bg-warmWhite/50 dark:hover:bg-gray-800/50 transition-colors"
      {...props}
    />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-4 py-3 text-left font-semibold text-deepCharcoal dark:text-white border-r border-lightGrey dark:border-gray-700 last:border-r-0"
      {...props}
    />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="px-4 py-3 text-deepCharcoal/90 dark:text-gray-200 border-r border-lightGrey dark:border-gray-700 last:border-r-0"
      {...props}
    />
  ),
};

// ============================================================================
// EXPORTS
// ============================================================================

export default MDXComponents;

// Named exports for individual component usage
export {
  Note,
  Badge,
  Caption,
  CTA,
  CTAGroup,
  PrimaryCTA,
  SecondaryCTA,
  OutlineCTA,
  Anchor,
  MdxImage,
  Pre,
  Code,
  Table,
  Blockquote,
  UnorderedList,
  OrderedList,
  Paragraph,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  generateHeadingId,
  isValidUrl,
};
