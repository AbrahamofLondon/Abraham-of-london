// components/mdx/MinimalMdxComponents.tsx - PRODUCTION SAFE
import React from 'react';

// Type-safe component props with children
type MDXComponentProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
};

const safeClassName = (base: string, user?: string) => 
  user ? `${base} ${user}`.trim() : base;

export const MinimalMdxComponents = {
  // ========== BASIC HTML ELEMENTS ==========
  h1: ({ children, className, ...props }: MDXComponentProps) => (
    <h1 
      className={safeClassName("text-4xl font-bold my-4", className)} 
      {...props}
    >
      {children || null}
    </h1>
  ),
  
  h2: ({ children, className, ...props }: MDXComponentProps) => (
    <h2 
      className={safeClassName("text-3xl font-bold my-3", className)} 
      {...props}
    >
      {children || null}
    </h2>
  ),
  
  h3: ({ children, className, ...props }: MDXComponentProps) => (
    <h3 
      className={safeClassName("text-2xl font-bold my-2", className)} 
      {...props}
    >
      {children || null}
    </h3>
  ),
  
  h4: ({ children, className, ...props }: MDXComponentProps) => (
    <h4 
      className={safeClassName("text-xl font-bold my-2", className)} 
      {...props}
    >
      {children || null}
    </h4>
  ),
  
  p: ({ children, className, ...props }: MDXComponentProps) => (
    <p 
      className={safeClassName("my-3 leading-relaxed", className)} 
      {...props}
    >
      {children || null}
    </p>
  ),
  
  a: ({ children, className, href, ...props }: MDXComponentProps & { href?: string }) => {
    // SAFE: Add rel="noopener noreferrer" for external links
    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
    const rel = isExternal ? 'noopener noreferrer' : undefined;
    const target = isExternal ? '_blank' : undefined;
    
    return (
      <a 
        href={href}
        rel={rel}
        target={target}
        className={safeClassName("text-amber-500 hover:text-amber-400 underline", className)} 
        {...props}
      >
        {children || null}
      </a>
    );
  },
  
  ul: ({ children, className, ...props }: MDXComponentProps) => (
    <ul 
      className={safeClassName("list-disc pl-6 my-3", className)} 
      {...props}
    >
      {children || null}
    </ul>
  ),
  
  ol: ({ children, className, ...props }: MDXComponentProps) => (
    <ol 
      className={safeClassName("list-decimal pl-6 my-3", className)} 
      {...props}
    >
      {children || null}
    </ol>
  ),
  
  li: ({ children, className, ...props }: MDXComponentProps) => (
    <li 
      className={safeClassName("my-1", className)} 
      {...props}
    >
      {children || null}
    </li>
  ),
  
  blockquote: ({ children, className, ...props }: MDXComponentProps) => (
    <blockquote 
      className={safeClassName("border-l-4 border-amber-500 pl-4 italic my-4", className)} 
      {...props}
    >
      {children || null}
    </blockquote>
  ),
  
  code: ({ children, className, ...props }: MDXComponentProps) => (
    <code 
      className={safeClassName("bg-gray-800 rounded px-1 py-0.5 font-mono text-sm", className)} 
      {...props}
    >
      {children || null}
    </code>
  ),
  
  pre: ({ children, className, ...props }: MDXComponentProps) => (
    <pre 
      className={safeClassName("bg-gray-900 rounded p-4 overflow-x-auto my-4", className)} 
      {...props}
    >
      {children || null}
    </pre>
  ),
  
  img: ({ src, alt = "", className, ...props }: MDXComponentProps & { src?: string; alt?: string }) => (
    <img 
      src={src}
      alt={alt}
      className={safeClassName("rounded my-4 max-w-full", className)}
      loading="lazy"
      {...props}
    />
  ),
  
  hr: ({ className, ...props }: MDXComponentProps) => (
    <hr 
      className={safeClassName("my-6 border-gray-700", className)} 
      {...props}
    />
  ),
  
  table: ({ children, className, ...props }: MDXComponentProps) => (
    <table 
      className={safeClassName("min-w-full divide-y divide-gray-700 my-4", className)} 
      {...props}
    >
      {children || null}
    </table>
  ),
  
  thead: ({ children, className, ...props }: MDXComponentProps) => (
    <thead 
      className={safeClassName("bg-gray-800", className)} 
      {...props}
    >
      {children || null}
    </thead>
  ),
  
  tbody: ({ children, className, ...props }: MDXComponentProps) => (
    <tbody 
      className={safeClassName("divide-y divide-gray-700", className)} 
      {...props}
    >
      {children || null}
    </tbody>
  ),
  
  tr: ({ children, ...props }: MDXComponentProps) => (
    <tr {...props}>
      {children || null}
    </tr>
  ),
  
  th: ({ children, className, ...props }: MDXComponentProps) => (
    <th 
      className={safeClassName("px-3 py-2 text-left font-semibold", className)} 
      {...props}
    >
      {children || null}
    </th>
  ),
  
  td: ({ children, className, ...props }: MDXComponentProps) => (
    <td 
      className={safeClassName("px-3 py-2", className)} 
      {...props}
    >
      {children || null}
    </td>
  ),
  
  // ========== CUSTOM COMPONENTS ==========
  Badge: ({ children, className, ...props }: MDXComponentProps) => (
    <span 
      className={safeClassName("inline-block bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-sm", className)} 
      {...props}
    >
      {children || null}
    </span>
  ),
  
  Callout: ({ children, className, ...props }: MDXComponentProps) => (
    <div 
      className={safeClassName("bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-4 my-4", className)} 
      {...props}
    >
      {children || null}
    </div>
  ),
  
  Note: ({ children, className, ...props }: MDXComponentProps) => (
    <div 
      className={safeClassName("bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 my-4", className)} 
      {...props}
    >
      {children || null}
    </div>
  ),
  
  Quote: ({ children, className, ...props }: MDXComponentProps) => (
    <blockquote 
      className={safeClassName("border-l-4 border-amber-500 pl-6 italic text-xl my-8", className)} 
      {...props}
    >
      {children || null}
    </blockquote>
  ),
  
  Grid: ({ children, className, ...props }: MDXComponentProps) => (
    <div 
      className={safeClassName("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4", className)} 
      {...props}
    >
      {children || null}
    </div>
  ),
  
  Container: ({ children, className, ...props }: MDXComponentProps) => (
    <div 
      className={safeClassName("max-w-7xl mx-auto px-4", className)} 
      {...props}
    >
      {children || null}
    </div>
  ),
} as const; // 'as const' for better TypeScript inference

export default MinimalMdxComponents;