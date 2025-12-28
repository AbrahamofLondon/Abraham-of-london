/* components/mdx-components.tsx */
import * as React from "react";
import * as Lucide from "lucide-react";

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

type AnyProps = Record<string, unknown>;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function UnknownMdxComponent(props: AnyProps) {
  const { children } = props as { children?: React.ReactNode };
  return <>{children}</>;
}

function Anchor(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { className, ...rest } = props;
  return (
    <a
      {...rest}
      className={cx(
        "text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold",
        className
      )}
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

/**
 * Placeholder DownloadCard component.
 * Replace this with your actual implementation when ready.
 */
function DownloadCard(props: {
  slug?: string;
  title?: string;
  description?: string;
  fileSize?: string;
  [key: string]: any;
}) {
  const { slug, title, description, fileSize, ...rest } = props;
  
  return (
    <div
      className="my-6 rounded-2xl border border-gold/20 bg-charcoal/80 p-6"
      {...rest}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/20">
          <Lucide.Download className="h-6 w-6 text-gold" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-cream">
            {title || "Download"}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gold/70">{description}</p>
          )}
          {fileSize && (
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-gold/50">
              {fileSize}
            </p>
          )}
          {slug && (
            <a
              href={`/downloads/${slug}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-amber-200"
            >
              Download
              <Lucide.ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const baseComponents = {
  // Headings
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      {...props}
      className={cx("mt-16 mb-8 font-serif text-4xl font-semibold text-cream", props.className)}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      {...props}
      className={cx("mt-14 mb-5 font-serif text-2xl font-semibold text-cream", props.className)}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      {...props}
      className={cx("mt-10 mb-4 font-serif text-xl font-semibold text-cream", props.className)}
    />
  ),

  // Paragraph / text
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className={cx("my-6 text-lg leading-relaxed text-gray-300", props.className)} />
  ),

  // Lists
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      {...props}
      className={cx("my-6 list-disc space-y-2 pl-6 text-gray-300", props.className)}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      {...props}
      className={cx("my-6 list-decimal space-y-2 pl-6 text-gray-300", props.className)}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...props} className={cx("leading-relaxed", props.className)} />
  ),

  // Links
  a: Anchor,

  // Code
  code: InlineCode,
  pre: Pre,

  // Images
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      className={cx("my-8 w-full rounded-2xl border border-white/10", props.className)}
      alt={props.alt ?? ""}
      loading={props.loading ?? "lazy"}
    />
  ),

  // Custom components
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
  DownloadCard,

  /**
   * Icon usage in MDX:
   * <Icon name="Shield" size={18} className="..." />
   */
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
} satisfies Record<string, unknown>;

/**
 * Resilient proxy for MDX components
 */
export const mdxComponents = new Proxy(baseComponents as Record<string, any>, {
  get(target, prop: string | symbol) {
    if (typeof prop !== "string") return (target as any)[prop];

    // Exact match first
    if ((target as any)[prop]) return (target as any)[prop];

    // Case-insensitive match
    const foundKey = Object.keys(target).find((k) => k.toLowerCase() === prop.toLowerCase());
    if (foundKey) return (target as any)[foundKey];

    return UnknownMdxComponent;
  },
});

export default mdxComponents;