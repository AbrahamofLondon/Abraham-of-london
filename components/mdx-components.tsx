// components/mdx-components.tsx
import * as React from "react";
import Image from "next/image";
import BrandFrame from "@/components/print/BrandFrame";
import EmbossedBrandMark from "@/components/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";

type AnyProps = {
  [key: string]: any;
  children?: React.ReactNode;
};

/* ----------------------------- Basic typography ---------------------------- */

const H1 = ({ children, ...rest }: AnyProps) => (
  <h1
    className="mt-6 mb-4 font-serif text-3xl font-semibold text-deepCharcoal sm:text-4xl"
    {...rest}
  >
    {children}
  </h1>
);

const H2 = ({ children, ...rest }: AnyProps) => (
  <h2
    className="mt-6 mb-3 font-serif text-2xl font-semibold text-deepCharcoal"
    {...rest}
  >
    {children}
  </h2>
);

const H3 = ({ children, ...rest }: AnyProps) => (
  <h3
    className="mt-5 mb-2 font-serif text-xl font-semibold text-deepCharcoal"
    {...rest}
  >
    {children}
  </h3>
);

const H4 = ({ children, ...rest }: AnyProps) => (
  <h4
    className="mt-4 mb-2 text-base font-semibold text-deepCharcoal"
    {...rest}
  >
    {children}
  </h4>
);

const P = ({ children, className = "", ...rest }: AnyProps) => (
  <p
    className={
      "my-4 text-[0.95rem] leading-relaxed text-gray-800 dark:text-gray-100 " +
      className
    }
    {...rest}
  >
    {children}
  </p>
);

const Strong = ({ children, ...rest }: AnyProps) => (
  <strong className="font-semibold text-deepCharcoal" {...rest}>
    {children}
  </strong>
);

const Em = ({ children, ...rest }: AnyProps) => (
  <em className="italic" {...rest}>
    {children}
  </em>
);

/* ------------------------------ Lists & misc ------------------------------- */

const Ul = ({ children, ...rest }: AnyProps) => (
  <ul className="my-4 ml-6 list-disc space-y-1 text-gray-800" {...rest}>
    {children}
  </ul>
);

const Ol = ({ children, ...rest }: AnyProps) => (
  <ol className="my-4 ml-6 list-decimal space-y-1 text-gray-800" {...rest}>
    {children}
  </ol>
);

const Li = ({ children, ...rest }: AnyProps) => (
  <li className="leading-relaxed" {...rest}>
    {children}
  </li>
);

const Blockquote = ({ children, ...rest }: AnyProps) => (
  <blockquote
    className="my-6 border-l-4 border-softGold/70 bg-warmWhite/60 px-4 py-3 text-[0.95rem] italic text-deepCharcoal"
    {...rest}
  >
    {children}
  </blockquote>
);

/* ------------------------------- Code blocks ------------------------------- */

const Code = ({ children, ...rest }: AnyProps) => (
  <code
    className="rounded bg-slate-800 px-1.5 py-0.5 text-[0.8rem] text-emerald-200"
    {...rest}
  >
    {children}
  </code>
);

const Pre = ({ children, ...rest }: AnyProps) => (
  <pre
    className="my-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-[0.85rem] text-slate-100"
    {...rest}
  >
    {children}
  </pre>
);

/* --------------------------------- Links ---------------------------------- */

const A = ({ children, href, ...rest }: AnyProps) => {
  const isExternal = href?.startsWith('http') || href?.startsWith('//');
  const anchorProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  
  return (
    <a
      href={href}
      className="font-medium text-forest underline-offset-2 hover:text-softGold hover:underline"
      {...anchorProps}
      {...rest}
    >
      {children}
    </a>
  );
};

/* --------------------------------- Images --------------------------------- */
/**
 * Modern MDX Image handler with Next.js Image optimization
 */
const MdxImage = (props: AnyProps) => {
  const { src, alt = "", className = "", width, height, ...rest } = props;

  if (!src) return null;

  // Handle external images vs local images
  const isExternal = src.startsWith('http') || src.startsWith('//');
  
  // Default dimensions for when not provided
  const imageWidth = width ? parseInt(String(width)) : 800;
  const imageHeight = height ? parseInt(String(height)) : 600;

  return (
    <div className={`my-6 relative ${className}`.trim()}>
      <Image
        src={src}
        alt={String(alt)}
        width={imageWidth}
        height={imageHeight}
        className="rounded-xl object-cover w-full h-auto"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaUMk9jkHLyDswBwcq9sCsoqKvWpb9bT31bNVA5I+Yq6tZug1rWmG3n6nqYvqkBdMkSOSicf4q6/9k="
        unoptimized={isExternal} // Only optimize local images for static export
        {...rest}
      />
      {alt && (
        <figcaption className="mt-2 text-sm text-gray-600 text-center italic">
          {alt}
        </figcaption>
      )}
    </div>
  );
};

