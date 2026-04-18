/* components/mdx/MDXComponents.tsx — ULTRA HARDENED */
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { getComponentSync } from "./registry";

/* -------------------------------------------------------------------------- */
/* SAFETY FALLBACKS */
/* -------------------------------------------------------------------------- */

const MissingComponent = ({ name }: { name: string }) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[MDX] Component not found in base map: "${name}"`);
  }

  // Never return null — silent content loss breaks editorial trust.
  // In production: render an unobtrusive but visible placeholder.
  // In dev: render with the component name for debugging.
  return (
    <div
      className="my-4 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-4 font-mono text-[10px] uppercase tracking-wider text-amber-500/60"
      data-mdx-missing={name}
    >
      {process.env.NODE_ENV === "production"
        ? "Content element unavailable."
        : `Component not found: ${name}`}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* HEADING PROTOCOL */
/* -------------------------------------------------------------------------- */

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  id?: string;
  children?: React.ReactNode;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (React.isValidElement(node)) return extractText((node.props as { children?: React.ReactNode }).children);
  return "";
}

const createHeading = (
  level: 1 | 2 | 3 | 4 | 5 | 6,
  baseClass: string,
) => {
  const tag = `h${level}` as keyof JSX.IntrinsicElements;

  const Heading: React.FC<HeadingProps> = ({
    id,
    className,
    children,
    ...props
  }) => {
    const text = extractText(children);
    const safeId = id || (text ? slugify(text) : undefined);

    return React.createElement(
      tag,
      {
        ...props,
        id: safeId,
        className: `${baseClass} ${className || ""}`.trim(),
      },
      children,
    );
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
};

/* -------------------------------------------------------------------------- */
/* BASE COMPONENTS MAP */
/* -------------------------------------------------------------------------- */

export const baseComponents: Record<string, React.ComponentType<any>> = {
  a: ({
    href,
    className,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const value = String(href || "");
    const isInternal = value.startsWith("/") || value.startsWith("#");

    const baseClass =
      "text-amber-500 underline underline-offset-4 decoration-amber-500/30 hover:text-white hover:decoration-amber-500/60 transition-all";

    if (isInternal) {
      return (
        <Link href={value || "#"} className={`${baseClass} ${className || ""}`} {...(props as any)}>
          {children}
        </Link>
      );
    }

    return (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={value || "#"}
        className={`${baseClass} border-b border-amber-500/20 no-underline ${className || ""}`}
        {...props}
      >
        {children}
      </a>
    );
  },

  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr {...props} className={`my-16 opacity-20 ${props.className || ""}`} />
  ),

  h1: createHeading(
    1,
    "mb-12 font-serif text-4xl italic leading-tight tracking-tight text-white md:text-6xl",
  ),
  h2: createHeading(
    2,
    "mt-20 mb-8 border-b border-white/5 pb-4 font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500 scroll-mt-32",
  ),
  h3: createHeading(
    3,
    "mt-12 mb-4 font-serif text-2xl italic text-zinc-200 scroll-mt-32",
  ),
  h4: createHeading(
    4,
    "mt-10 mb-3 font-serif text-xl italic text-zinc-300 scroll-mt-32",
  ),
  h5: createHeading(
    5,
    "mt-8 mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-amber-200/80 scroll-mt-32",
  ),
  h6: createHeading(
    6,
    "mt-6 mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 scroll-mt-32",
  ),

  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      {...props}
      className={`mb-8 font-sans text-lg font-light leading-relaxed text-zinc-400 ${props.className || ""}`}
    />
  ),

  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong
      {...props}
      className={`font-bold text-amber-500/90 ${props.className || ""}`}
    />
  ),

  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className={`mb-8 list-none space-y-4 ${props.className || ""}`} />
  ),

  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol
      {...props}
      className={`mb-8 ml-6 list-decimal space-y-3 font-sans text-base leading-relaxed text-zinc-300 ${props.className || ""}`}
    />
  ),

  li: ({
    className,
    children,
    ...props
  }: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li
      {...props}
      className={`font-sans text-base text-zinc-400 ${className || ""}`}
    >
      {children}
    </li>
  ),

  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLElement>) => (
    <blockquote
      {...props}
      className={`my-10 border-l-2 border-amber-500/40 pl-6 font-serif text-xl italic leading-relaxed text-zinc-200 ${props.className || ""}`}
    />
  ),

  code: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = String(className || "").includes("language-");

    if (isBlock) {
      return (
        <code
          {...props}
          className={`block overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-5 font-mono text-sm text-zinc-200 ${className || ""}`}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        {...props}
        className={`rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.9em] text-amber-200 ${className || ""}`}
      >
        {children}
      </code>
    );
  },

  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      {...props}
      className={`my-8 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-5 ${props.className || ""}`}
    />
  ),

  table: ({
    className,
    ...props
  }: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div
      className={`my-10 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 ${className || ""}`}
    >
      <table
        {...props}
        className="min-w-full border-collapse text-left text-sm text-zinc-200"
      />
    </div>
  ),

  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead {...props} className={`bg-white/[0.03] ${props.className || ""}`} />
  ),

  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody
      {...props}
      className={`divide-y divide-white/10 ${props.className || ""}`}
    />
  ),

  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr {...props} className={`border-b border-white/10 ${props.className || ""}`} />
  ),

  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      {...props}
      className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/80 ${props.className || ""}`}
    />
  ),

  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      {...props}
      className={`px-4 py-3 align-top font-sans text-sm leading-relaxed text-zinc-300 ${props.className || ""}`}
    />
  ),

  Image,
  JsonLd: getComponentSync("JsonLd") || (() => null),
};

/* -------------------------------------------------------------------------- */
/* DYNAMIC REGISTRY HYDRATION */
/* -------------------------------------------------------------------------- */

const registryComponents = [
  "Badge",
  "BadgeRow",
  "BrandFrame",
  "BriefAlert",
  "BriefSummaryCard",
  "Callout",
  "Caption",
  "CTA",
  "CTAPreset",
  "CtaPresetComponent",
  "Divider",
  "DownloadCard",
  "EmbossedBrandMark",
  "Grid",
  "HeroEyebrow",
  "LexiconLink",
  "Note",
  "ProcessSteps",
  "PullLine",
  "Quote",
  "ResourcesCTA",
  "Responsibility",
  "ResponsibilityGrid",
  "Rule",
  "ShareRow",
  "Step",
  "Verse",
];

registryComponents.forEach((name) => {
  if (!baseComponents[name]) {
    const Component = getComponentSync(name);
    baseComponents[name] = Component || (() => <MissingComponent name={name} />);
  }
});

export const mdxComponents = baseComponents;

export function getSafeComponents(
  customComponents?: Record<string, React.ComponentType<any>>,
): Record<string, React.ComponentType<any>> {
  return {
    ...mdxComponents,
    ...(customComponents || {}),
  };
}