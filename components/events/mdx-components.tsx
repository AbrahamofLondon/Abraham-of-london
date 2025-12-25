import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Rule from "@/components/mdx/Rule";

/* -------------------------------------------------------------------------- */
/* Basic typography                                                            */
/* -------------------------------------------------------------------------- */

const H1: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h1 className="mt-6 font-serif text-3xl font-semibold text-deepCharcoal md:text-4xl">
    {children}
  </h1>
);

const H2: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h2 className="mt-6 font-serif text-2xl font-semibold text-deepCharcoal md:text-3xl">
    {children}
  </h2>
);

const H3: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h3 className="mt-5 font-serif text-xl font-semibold text-deepCharcoal">
    {children}
  </h3>
);

const P: React.FC<React.PropsWithChildren> = ({ children }) => (
  <p className="my-3 text-[color:var(--color-on-secondary)/0.9] leading-relaxed">
    {children}
  </p>
);

const Ul: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ul className="my-3 list-disc space-y-1 pl-6 text-[color:var(--color-on-secondary)/0.9]">
    {children}
  </ul>
);

const Ol: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ol className="my-3 list-decimal space-y-1 pl-6 text-[color:var(--color-on-secondary)/0.9]">
    {children}
  </ol>
);

const Li: React.FC<React.PropsWithChildren> = ({ children }) => (
  <li className="leading-relaxed">{children}</li>
);

const Strong: React.FC<React.PropsWithChildren> = ({ children }) => (
  <strong className="font-semibold text-deepCharcoal">{children}</strong>
);

const Em: React.FC<React.PropsWithChildren> = ({ children }) => (
  <em className="italic">{children}</em>
);

const Blockquote: React.FC<React.PropsWithChildren> = ({ children }) => (
  <blockquote className="my-4 border-l-4 border-softGold/70 bg-warmWhite/60 px-4 py-3 text-sm text-[color:var(--color-on-secondary)/0.9]">
    {children}
  </blockquote>
);

/* -------------------------------------------------------------------------- */
/* Links & images                                                              */
/* -------------------------------------------------------------------------- */

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string;
};

const A: React.FC<AnchorProps> = ({ href = "#", children, ...rest }) => {
  const isExternal = /^https?:\/\//i.test(href);
  if (isExternal) {
    return (
      <a
        href={href}
        {...rest}
        target="_blank"
        rel="noopener noreferrer"
        className="luxury-link"
      >
        {children}
      </a>
    );
  }

  // Internal route
  return (
    <Link href={href} {...rest} className="luxury-link">
      {children}
    </Link>
  );
};

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
};

// FIXED: Replaced img with Next.js Image component
const Img: React.FC<ImgProps> = ({
  src,
  alt = "",
  width = 800,
  height = 400,
  ...props
}) => (
  <div className="my-6 w-full rounded-xl border border-lightGrey bg-warmWhite overflow-hidden">
    {src ? (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`rounded-xl object-contain ${props.className || ""}`}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R"
      />
    ) : (
      <div className="flex h-48 items-center justify-center text-gray-500">
        Image not found
      </div>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Custom MDX components used in your content                                  */
/* -------------------------------------------------------------------------- */

type NoteProps = React.PropsWithChildren<{
  title?: string;
  tone?: "info" | "warning" | "success";
}>;

const Note: React.FC<NoteProps> = ({ title, tone = "info", children }) => {
  const toneClasses =
    tone === "warning"
      ? "border-amber-300 bg-amber-50/80"
      : tone === "success"
        ? "border-emerald-300 bg-emerald-50/80"
        : "border-sky-300 bg-sky-50/80";

  return (
    <aside
      className={`my-4 rounded-xl border px-4 py-3 text-sm text-gray-800 ${toneClasses}`}
    >
      {title && <p className="mb-1 font-semibold text-deepCharcoal">{title}</p>}
      <div>{children}</div>
    </aside>
  );
};

type QuoteProps = React.PropsWithChildren<{
  author?: string;
}>;

const Quote: React.FC<QuoteProps> = ({ children, author }) => (
  <figure className="my-6 border-l-2 border-softGold/80 pl-4 text-sm text-gray-800">
    <div className="italic">{children}</div>
    {author && (
      <figcaption className="mt-2 text-xs uppercase tracking-wide text-gray-500">
        - {author}
      </figcaption>
    )}
  </figure>
);

type VerseProps = React.PropsWithChildren<{
  refText?: string;
}>;

const Verse: React.FC<VerseProps> = ({ children, refText }) => (
  <div className="my-4 rounded-lg bg-warmWhite/80 px-4 py-3 text-sm text-gray-800">
    <p className="italic">{children}</p>
    {refText && (
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-softGold">
        {refText}
      </p>
    )}
  </div>
);

/**
 * Placeholder for any MDX <JsonLd> usage.
 * Safe no-op during render; you can wire actual JSON-LD later.
 */
type JsonLdProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

const JsonLd: React.FC<JsonLdProps> = () => null;

/**
 * Generic "share row" wrapper - keeps layout from breaking
 * even if MDX refers to <ShareRow>.
 */
const ShareRow: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-lightGrey pt-4 text-sm">
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Export mapping for next-mdx-remote                                         */
/* -------------------------------------------------------------------------- */

const mdxComponents = {
  // Typography
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: Ul,
  ol: Ol,
  li: Li,
  strong: Strong,
  em: Em,
  blockquote: Blockquote,

  // Horizontal rules & custom separator
  hr: () => <Rule />,
  Rule, // <Rule /> used directly in MDX

  // Links & images
  a: A,
  img: Img,

  // Custom helpers used in your posts
  Note,
  Quote,
  Verse,
  JsonLd,
  ShareRow,
};

export default mdxComponents;
