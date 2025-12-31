// src/components/mdx-components.tsx
import React from "react";

export const mdxComponents = {
  h1: (props: any) => (
    <h1 className="mt-6 mb-4 text-3xl font-bold" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="mt-5 mb-3 text-2xl font-bold" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="mt-4 mb-2 text-xl font-bold" {...props} />
  ),
  p: (props: any) => <p className="mb-4 leading-relaxed" {...props} />,
  a: (props: any) => (
    <a
      className="text-blue-600 underline hover:text-blue-800"
      {...props}
    />
  ),
  ul: (props: any) => (
    <ul className="mb-4 list-inside list-disc" {...props} />
  ),
  ol: (props: any) => (
    <ol className="mb-4 list-inside list-decimal" {...props} />
  ),
  li: (props: any) => <li className="mb-1" {...props} />,
  blockquote: (props: any) => (
    <blockquote
      className="my-4 border-l-4 border-gray-300 pl-4 italic"
      {...props}
    />
  ),
  code: (props: any) => (
    <code
      className="rounded bg-gray-100 px-1 py-0.5 text-sm"
      {...props}
    />
  ),
  pre: (props: any) => (
    <pre
      className="my-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-gray-100"
      {...props}
    />
  ),
};

export default mdxComponents;
