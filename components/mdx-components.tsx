// components/mdx-components.tsx
// Canonical MDX component map – used by all MDX pages (posts, books, downloads, etc.)

import * as React from "react";
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

const A = ({ children, ...rest }: AnyProps) => (
  <a
    className="font-medium text-forest underline-offset-2 hover:text-softGold hover:underline"
    {...rest}
  >
    {children}
  </a>
);

/* --------------------------------- Images --------------------------------- */
/**
 * MDX <img> handler – keep it dead simple.
 * We deliberately use a plain <img> here to avoid Next/Image type friction.
 */
const MdxImage = (props: AnyProps) => {
  const { src, alt = "", className = "", ...rest } = props;

  if (!src) return null;

  return (
    <img
      src={String(src)}
      alt={String(alt)}
      className={`my-4 h-auto w-full rounded-xl object-cover ${className}`.trim()}
      {...rest}
    />
  );
};

/* ----------------------- Layout helpers used in MDX ----------------------- */

const Grid = ({ children, className = "", ...rest }: AnyProps) => (
  <div
    className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}
    {...rest}
  >
    {children}
  </div>
);

/**
 * PullLine – used for those single-line “punch” quotes in downloads/posts.
 */
const PullLine = ({ children, className = "", ...rest }: AnyProps) => (
  <p
    className={`my-6 border-y border-softGold/40 py-3 text-center font-serif text-lg italic text-deepCharcoal ${className}`.trim()}
    {...rest}
  >
    {children}
  </p>
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
  const tone =
    type === "warning" || type === "danger"
      ? "border-amber-500/60 bg-amber-50/10 text-amber-900"
      : "border-softGold/40 bg-softGold/5 text-deepCharcoal";

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
const NoteBlock = ({ children, className = "", ...rest }: AnyProps) => (
  <div
    className={(
      "my-4 rounded-xl border border-lightGrey bg-warmWhite/60 " +
      "px-4 py-3 text-xs text-gray-800 " +
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
 * Usage in MDX: <Caption>Photo of …</Caption>
 */
const CaptionBlock = ({ children, className = "", ...rest }: AnyProps) => (
  <p
    className={(
      "mt-2 text-[0.75rem] text-gray-500 text-center italic " +
      className
    ).trim()}
    {...rest}
  >
    {children}
  </p>
);

/**
 * Badge – small pill for tags / labels in posts.
 * Usage in MDX: <Badge tone="primary">Fatherhood</Badge>
 */
const BadgeBlock = ({
  children,
  tone = "neutral",
  className = "",
  ...rest
}: AnyProps) => {
  const toneClass =
    tone === "primary"
      ? "bg-forest text-cream border-forest/80"
      : tone === "accent"
      ? "bg-softGold/90 text-deepCharcoal border-softGold"
      : "bg-warmWhite text-gray-800 border-lightGrey";

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
const BadgeRowBlock = ({ children, className = "", ...rest }: AnyProps) => (
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
type QuoteProps = AnyProps & { author?: React.ReactNode };

const QuoteBlock = ({ children, author, ...rest }: QuoteProps) => (
  <figure
    className="my-6 border-l-2 border-softGold/80 pl-4 text-sm text-gray-800"
    {...rest}
  >
    <div className="italic">{children}</div>
    {author != null && author !== false && (
      <figcaption className="mt-2 text-xs uppercase tracking-wide text-gray-500">
        — {author}
      </figcaption>
    )}
  </figure>
);

/**
 * Verse – Scripture or key line with reference.
 */
type VerseProps = AnyProps & { refText?: React.ReactNode };

const VerseBlock = ({ children, refText, ...rest }: VerseProps) => (
  <div
    className="my-4 rounded-lg bg-warmWhite/80 px-4 py-3 text-sm text-gray-800"
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
const ShareRow = ({ children, ...rest }: AnyProps) => (
  <div
    className="mt-6 flex flex-wrap items-center gap-3 border-t border-lightGrey pt-4 text-sm"
    {...rest}
  >
    {children}
  </div>
);

/**
 * DownloadCard – compact card for a single downloadable resource.
 *
 * Usage in MDX (examples):
 *   <DownloadCard
 *     title="Brotherhood Code Cheat Sheet"
 *     href="/downloads/brotherhood-code-cheat-sheet.pdf"
 *   >
 *     A one-page summary you can keep on your desk.
 *   </DownloadCard>
 *
 *  or
 *
 *   <DownloadCard
 *     title="Playbook"
 *     link="/downloads/playbook.pdf"
 *     label="Download PDF"
 *   />
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
  const displayTitle =
    (title as React.ReactNode) ||
    (heading as React.ReactNode) ||
    "Download";

  const displayDescription =
    (description as React.ReactNode) || children;

  const url = (href as string) || (link as string) || "";

  const buttonText =
    (label as React.ReactNode) || "Download";

  return (
    <article
      className="my-4 flex flex-col justify-between rounded-2xl border border-lightGrey bg-white p-4 shadow-sm"
      {...rest}
    >
      <div>
        <h4 className="font-serif text-base font-semibold text-deepCharcoal">
          {displayTitle}
        </h4>
        {displayDescription && (
          <p className="mt-2 text-sm text-gray-700">
            {displayDescription}
          </p>
        )}
      </div>

      {url && (
        <div className="mt-4">
          <a
            href={url}
            className="inline-flex items-center rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-cream underline-offset-4 hover:bg-forest/90"
          >
            {buttonText}
          </a>
        </div>
      )}
    </article>
  );
};

/**
 * ResourcesCTA – end-of-article block to push downloads, events, etc.
 * Very forgiving: will render with whatever subset of props MDX passes in.
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
  const displayTitle =
    (title as React.ReactNode) ||
    (heading as React.ReactNode) ||
    "Further resources";
  const displayDescription = (description as React.ReactNode) || children;
  const url = (href as string) || (link as string) || "";

  const buttonText =
    (buttonLabel as React.ReactNode) ||
    (label as React.ReactNode) ||
    "Explore resources";

  return (
    <section
      className="mt-10 rounded-2xl border border-softGold/40 bg-warmWhite/70 p-6"
      {...rest}
    >
      <h3 className="font-serif text-lg font-semibold text-deepCharcoal">
        {displayTitle}
      </h3>
      {displayDescription && (
        <p className="mt-2 text-sm text-gray-700">{displayDescription}</p>
      )}

      {url && (
        <div className="mt-4">
          <a
            href={url}
            className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream underline-offset-4 hover:bg-forest/90"
          >
            {buttonText}
          </a>
        </div>
      )}
    </section>
  );
};
/* ----------------------- Brand-specific MDX components -------------------- */

// Loosen typing so TS doesn't complain when MDX uses these
const BrandFrameWrapper = (props: AnyProps) => {
  const SafeBrandFrame = BrandFrame as unknown as React.ComponentType<any>;
  return <SafeBrandFrame {...props} />;
};

const EmbossedBrandMarkWrapper = (props: AnyProps) => {
  const SafeEmbossed =
    EmbossedBrandMark as unknown as React.ComponentType<any>;
  return <SafeEmbossed {...props} />;
};

const EmbossedSignWrapper = (props: AnyProps) => {
  const SafeEmbossedSign = EmbossedSign as unknown as React.ComponentType<any>;
  return <SafeEmbossedSign {...props} />;
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
  EmbossedSign: EmbossedSignWrapper, // Add this line
};

export default mdxComponents;