/* ----------------------- Layout helpers used in MDX ----------------------- */

const Grid = ({ children, className = "", ...rest }: AnyProps) => (
  <div
    className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}
    {...rest}
  >
    {children}
  </div>
);

/**
 * PullLine – used for those single-line "punch" quotes in downloads/posts.
 */
const PullLine = ({ children, className = "", ...rest }: AnyProps) => (
  <div
    className={`my-8 border-y border-softGold/40 py-4 text-center ${className}`.trim()}
    {...rest}
  >
    <p className="font-serif text-lg md:text-xl italic text-deepCharcoal">
      {children}
    </p>
  </div>
);

// Eyebrow component for blog heroes used in MDX
const HeroEyebrow = ({ children, className = "", ...rest }: AnyProps) => (
  <p
    className={(
      "mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.25em] " +
      "text-softGold/80 " +
      className
    ).trim()}
    {...rest}
  >
    {children}
  </p>
);

/* ---------------------- Utility / semantic MDX blocks --------------------- */

/**
 * JsonLd – allows MDX to inject structured data.
 */
const JsonLdBlock = ({ children, ...rest }: AnyProps) => {
  const data = (rest as any).data ?? children;
  if (!data) return null;

  const json =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
};

/**
 * Callout – highlighted block for key ideas / warnings.
 */
const CalloutBlock = ({
  children,
  type = "info",
  className = "",
  ...rest
}: AnyProps) => {
  const toneMap = {
    info: "border-softGold/40 bg-softGold/5 text-deepCharcoal",
    warning: "border-amber-500/60 bg-amber-50/10 text-amber-900",
    danger: "border-red-500/60 bg-red-50/10 text-red-900",
    success: "border-green-500/60 bg-green-50/10 text-green-900",
  };

  return (
    <div
      className={(
        "my-6 rounded-2xl border px-6 py-4 text-sm " +
        toneMap[type as keyof typeof toneMap] +
        " " +
        className
      ).trim()}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Note – softer, secondary emphasis block.
 */
const NoteBlock = ({ children, className = "", ...rest }: AnyProps) => (
  <div
    className={(
      "my-4 rounded-xl border border-lightGrey bg-warmWhite/60 " +
      "px-4 py-3 text-sm text-gray-800 " +
      className
    ).trim()}
    {...rest}
  >
    {children}
  </div>
);

/**
 * Rule – horizontal rule used in MDX (`<Rule />` and `<hr />`).
 */
const RuleBlock = ({ className = "", ...rest }: AnyProps) => (
  <hr
    className={(
      "my-8 mx-auto w-full border-t border-softGold/40 " + className
    ).trim()}
    {...rest}
  />
);

/**
 * Caption – for image captions / small explanatory text.
 */
const CaptionBlock = ({ children, className = "", ...rest }: AnyProps) => (
  <figcaption
    className={(
      "mt-2 text-sm text-gray-600 text-center italic " +
      className
    ).trim()}
    {...rest}
  >
    {children}
  </figcaption>
);

/**
 * Badge – small pill for tags / labels in posts.
 */
const BadgeBlock = ({
  children,
  tone = "neutral",
  className = "",
  ...rest
}: AnyProps) => {
  const toneMap = {
    primary: "bg-forest text-cream border-forest/80",
    accent: "bg-softGold/90 text-deepCharcoal border-softGold",
    neutral: "bg-warmWhite text-gray-800 border-lightGrey",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide " +
        toneMap[tone as keyof typeof toneMap] +
        " " +
        className
      ).trim()}
      {...rest}
    >
      {children}
    </span>
  );
};

/**
 * BadgeRow – row layout for multiple badges.
 */
const BadgeRowBlock = ({ children, className = "", ...rest }: AnyProps) => (
  <div
    className={(
      "my-4 flex flex-wrap items-center gap-2 " + className
    ).trim()}
    {...rest}
  >
    {children}
  </div>
);

/**
 * Quote – stylised pull quote, often with author.
 */
type QuoteProps = AnyProps & { author?: React.ReactNode; cite?: string };

const QuoteBlock = ({ children, author, cite, ...rest }: QuoteProps) => (
  <figure
    className="my-8 border-l-4 border-softGold/80 pl-6 py-2"
    {...rest}
  >
    <blockquote className="text-lg italic text-gray-700">
      {children}
    </blockquote>
    {(author || cite) && (
      <figcaption className="mt-3 text-sm text-gray-600">
        {author && <span className="font-semibold">— {author}</span>}
        {cite && (
          <cite className="not-italic text-gray-500 ml-2">
            ({cite})
          </cite>
        )}
      </figcaption>
    )}
  </figure>
);

