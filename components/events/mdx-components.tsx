// components/events/mdx-components.tsx
"use client";

import React from "react";
import Link from "next/link";

// Ultra-simple MDX components - just what's needed to build
const components = {
  a: ({ href, children, ...props }: any) => {
    const isExternal = href?.startsWith('http');
    if (isExternal) {
      return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
    }
    return <Link href={href || '#'} {...props}>{children}</Link>;
  },
  
  img: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={src} 
      alt={alt || ''} 
      className="max-w-full h-auto rounded-lg my-4"
      {...props}
    />
  ),
  
  // Basic content elements
  h1: ({ children, ...props }: any) => <h1 className="text-3xl font-bold my-4" {...props}>{children}</h1>,
  h2: ({ children, ...props }: any) => <h2 className="text-2xl font-bold my-3" {...props}>{children}</h2>,
  h3: ({ children, ...props }: any) => <h3 className="text-xl font-bold my-2" {...props}>{children}</h3>,
  h4: ({ children, ...props }: any) => <h4 className="text-lg font-bold my-2" {...props}>{children}</h4>,
  h5: ({ children, ...props }: any) => <h5 className="text-base font-bold my-1" {...props}>{children}</h5>,
  h6: ({ children, ...props }: any) => <h6 className="text-sm font-bold my-1" {...props}>{children}</h6>,
  
  p: ({ children, ...props }: any) => <p className="my-2" {...props}>{children}</p>,
  strong: ({ children, ...props }: any) => <strong className="font-bold" {...props}>{children}</strong>,
  em: ({ children, ...props }: any) => <em className="italic" {...props}>{children}</em>,
  
  // Lists
  ul: ({ children, ...props }: any) => <ul className="list-disc list-inside my-2" {...props}>{children}</ul>,
  ol: ({ children, ...props }: any) => <ol className="list-decimal list-inside my-2" {...props}>{children}</ol>,
  li: ({ children, ...props }: any) => <li className="my-1" {...props}>{children}</li>,
  
  // Code blocks - simplified
  pre: ({ children, ...props }: any) => (
    <pre className="bg-gray-100 p-4 rounded overflow-x-auto my-4" {...props}>
      {children}
    </pre>
  ),
  
  code: ({ children, ...props }: any) => (
    <code className="bg-gray-100 px-1 rounded text-sm" {...props}>
      {children}
    </code>
  ),
  
  // Table - basic
  table: ({ children, ...props }: any) => (
    <table className="w-full border-collapse border border-gray-300 my-4" {...props}>
      {children}
    </table>
  ),
  
  // Blockquote
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props}>
      {children}
    </blockquote>
  ),
  
  // Horizontal rule
  hr: ({ ...props }: any) => <hr className="my-4 border-gray-300" {...props} />,
};

export default components;