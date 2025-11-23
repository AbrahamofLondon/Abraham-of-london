// components/mdx-components.tsx
// Canonical MDX component map – used by all MDX pages (posts, books, downloads, etc.)

import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";
import EmbossedBrandMark from "@/components/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";

interface MdxComponentProps {
  [key: string]: unknown;
  children?: React.ReactNode;
  className?: string;
}

/* ----------------------------- Basic typography ---------------------------- */

const H1 = ({ children, ...rest }: MdxComponentProps) => (
  <h1
    className="mt-6 mb-4 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl"
    {...rest}
  >
    {children}
  </h1>
);

const H2 = ({ children, ...rest }: MdxComponentProps) => (
  <h2
    className="mt-6 mb-3 font-serif text-2xl font-semibold tracking-tight text-white"
    {...rest}
  >
    {children}
  </h2>
);

const H3 = ({ children, ...rest }: MdxComponentProps) => (
  <h3
    className="mt-5 mb-2 font-serif text-xl font-semibold text-white"
    {...rest}
  >
    {children}
  </h3>
);

const H4 = ({ children, ...rest }: MdxComponentProps) => (
  <h4
    className="mt-4 mb-2 text-base font-semibold text-gray-100"
    {...rest}
  >
    {children}
  </h4>
);

const P = ({ children, className = "", ...rest }: MdxComponentProps) => (
  <p
    className={`my-4 text-[0.95rem] leading-relaxed text-gray-200 ${className}`.trim()}
    {...rest}
  >
    {children}
  </p>
);

const Strong = ({ children, ...rest }: MdxComponentProps) => (
  <strong className="font-semibold text-gray-50" {...rest}>
    {children}
  </strong>
);

const Em = ({ children, ...rest }: MdxComponentProps) => (
  <em className="italic text-gray-200" {...rest}>
    {children}
  </em>
);

/* ------------------------------ Lists & misc ------------------------------- */

const Ul = ({ children, ...rest }: MdxComponentProps) => (
  <ul className="my-4 ml-6 list-disc space-y-1 text-gray-200" {...rest}>
    {children}
  </ul>
);

const Ol = ({ children, ...rest }: MdxComponentProps) => (
  <ol className="my-4 ml-6 list-decimal space-y-1 text-gray-200" {...rest}>
    {children}
  </ol>
);

const Li = ({ children, ...rest }: MdxComponentProps) => (
  <li className="leading-relaxed text-gray-200" {...rest}>
    {children}
  </li>
);

const Blockquote = ({ children, ...rest }: MdxComponentProps) => (
  <blockquote
    className="my-6 border-l-4 border-softGold/70 bg-white/5 px-4 py-3 text-[0.95rem] italic text-gray-100"
    {...rest}
  >
    {children}
  </blockquote>
);

/* ------------------------------- Code blocks ------------------------------- */

const Code = ({ children, ...rest }: MdxComponentProps) => (
  <code
    className="rounded bg-slate-900 px-1.5 py-0.5 text-[0.8rem] font-mono text-amber-200"
    {...rest}
  >
    {children}
  </code>
);

const Pre = ({ children, ...rest }: MdxComponentProps) => (
  <pre
    className="my-4 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 text-[0.85rem] text-slate-100"
    {...rest}
  >
    {children}
  </pre>
);

/* --------------------------------- Links ---------------------------------- */

const A = ({ children, ...rest }: MdxComponentProps) => (
  <a
    className="font-medium text-softGold underline-offset-2 hover:text-amber-200 hover:underline"
    {...rest}
  >
    {children}
  </a>
);

/* --------------------------------- Images --------------------------------- */

interface ImageProps extends MdxComponentProps {
  src?: string;
  alt?: string;
}

const MdxImage = (props: ImageProps) => {
  const { src, alt, className = "", ...rest } = props;

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={String(src)}
      alt={alt ? String(alt) : ""}
      className={`my-6 h-auto w-full max-w-3xl rounded-2xl border border-slate-800/70 bg-slate-900/60 object-cover ${className}`.trim()}
      {...rest}
    />
  );
};

/* ----------------------- Layout helpers used in MDX ----------------------- */

