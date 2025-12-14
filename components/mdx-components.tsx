// components/mdx-components.tsx
import * as React from "react";

// MDX components (per your folder screenshot)
import Badge from "@/components/mdx/Badge";
import BadgeRow from "@/components/mdx/BadgeRow";
import Callout from "@/components/mdx/Callout";
import Caption from "@/components/mdx/Caption";
import DownloadCard from "@/components/mdx/DownloadCard";
import HeroEyebrow from "@/components/mdx/HeroEyebrow";
import JsonLd from "@/components/mdx/JsonLd";
import Note from "@/components/mdx/Note";
import PullLine from "@/components/mdx/PullLine";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import Rule from "@/components/mdx/Rule";
import ShareRow from "@/components/mdx/ShareRow";
import Verse from "@/components/mdx/Verse";

// Print components (per your print folder screenshot)
import BrandFrame from "@/components/print/BrandFrame";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";

// Site-specific helpers
import GlossaryTerm from "@/components/GlossaryTerm";
import CanonReference from "@/components/CanonReference";

export type MdxComponentProps = React.PropsWithChildren<
  Omit<React.HTMLAttributes<HTMLElement>, "title"> & { className?: string }
>;

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
  <h4 className="mt-6 mb-3 text-base font-semibold text-gray-100" {...rest}>
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

const A = ({ children, ...rest }: MdxComponentProps) => (
  <a
    className="font-medium text-softGold underline-offset-2 hover:text-amber-200 hover:underline"
    {...rest}
  >
    {children}
  </a>
);

interface ImageProps extends MdxComponentProps {
  src?: string;
  alt?: string;
}
const MdxImage = ({ src, alt, className = "", ...rest }: ImageProps) => {
  if (!src) return null;
  return (
    <figure className="my-8 flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={String(src)}
        alt={alt ? String(alt) : ""}
        className={(
          "block h-auto w-auto max-w-full " +
          "max-h-[420px] sm:max-h-[460px] md:max-h-[500px] " +
          "rounded-2xl border border-slate-800/70 bg-slate-900/60 " +
          "object-contain shadow-soft-elevated " +
          className
        ).trim()}
        {...rest}
      />
    </figure>
  );
};

const components = {
  // HTML
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  strong: Strong,
  em: Em,
  ul: Ul,
  ol: Ol,
  li: Li,
  blockquote: Blockquote,
  code: Code,
  pre: Pre,
  a: A,
  img: MdxImage,

  // Your MDX blocks
  HeroEyebrow,
  Caption,
  Callout,
  Note,
  Rule,
  Divider: Rule,
  PullLine,
  Badge,
  BadgeRow,
  DownloadCard,
  ResourcesCTA,
  ShareRow,
  Verse,
  JsonLd,

  // Print blocks used inside MDX
  BrandFrame,
  EmbossedBrandMark,
  EmbossedSign,

  // Extra helpers
  GlossaryTerm,
  CanonReference,
};

export default components;
export { components as mdxComponents };