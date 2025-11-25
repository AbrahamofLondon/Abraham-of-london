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
    className="mt-10 mb-6 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-gray-50"
    {...rest}
  >
    {children}
  </h1>
);

const H2 = ({ children, ...rest }: MdxComponentProps) => (
  <h2
    className="mt-8 mb-4 font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-gray-50"
    {...rest}
  >
    {children}
  </h2>
);

const H3 = ({ children, ...rest }: MdxComponentProps) => (
  <h3
    className="mt-7 mb-3 font-serif text-xl sm:text-2xl font-semibold text-gray-50"
    {...rest}
  >
    {children}
  </h3>
);

const H4 = ({ children, ...rest }: MdxComponentProps) => (
  <h4
    className="mt-6 mb-3 text-base font-semibold text-gray-100"
    {...rest}
  >
    {children}
  </h4>
);

const P = ({ children, className = "", ...rest }: MdxComponentProps) => (
  <p
    className={`my-5 text-[1.02rem] sm:text-[1.06rem] leading-[1.9] text-gray-100 ${className}`.trim()}
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
  <ul
    className="my-5 ml-6 list-disc space-y-2 text-[1.02rem] leading-relaxed text-gray-100"
    {...rest}
  >
    {children}
  </ul>
);

const Ol = ({ children, ...rest }: MdxComponentProps) => (
  <ol
    className="my-5 ml-6 list-decimal space-y-2 text-[1.02rem] leading-relaxed text-gray-100"
    {...rest}
  >
    {children}
  </ol>
);

const Li = ({ children, ...rest }: MdxComponentProps) => (
  <li className="leading-relaxed text-gray-100" {...rest}>
    {children}
  </li>
);