/**
 * Verse – Scripture or key line with reference.
 */
type VerseProps = AnyProps & { reference?: React.ReactNode };

const VerseBlock = ({ children, reference, ...rest }: VerseProps) => (
  <div
    className="my-6 rounded-lg bg-warmWhite/80 px-6 py-4"
    {...rest}
  >
    <p className="italic text-gray-800 text-lg leading-relaxed">{children}</p>
    {reference && (
      <p className="mt-3 text-sm font-medium uppercase tracking-wide text-softGold">
        {reference}
      </p>
    )}
  </div>
);

/**
 * ShareRow – simple flex row for share buttons / CTAs.
 */
const ShareRow = ({ children, ...rest }: AnyProps) => (
  <div
    className="my-8 flex flex-wrap items-center gap-4 border-t border-lightGrey pt-6"
    {...rest}
  >
    {children}
  </div>
);

/**
 * DownloadCard – compact card for a single downloadable resource.
 */
const DownloadCardBlock = ({
  title,
  heading,
  label,
  href,
  link,
  description,
  children,
  ...rest
}: AnyProps) => {
  const displayTitle = title || heading || "Download";
  const displayDescription = description || children;
  const url = href || link || "";

  return (
    <article
      className="my-6 flex flex-col justify-between rounded-2xl border border-lightGrey bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
      {...rest}
    >
      <div>
        <h4 className="font-serif text-lg font-semibold text-deepCharcoal">
          {displayTitle}
        </h4>
        {displayDescription && (
          <p className="mt-3 text-gray-700 leading-relaxed">
            {displayDescription}
          </p>
        )}
      </div>

      {url && (
        <div className="mt-6">
          <a
            href={url}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream hover:bg-forest/90 transition-colors"
          >
            {label || "Download PDF"}
          </a>
        </div>
      )}
    </article>
  );
};

/**
 * ResourcesCTA – end-of-article block to push downloads, events, etc.
 */
const ResourcesCTABlock = ({
  title,
  heading,
  label,
  buttonLabel,
  href,
  link,
  description,
  children,
  ...rest
}: AnyProps) => {
  const displayTitle = title || heading || "Further resources";
  const displayDescription = description || children;
  const url = href || link || "";

  return (
    <section
      className="my-10 rounded-2xl border border-softGold/40 bg-warmWhite/70 p-8"
      {...rest}
    >
      <h3 className="font-serif text-xl font-semibold text-deepCharcoal">
        {displayTitle}
      </h3>
      {displayDescription && (
        <p className="mt-3 text-gray-700">{displayDescription}</p>
      )}

      {url && (
        <div className="mt-6">
          <a
            href={url}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest/90 transition-colors"
          >
            {buttonLabel || label || "Explore resources"}
          </a>
        </div>
      )}
    </section>
  );
};

/* ----------------------- Brand-specific MDX components -------------------- */

// Type-safe wrappers for brand components
const BrandFrameWrapper = (props: AnyProps) => <BrandFrame {...props} />;
const EmbossedBrandMarkWrapper = (props: AnyProps) => <EmbossedBrandMark {...props} />;
const EmbossedSignWrapper = (props: AnyProps) => <EmbossedSign {...props} />;

/* --------------------------- Exported map for MDX -------------------------- */

export const mdxComponents = {
  // Headings & text
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  strong: Strong,
  em: Em,

  // Lists
  ul: Ul,
  ol: Ol,
  li: Li,
  blockquote: Blockquote,

  // Code + pre
  code: Code,
  pre: Pre,

  // Links + images
  a: A,
  img: MdxImage,

  // Layout / helpers
  Grid,
  PullLine,
  HeroEyebrow,

  // Semantic / utility blocks
  JsonLd: JsonLdBlock,
  Callout: CalloutBlock,
  Note: NoteBlock,
  Rule: RuleBlock,
  hr: RuleBlock,
  Caption: CaptionBlock,
  Badge: BadgeBlock,
  BadgeRow: BadgeRowBlock,
  Quote: QuoteBlock,
  Verse: VerseBlock,
  ShareRow,
  DownloadCard: DownloadCardBlock,
  ResourcesCTA: ResourcesCTABlock,

  // Brand components used in MDX content
  BrandFrame: BrandFrameWrapper,
  EmbossedBrandMark: EmbossedBrandMarkWrapper,
  EmbossedSign: EmbossedSignWrapper,
} as const;

export default mdxComponents;