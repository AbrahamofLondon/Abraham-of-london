// components/MdxComponents.tsx
import * as React from "react";
import Link from "next/link";
import Image, { ImageProps } from "next/image";

// ------------------------------
// Utilities
// ------------------------------
const slugify = (str: string) =>
  (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const isExternal = (href: string) => /^https?:\/\//i.test(href) && !href.includes(process.env.NEXT_PUBLIC_SITE_URL ?? "");

// ------------------------------
// SmartLink
// ------------------------------
type AProps = React.ComponentPropsWithoutRef<"a"> & { href?: string };

function SmartLink({ href = "", children, ...props }: AProps) {
  if (!href) return <a {...props}>{children}</a>;

  // Mailto / Tel passthrough
  if (/^(mailto:|tel:)/.test(href)) return <a href={href} {...props}>{children}</a>;

  // External links: open in new tab with rel
  if (isExternal(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  // Internal links via Next.js
  return (
    <Link href={href} legacyBehavior>
      <a {...props}>{children}</a>
    </Link>
  );
}

// ------------------------------
// SmartImage
// ------------------------------
type SmartImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string;
  alt?: string;
};

function SmartImage({ src = "", alt = "", sizes = "100vw", ...rest }: SmartImageProps) {
  // If it’s a local/static asset or begins with "/", prefer next/image
  const isLocal = src.startsWith("/") || (!/^https?:\/\//i.test(src) && !!src);
  if (!src) return null;

  if (isLocal) {
    // Provide sane defaults; consumers can override via rest
    return (
      <Image
        src={src}
        alt={alt}
        width={(rest as any).width ?? 1600}
        height={(rest as any).height ?? 900}
        sizes={sizes}
        priority={Boolean((rest as any).priority)}
        style={{ height: "auto", width: "100%", ...(rest as any).style }}
        {...rest}
      />
    );
  }

  // Remote image fallback: use plain <img> for maximum safety without extra config
  // If you have remote patterns configured in next.config, you can also use <Image> here.
  // @ts-ignore allow decoding on <img>
  return <img src={src} alt={alt} decoding="async" loading="lazy" style={{ maxWidth: "100%", height: "auto" }} {...(rest as any)} />;
}

// ------------------------------
// CodeBlock with copy button
// ------------------------------
function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText());
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // no-op
        }
      }}
      className="absolute right-2 top-2 rounded-md border border-lightGrey px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
      aria-label="Copy code"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

type PreProps = React.ComponentPropsWithoutRef<"pre"> & { "data-language"?: string };
function Pre({ children, ...props }: PreProps) {
  // Extract raw code text for copy
  const codeRef = React.useRef<HTMLElement | null>(null);
  const getText = () => (codeRef.current?.textContent ?? "").trim();

  return (
    <div className="relative my-6 overflow-hidden rounded-lg border border-lightGrey">
      <CopyButton getText={getText} />
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed" {...props}>
        {React.Children.map(children as any, (child) => {
          if (React.isValidElement(child) && child.type === "code") {
            return React.cloneElement(child as any, { ref: codeRef });
          }
          return child;
        })}
      </pre>
    </div>
  );
}

// Keep <code> simple and let <pre> wrap and handle copy
function Code(props: React.ComponentPropsWithoutRef<"code">) {
  return <code {...props} />;
}

// ------------------------------
// Headings with anchors
// ------------------------------
type HeadingProps = React.ComponentPropsWithoutRef<"h1">;

const makeHeading =
  (Tag: "h1" | "h2" | "h3" | "h4") =>
  ({ children, id, ...props }: HeadingProps) => {
    const text = React.Children.toArray(children).join(" ");
    const anchor = id || slugify(String(text));
    return (
      <Tag id={anchor} {...props}>
        <a href={`#${anchor}`} className="no-underline hover:underline decoration-muted-gold/60">
          {children}
        </a>
      </Tag>
    );
  };