const Blockquote = ({ children, ...rest }: MdxComponentProps) => (
  <blockquote
    className="my-8 border-l-4 border-softGold/70 bg-white/5 px-5 py-4 text-[1rem] leading-relaxed italic text-gray-100 rounded-r-2xl"
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
    className="my-6 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 text-[0.85rem] text-slate-100"
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
    <figure className="my-8 flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={String(src)}
        alt={alt ? String(alt) : ""}
        className={(
          "block h-auto w-auto max-w-full " +       // no forced full-width stretch
          "max-h-[420px] sm:max-h-[460px] md:max-h-[500px] " + // HARD HEIGHT CAP
          "rounded-2xl border border-slate-800/70 bg-slate-900/60 " +
          "object-contain shadow-soft-elevated " +
          className
        ).trim()}
        {...rest}
      />
    </figure>
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
    className={`my-8 border-y border-softGold/50 py-4 text-center font-serif text-lg sm:text-xl italic text-softGold ${className}`.trim()}
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
        "my-6 rounded-2xl border px-5 py-4 text-sm " +
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

const NoteBlock = ({
  children,
  className = "",
  ...rest
}: MdxComponentProps) => (
  <div
    className={(
      "my-5 rounded-xl border border-slate-700 bg-slate-900/80 " +
      "px-4 py-3 text-xs sm:text-sm text-gray-200 " +
      className
    ).trim()}
    {...rest}
  >
    {children}
  </div>
);

const RuleBlock = ({ className = "", ...rest }: MdxComponentProps) => (
  <hr
    className={(
      "my-10 mx-auto w-full border-t border-softGold/40 " + className
    ).trim()}
    {...rest}
  />
);

const CaptionBlock = ({
  children,
  className = "",
  ...rest
}: MdxComponentProps) => (
  <p
    className={(
      "mt-2 text-center text-[0.8rem] italic text-gray-500 " +
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

interface QuoteProps extends MdxComponentProps {
  author?: React.ReactNode;
}

const QuoteBlock = ({ children, author, ...rest }: QuoteProps) => (
  <figure
    className="my-7 border-l-2 border-softGold/80 pl-4 text-sm text-gray-200"
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

interface VerseProps extends MdxComponentProps {
  refText?: React.ReactNode;
}

const VerseBlock = ({ children, refText, ...rest }: VerseProps) => (
  <div
    className="my-5 rounded-lg bg-slate-900/80 px-4 py-3 text-sm text-gray-100"
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

const ShareRow = ({ children, ...rest }: MdxComponentProps) => (
  <div
    className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-700 pt-4 text-sm"
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
      className="my-5 flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-gray-100 shadow-soft-elevated"
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
      className="mt-12 rounded-2xl border border-softGold/40 bg-black/60 p-6"
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
  Grid,// Canonical MDX component map – used by all MDX pages (posts, books, downloads, etc.)

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
    className="mt-10 mb-6 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-gray-50"
    {...rest}
  >
    {children}
  </h1>
);

const H2 = ({ children, ...rest }: MdxComponentProps) => (
  <h2
    className="mt-8 mb-4 font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-gray-50"
    {...rest}
  >
    {children}
  </h2>
);

const H3 = ({ children, ...rest }: MdxComponentProps) => (
  <h3
    className="mt-7 mb-3 font-serif text-xl sm:text-2xl font-semibold text-gray-50"
    {...rest}
  >
    {children}
  </h3>
);

const H4 = ({ children, ...rest }: MdxComponentProps) => (
  <h4
    className="mt-6 mb-3 text-base font-semibold text-gray-100"
    {...rest}
  >
    {children}
  </h4>
);

const P = ({ children, className = "", ...rest }: MdxComponentProps) => (
  <p
    className={`my-5 text-[1.02rem] sm:text-[1.06rem] leading-[1.9] text-gray-100 ${className}`.trim()}
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
  <ul
    className="my-5 ml-6 list-disc space-y-2 text-[1.02rem] leading-relaxed text-gray-100"
    {...rest}
  >
    {children}
  </ul>
);

const Ol = ({ children, ...rest }: MdxComponentProps) => (
  <ol
    className="my-5 ml-6 list-decimal space-y-2 text-[1.02rem] leading-relaxed text-gray-100"
    {...rest}
  >
    {children}
  </ol>
);

const Li = ({ children, ...rest }: MdxComponentProps) => (
  <li className="leading-relaxed text-gray-100" {...rest}>
    {children}
  </li>
);

const Blockquote = ({ children, ...rest }: MdxComponentProps) => (
  <blockquote
    className="my-8 border-l-4 border-softGold/70 bg-white/5 px-5 py-4 text-[1rem] leading-relaxed italic text-gray-100 rounded-r-2xl"
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
    className="my-6 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 text-[0.85rem] text-slate-100"
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
    <figure className="my-8 flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={String(src)}
        alt={alt ? String(alt) : ""}
        className={(
          "block h-auto w-auto max-w-full " + // no forced full-width stretch
          "max-h-[420px] sm:max-h-[460px] md:max-h-[500px] " + // HARD HEIGHT CAP
          "rounded-2xl border border-slate-800/70 bg-slate-900/60 " +
          "object-contain shadow-soft-elevated " +
          className
        ).trim()}
        {...rest}
      />
    </figure>
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
    className={`my-8 border-y border-softGold/50 py-4 text-center font-serif text-lg sm:text-xl italic text-softGold ${className}`.trim()}
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
  tone?: "info" | "key" | "warning" | "danger";
  title?: React.ReactNode;
}

const CalloutBlock = ({
  children,
  type = "info",
  tone,
  title,
  className = "",
  ...rest
}: CalloutBlockProps) => {
  const effectiveTone = tone ?? type;

  const toneClass =
    effectiveTone === "warning" || effectiveTone === "danger"
      ? "border-amber-400/80 bg-amber-500/10 text-amber-100"
      : effectiveTone === "key"
      ? "border-softGold/80 bg-softGold/15 text-gray-100"
      : "border-softGold/50 bg-softGold/10 text-gray-100";

  return (
    <div
      className={(
        "my-6 rounded-2xl border px-5 py-4 text-sm " +
        toneClass +
        " " +
        className
      ).trim()}
      {...rest}
    >
      {title && (
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-softGold/90">
          {title}
        </p>
      )}
      {children}
    </div>
  );
};

interface NoteBlockProps extends MdxComponentProps {
  tone?: "info" | "key" | "warning";
  title?: React.ReactNode;
}

const NoteBlock = ({
  children,
  tone = "info",
  title,
  className = "",
  ...rest
}: NoteBlockProps) => {
  const toneClass =
    tone === "warning"
      ? "border-amber-400/70 bg-amber-500/10 text-amber-50"
      : tone === "key"
      ? "border-softGold/60 bg-softGold/10 text-gray-100"
      : "border-slate-700 bg-slate-900/80 text-gray-200";

  return (
    <div
      className={(
        "my-5 rounded-xl px-4 py-3 text-xs sm:text-sm " +
        toneClass +
        " " +
        className
      ).trim()}
      {...rest}
    >
      {title && (
        <p className="mb-1 text-[0.75rem] font-semibold uppercase tracking-wide text-softGold/90">
          {title}
        </p>
      )}
      {children}
    </div>
  );
};

const RuleBlock = ({ className = "", ...rest }: MdxComponentProps) => (
  <hr
    className={(
      "my-10 mx-auto w-full border-t border-softGold/40 " + className
    ).trim()}
    {...rest}
  />
);

const CaptionBlock = ({
  children,
  className = "",
  ...rest
}: MdxComponentProps) => (
  <p
    className={(
      "mt-2 text-center text-[0.8rem] italic text-gray-500 " +
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

interface QuoteProps extends MdxComponentProps {
  author?: React.ReactNode;
}

const QuoteBlock = ({ children, author, ...rest }: QuoteProps) => (
  <figure
    className="my-7 border-l-2 border-softGold/80 pl-4 text-sm text-gray-200"
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

interface VerseProps extends MdxComponentProps {
  refText?: React.ReactNode;
  cite?: React.ReactNode; // support <Verse cite="...">
}

const VerseBlock = ({ children, refText, cite, ...rest }: VerseProps) => {
  const reference = refText ?? cite;

  return (
    <div
      className="my-5 rounded-lg bg-slate-900/80 px-4 py-3 text-sm text-gray-100"
      {...rest}
    >
      <p className="italic">{children}</p>
      {reference != null && reference !== false && (
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-softGold">
          {reference}
        </p>
      )}
    </div>
  );
};

interface ShareRowProps extends MdxComponentProps {
  text?: string;
  hashtags?: string;
}

const ShareRow = ({ children, text, hashtags, ...rest }: ShareRowProps) => {
  const hasChildren = React.Children.count(children) > 0;
  const baseText =
    text ||
    (typeof children === "string" ? (children as string) : undefined);

  const tags =
    typeof hashtags === "string"
      ? hashtags
          .split(/[,\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  return (
    <div
      className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-700 pt-4 text-sm"
      {...rest}
    >
      {hasChildren && !text && !hashtags ? (
        children
      ) : (
        <>
          {baseText && (
            <p className="text-gray-200">{baseText}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-softGold/80">
              {tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface DownloadCardBlockProps extends MdxComponentProps {
  title?: React.ReactNode;
  heading?: React.ReactNode;
  label?: React.ReactNode;
  href?: string;
  link?: string;
  description?: React.ReactNode;
}

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
      className="my-5 flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-gray-100 shadow-soft-elevated"
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
      className="mt-12 rounded-2xl border border-softGold/40 bg-black/60 p-6"
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