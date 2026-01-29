/* lib/mdx/simple-mdx-components.tsx */
import type { MDXComponents } from 'mdx/types';

export const simpleMdxComponents: MDXComponents = {
  // Basic HTML elements
  h1: ({ children, ...props }) => (
    <h1 className="text-3xl font-bold mb-6 text-white" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-bold mt-8 mb-4 text-white" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-bold mt-6 mb-3 text-white" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 text-gray-300 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-6 ml-6 list-disc space-y-2 text-gray-300" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-6 ml-6 list-decimal space-y-2 text-gray-300" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-white" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-gray-300" {...props}>
      {children}
    </em>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-gold pl-4 my-6 italic text-gray-400" {...props}>
      {children}
    </blockquote>
  ),
  hr: (props) => (
    <hr className="my-8 border-white/10" {...props} />
  ),
  // Add any other basic elements you need
  a: ({ children, href, ...props }) => (
    <a 
      href={href} 
      className="text-gold hover:text-amber-400 underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }) => (
    <img 
      src={src} 
      alt={alt} 
      className="rounded-lg my-6 max-w-full"
      {...props}
    />
  ),
  code: ({ children, ...props }) => (
    <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre className="bg-white/5 p-4 rounded-lg overflow-x-auto my-6" {...props}>
      {children}
    </pre>
  ),
};