const H1 = makeHeading("h1");
const H2 = makeHeading("h2");
const H3 = makeHeading("h3");
const H4 = makeHeading("h4");

// ------------------------------
// Tables (responsive wrapper)
// ------------------------------
function TableWrapper(props: React.ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-lightGrey">
      <table className="w-full min-w-max text-left" {...props} />
    </div>
  );
}

// ------------------------------
// Blockquote (brand style)
// ------------------------------
function Blockquote(props: React.ComponentPropsWithoutRef<"blockquote">) {
  return (
    <blockquote
      className="my-6 border-l-4 pl-4 italic"
      style={{ borderLeftColor: "var(--color-accent)" }}
      {...props}
    />
  );
}

// ------------------------------
// Callout (custom MDX component)
// Usage: <Callout type="info" title="Heads up">...</Callout>
// ------------------------------
type CalloutProps = {
  type?: "info" | "success" | "warning" | "danger";
  title?: string;
  children?: React.ReactNode;
};

const tone = {
  info: { bg: "#EFF6FF", border: "#93C5FD", title: "#1E3A8A" },
  success: { bg: "#ECFDF5", border: "#6EE7B7", title: "#065F46" },
  warning: { bg: "#FFFBEB", border: "#FCD34D", title: "#92400E" },
  danger: { bg: "#FEF2F2", border: "#FCA5A5", title: "#991B1B" },
};

function Callout({ type = "info", title, children }: CalloutProps) {
  const c = tone[type] ?? tone.info;
  return (
    <div
      className="my-6 rounded-lg border p-4"
      style={{ background: c.bg, borderColor: c.border }}
      role="note"
    >
      {title && (
        <div className="mb-1 font-semibold" style={{ color: c.title }}>
          {title}
        </div>
      )}
      <div className="[&>p]:m-0 [&>p+*]:mt-3">{children}</div>
    </div>
  );
}

// ------------------------------
// YouTube (safe embed)
// Usage: <YouTube id="dQw4w9WgXcQ" title="..." />
// ------------------------------
function YouTube({ id, title }: { id: string; title?: string }) {
  if (!id) return null;
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
  return (
    <div className="my-6 aspect-video w-full overflow-hidden rounded-lg border border-lightGrey">
      <iframe
        src={src}
        title={title ?? "YouTube video"}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        loading="lazy"
        className="h-full w-full"
      />
    </div>
  );
}

// ------------------------------
// MDX Components Map
// ------------------------------
export const mdxComponents = {
  // HTML element overrides
  a: SmartLink,
  img: SmartImage,
  pre: Pre,
  code: Code,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  table: TableWrapper,
  blockquote: Blockquote,

  // Custom shortcodes
  Callout,
  YouTube,

  // Optional helpers for figures
  Figure: ({ children, ...p }: React.ComponentPropsWithoutRef<"figure">) => (
    <figure className="my-6" {...p}>{children}</figure>
  ),
  Figcaption: ({ children, ...p }: React.ComponentPropsWithoutRef<"figcaption">) => (
    <figcaption className="mt-2 text-sm text-gray-600" {...p}>{children}</figcaption>
  ),
};

export type MdxComponents = typeof mdxComponents;

// ------------------------------
// Usage examples:
//
// With next-mdx-remote:
//   <MDXRemote {...source} components={mdxComponents} />
//
// With Contentlayer (pages directory):
//   import { useMDXComponent } from "next-contentlayer2/hooks";
//   const MDX = useMDXComponent(code);
//   return <MDX components={mdxComponents} />;
//
// Safety notes:
// - External links open in new tab with rel=noopener.
// - Remote <img> falls back to <img> (no Next/Image config needed).
// - Code blocks have a copy button; no extra syntax highlighter dep required.
// - Headings get stable, slugified anchors.
// - All components are SSR-friendly (no window/document access during render).
// ------------------------------

