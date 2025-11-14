// components/events/mdx-components.tsx
"use client";

import type { ComponentProps, ReactNode } from "react";
import React from "react";
import Link from "next/link";

type AnyProps = { children?: ReactNode; [key: string]: any };

// Ultra-simple MDX components - just what's needed to build
const components = {
  a: ({ href, children, ...props }: AnyProps) => {
    const isExternal = typeof href === "string" && href.startsWith("http");
    if (isExternal) {
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
    return (
      <Link href={href || "#"} {...props}>
        {children}
      </Link>
    );
  },

  img: ({ src, alt, ...props }: AnyProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || ""}
      className="my-4 h-auto max-w-full rounded-lg"
      {...props}
    />
  ),

  h1: ({ children, ...props }: ComponentProps<"h1">) => (
    <h1 className="my-4 text-3xl font-bold" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: ComponentProps<"h2">) => (
    <h2 className="my-3 text-2xl font-bold" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentProps<"h3">) => (
    <h3 className="my-2 text-xl font-bold" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: ComponentProps<"h4">) => (
    <h4 className="my-2 text-lg font-bold" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: ComponentProps<"h5">) => (
    <h5 className="my-1 text-base font-bold" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: ComponentProps<"h6">) => (
    <h6 className="my-1 text-sm font-bold" {...props}>
      {children}
    </h6>
  ),

  p: ({ children, ...props }: ComponentProps<"p">) => (
    <p className="my-2" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: ComponentProps<"strong">) => (
    <strong className="font-bold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: ComponentProps<"em">) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  ul: ({ children, ...props }: ComponentProps<"ul">) => (
    <ul className="my-2 list-inside list-disc" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentProps<"ol">) => (
    <ol className="my-2 list-inside list-decimal" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentProps<"li">) => (
    <li className="my-1" {...props}>
      {children}
    </li>
  ),

  pre: ({ children, ...props }: ComponentProps<"pre">) => (
    <pre
      className="my-4 overflow-x-auto rounded bg-gray-100 p-4"
      {...props}
    >
      {children}
    </pre>
  ),

  code: ({ children, ...props }: ComponentProps<"code">) => (
    <code className="rounded bg-gray-100 px-1 text-sm" {...props}>
      {children}
    </code>
  ),

  table: ({ children, ...props }: ComponentProps<"table">) => (
    <table
      className="my-4 w-full border-collapse border border-gray-300"
      {...props}
    >
      {children}
    </table>
  ),

  blockquote: ({ children, ...props }: ComponentProps<"blockquote">) => (
    <blockquote
      className="my-4 border-l-4 border-gray-300 pl-4 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),

  hr: (props: ComponentProps<"hr">) => (
    <hr className="my-4 border-gray-300" {...props} />
  ),
};

export default components;