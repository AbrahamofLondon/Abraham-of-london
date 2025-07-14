// components/MDXComponents.tsx

import * as React from 'react';
import { MDXProvider } from '@mdx-js/react';

// Define types for common HTML element props to avoid 'implicit any' errors
type HTMLProps = React.HTMLAttributes<HTMLElement>;
type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;
type ParagraphProps = React.HTMLAttributes<HTMLParagraphElement>;
type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>;

const components = {
  h1: (props: HeadingProps) => <h1 className="text-3xl font-bold mt-4 mb-2" {...props} />,
  p: (props: ParagraphProps) => <p className="leading-relaxed my-4" {...props} />,
  a: (props: AnchorProps) => <a className="text-blue-600 underline" {...props} />,
  // Add more components here as needed, following the same pattern for typing props
  // Example: strong: (props: HTMLProps) => <strong {...props} />,
  // Example: ul: (props: HTMLProps) => <ul className="list-disc pl-5" {...props} />,
  // Example: li: (props: HTMLProps) => <li className="mb-2" {...props} />,
};

interface Props {
  children: React.ReactNode;
}

export default function MDXComponents({ children }: Props) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
// Remove any extra closing curly brace '}' here if present in your file.
// There should NOT be an extra '}' after the closing brace of the default export function.