const Grid = ({ children, className = "", ...rest }: MdxComponentProps) => (
  <div
    className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}
    {...rest}
  >
    {children}
  </div>
);

/**
 * PullLine – used for those single-line "punch" quotes in downloads/posts.
 */
const PullLine = ({
  children,
  className = "",
  ...rest
}: MdxComponentProps) => (
  <p
    className={`my-6 border-y border-softGold/50 py-3 text-center font-serif text-lg italic text-softGold ${className}`.trim()}
    {...rest}
  >
    {children}
  </p>
);

// Eyebrow component for blog heroes used in MDX
const HeroEyebrow = ({
  children,
  className = "",
  ...rest
}: MdxComponentProps) => (
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
const JsonLdBlock = ({ children, ...rest }: MdxComponentProps) => {
  const data = (rest as { data?: unknown }).data ?? children;
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

interface CalloutBlockProps extends MdxComponentProps {
  type?: "info" | "warning" | "danger";
}

const CalloutBlock = ({
  children,
  type = "info",
  className = "",
  ...rest
}: CalloutBlockProps) => {
  const tone =
    type === "warning" || type === "danger"
      ? "border-amber-400/80 bg-amber-500/10 text-amber-100"
      : "border-softGold/50 bg-softGold/10 text-gray-100";

  return (
    <div
      className={(
        "my-4 rounded-2xl border px-4 py-3 text-sm " +
        tone +
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
const NoteBlock = ({
  children,
  className = "",
  ...rest
}: MdxComponentProps) => (
  <div
    className={(
      "my-4 rounded-xl border border-slate-700 bg-slate-900/80 " +
      "px-4 py-3 text-xs text-gray-200 " +
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
const RuleBlock = ({ className = "", ...rest }: MdxComponentProps) => (
  <hr
    className={(
      "my-8 mx-auto w-full border-t border-softGold/40 " + className
    ).trim()}
    {...rest}
  />
);

/**
 * Caption – for image captions / small explanatory text.
 * Usage in MDX: <Caption>Photo of …</Caption>
 */
const CaptionBlock = ({
  children,
  className = "",
  ...rest
}: MdxComponentProps) => (
  <p
    className={(
      "mt-2 text-center text-[0.75rem] italic text-gray-500 " +
      className
    ).trim()}
    {...rest}
  >
    {children}
  </p>
);

interface BadgeBlockProps extends MdxComponentProps {
  tone?: "primary" | "accent" | "neutral";
}

/**
 * Badge – small pill for tags / labels in posts.
 * Usage in MDX: <Badge tone="primary">Fatherhood</Badge>
 */
const BadgeBlock = ({
  children,
  tone = "neutral",
  className = "",
  ...rest
}: BadgeBlockProps) => {
  const toneClass =
    tone === "primary"
      ? "bg-forest text-slate-50 border-forest/80"
      : tone === "accent"
      ? "bg-softGold/90 text-deepCharcoal border-softGold"
      : "bg-slate-800 text-gray-100 border-slate-600";

  return (
    <span
      className={(
        "inline-flex items-center rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide " +
        toneClass +
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
 * Usage: <BadgeRow><Badge>One</Badge><Badge>Two</Badge></BadgeRow>
 */
const BadgeRowBlock = ({
  children,
  className = "",
  ...rest
}: MdxComponentProps) => (
  <div
    className={(
      "mt-4 flex flex-wrap items-center gap-2 " + className
    ).trim()}
    {...rest}
  >
    {children}
  </div>
);

/**
 * Quote – stylised pull quote, often with author.
 */
interface QuoteProps extends MdxComponentProps {
  author?: React.ReactNode;
}

const QuoteBlock = ({ children, author, ...rest }: QuoteProps) => (
  <figure
    className="my-6 border-l-2 border-softGold/80 pl-4 text-sm text-gray-200"
    {...rest}
  >
    <div className="italic">{children}</div>
    {author != null && author !== false && (
      <figcaption className="mt-2 text-xs uppercase tracking-wide text-gray-400">
        — {author}
      </figcaption>
    )}
  </figure>
);

/**
 * Verse – Scripture or key line with reference.
 */
interface VerseProps extends MdxComponentProps {
  refText?: React.ReactNode;
}

const VerseBlock = ({ children, refText, ...rest }: VerseProps) => (
  <div
    className="my-4 rounded-lg bg-slate-900/80 px-4 py-3 text-sm text-gray-100"
    {...rest}
  >
    <p className="italic">{children}</p>
    {refText != null && refText !== false && (
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-softGold">
        {refText}
      </p>
    )}
  </div>
);

/**
 * ShareRow – simple flex row for share buttons / CTAs.
 */
const ShareRow = ({ children, ...rest }: MdxComponentProps) => (
  <div
    className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-700 pt-4 text-sm"
    {...rest}
  >
    {children}
  </div>
);

interface DownloadCardBlockProps extends MdxComponentProps {
  title?: React.ReactNode;
  heading?: React.ReactNode;
  label?: React.ReactNode;
  href?: string;
  link?: string;
  description?: React.ReactNode;
}

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
}: DownloadCardBlockProps) => {
  const displayTitle = title || heading || "Download";
  const displayDescription = description || children;
  const url = href || link || "";
  const buttonText = label || "Download";

  return (
    <article
      className="my-4 flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-gray-100 shadow-soft-elevated"
      {...rest}
    >
      <div>
        <h4 className="font-serif text-base font-semibold text-slate-50">
          {displayTitle}
        </h4>
        {displayDescription && (
          <p className="mt-2 text-sm text-gray-200">
            {displayDescription}
          </p>
        )}
      </div>

      {url && (
        <div className="mt-4">
          <a
            href={url}
            className="inline-flex items-center rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-slate-50 underline-offset-4 hover:bg-forest/90"
          >
            {buttonText}
          </a>
        </div>
      )}
    </article>
  );
};

interface ResourcesCTABlockProps extends MdxComponentProps {
  title?: React.ReactNode;
  heading?: React.ReactNode;
  label?: React.ReactNode;
  buttonLabel?: React.ReactNode;
  href?: string;
  link?: string;
  description?: React.ReactNode;
}

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
}: ResourcesCTABlockProps) => {
  const displayTitle = title || heading || "Further resources";
  const displayDescription = description || children;
  const url = href || link || "";
  const buttonText = buttonLabel || label || "Explore resources";

  return (
    <section
      className="mt-10 rounded-2xl border border-softGold/40 bg-black/60 p-6"
      {...rest}
    >
      <h3 className="font-serif text-lg font-semibold text-slate-50">
        {displayTitle}
      </h3>
      {displayDescription && (
        <p className="mt-2 text-sm text-gray-200">{displayDescription}</p>
      )}

      {url && (
        <div className="mt-4">
          <a
            href={url}
            className="inline-flex items-center rounded-full bg-softGold px-4 py-2 text-xs font-semibold text-deepCharcoal underline-offset-4 hover:bg-softGold/90"
          >
            {buttonText}
          </a>
        </div>
      )}
    </section>
  );
};

/* ----------------------- Brand-specific MDX components -------------------- */

interface BrandFrameWrapperProps extends MdxComponentProps {
  children?: React.ReactNode;
}

/**
 * BrandFrameWrapper – guard against empty usage in MDX.
 * If MDX renders <BrandFrame /> with no children, we skip it
 * to avoid giant empty frames at the top of posts.
 */
const BrandFrameWrapper = (props: BrandFrameWrapperProps) => {
  const { children, ...rest } = props;

  const hasChildren = React.Children.count(children) > 0;
  if (!hasChildren) return null;

  return <BrandFrame {...rest}>{children}</BrandFrame>;
};

interface EmbossedBrandMarkWrapperProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  effect?: "emboss" | "deboss";
  baseColor?: string;
}

const EmbossedBrandMarkWrapper = (props: EmbossedBrandMarkWrapperProps) => {
  return <EmbossedBrandMark {...props} />;
};

interface EmbossedSignWrapperProps {
  children?: React.ReactNode;
  className?: string;
}

const EmbossedSignWrapper = (props: EmbossedSignWrapperProps) => {
  return <EmbossedSign {...props} />;
};

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
};

export default mdxComponents;