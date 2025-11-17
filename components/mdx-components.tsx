// components/mdx-components.tsx

import * as React from "react";
import type { ComponentProps, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

// Basic typography helpers ---------------------------------------------------

type AnyProps = { children?: ReactNode } & React.HTMLAttributes<HTMLElement>;

const Paragraph = (props: AnyProps) => (
  <p
    {...props}
    className={
      "my-4 text-[0.95rem] leading-relaxed text-gray-800 dark:text-gray-100 " +
      (props.className ?? "")
    }
  />
);

const Heading = (
  Tag: "h1" | "h2" | "h3" | "h4",
  base: string,
): React.FC<AnyProps> => {
  return (props: AnyProps) => (
    <Tag
      {...props}
      className={
        base +
        " text-deepCharcoal dark:text-gray-50 tracking-tight " +
        (props.className ?? "")
      }
    />
  );
};

const H1 = Heading(
  "h1",
  "mt-8 mb-4 font-serif text-3xl sm:text-4xl font-semibold",
);
const H2 = Heading(
  "h2",
  "mt-8 mb-3 font-serif text-2xl sm:text-3xl font-semibold",
);
const H3 = Heading(
  "h3",
  "mt-6 mb-2 font-serif text-xl sm:text-2xl font-semibold",
);
const H4 = Heading("h4", "mt-5 mb-2 font-serif text-lg font-semibold");

const Blockquote = (props: AnyProps) => (
  <blockquote
    {...props}
    className={
      "my-6 border-l-4 border-softGold/80 bg-softGold/5 px-4 py-3 text-[0.95rem] italic text-gray-800 dark:text-gray-100 " +
      (props.className ?? "")
    }
  />
);

const Anchor = (
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string },
) => {
  const href = props.href ?? "#";

  // External vs internal links
  const isExternal = href.startsWith("http");

  const className =
    "font-medium text-forest underline-offset-2 hover:underline";

  if (isExternal) {
    return (
      <a
        {...props}
        href={href}
        target={props.target ?? "_blank"}
        rel={props.rel ?? "noopener noreferrer"}
        className={className + " " + (props.className ?? "")}
      />
    );
  }

  return (
    <Link href={href} className={className + " " + (props.className ?? "")}>
      {props.children}
    </Link>
  );
};

// MDX Image wrapper ----------------------------------------------------------

type MdxImageProps = Omit<
  ComponentProps<typeof Image>,
  "src" | "alt" | "width" | "height"
> & {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
};

const MdxImage: React.FC<MdxImageProps> = (props) => {
  const { src, alt = "", width, height, className = "", ...rest } = props;

  const numericWidth: number =
    typeof width === "string"
      ? Number.parseInt(width, 10) || 1200
      : typeof width === "number"
      ? width
      : 1200;

  const numericHeight: number =
    typeof height === "string"
      ? Number.parseInt(height, 10) || 675
      : typeof height === "number"
      ? height
      : 675;

  return (
    <div className="my-6 overflow-hidden rounded-xl">
      <Image
        src={src}
        alt={alt}
        width={numericWidth}
        height={numericHeight}
        className={`h-auto w-full object-cover ${className}`.trim()}
        {...rest}
      />
    </div>
  );
};

// Custom components used inside MDX ------------------------------------------

// Pull-out line / emphasis line
const PullLine: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <p className="my-6 border-l-4 border-softGold/80 bg-softGold/5 px-4 py-3 text-base italic text-gray-900 dark:text-gray-50">
    {children}
  </p>
);

// Simple responsive grid wrapper used in some downloads MDX
const Grid: React.FC<{ children?: ReactNode; cols?: number }> = ({
  children,
  cols = 2,
}) => {
  const base = "my-6 grid gap-6";
  const colsClass =
    cols === 4
      ? "md:grid-cols-4"
      : cols === 3
      ? "md:grid-cols-3"
      : "md:grid-cols-2";
  return <div className={`${base} ${colsClass}`}>{children}</div>;
};

// Embossed brand mark used in covers / footers
const EmbossedBrandMark: React.FC<{ children?: ReactNode }> = ({
  children,
}) => (
  <p className="mt-6 select-none text-right text-[10px] font-light tracking-[0.35em] text-gray-400">
    {(children as ReactNode) ?? "ABRAHAMOFLONDON"}
  </p>
);

// Code / pre wrappers
const Code = (props: AnyProps) => (
  <code
    {...props}
    className={
      "rounded bg-black/5 px-1.5 py-0.5 text-[0.85em] font-mono text-rose-700 dark:bg-black/40 dark:text-rose-200 " +
      (props.className ?? "")
    }
  />
);

const Pre = (props: AnyProps) => (
  <pre
    {...props}
    className={
      "my-4 overflow-x-auto rounded-lg bg-[#0b1020] p-4 text-[0.8rem] text-gray-100 " +
      (props.className ?? "")
    }
  />
);

// Exported MDX components map ------------------------------------------------

export const mdxComponents = {
  // block structure
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: Paragraph,
  blockquote: Blockquote,
  a: Anchor,
  ul: (props: AnyProps) => (
    <ul
      {...props}
      className={
        "my-4 ml-5 list-disc text-[0.95rem] text-gray-800 dark:text-gray-100 " +
        (props.className ?? "")
      }
    />
  ),
  ol: (props: AnyProps) => (
    <ol
      {...props}
      className={
        "my-4 ml-5 list-decimal text-[0.95rem] text-gray-800 dark:text-gray-100 " +
        (props.className ?? "")
      }
    />
  ),
  li: (props: AnyProps) => (
    <li
      {...props}
      className={
        "my-1 text-[0.95rem] leading-relaxed text-gray-800 dark:text-gray-100 " +
        (props.className ?? "")
      }
    />
  ),
  hr: (props: AnyProps) => (
    <hr
      {...props}
      className={
        "my-8 border-t border-gray-200/80 dark:border-gray-700/80 " +
        (props.className ?? "")
      }
    />
  ),

  // inline & code
  code: Code,
  pre: Pre,
  strong: (props: AnyProps) => (
    <strong
      {...props}
      className={
        "font-semibold text-deepCharcoal dark:text-gray-50 " +
        (props.className ?? "")
      }
    />
  ),
  em: (props: AnyProps) => (
    <em
      {...props}
      className={
        "italic text-deepCharcoal/90 dark:text-gray-50/90 " +
        (props.className ?? "")
      }
    />
  ),

  // images
  img: MdxImage,

  // Custom MDX-only components that were causing runtime errors
  PullLine,
  Grid,
  EmbossedBrandMark,
};