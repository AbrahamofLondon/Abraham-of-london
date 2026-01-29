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
  
  // ADD THESE COMMON COMPONENTS TO PREVENT BUILD ERRORS
  HeroEyebrow: ({ children, ...props }) => (
    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2" {...props}>
      {children}
    </div>
  ),
  
  BrandFrame: ({ children, ...props }) => (
    <div className="my-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6" {...props}>
      {children}
    </div>
  ),
  
  Caption: ({ children, ...props }) => (
    <p className="text-sm text-gray-500 mt-2 text-center" {...props}>
      {children}
    </p>
  ),
  
  Callout: ({ children, type = "info", ...props }) => {
    const styles = {
      info: "border-blue-500/20 bg-blue-500/10 text-blue-200",
      warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
      success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      error: "border-red-500/20 bg-red-500/10 text-red-200",
    };
    
    return (
      <div className={`my-6 rounded-lg border p-4 ${styles[type as keyof typeof styles] || styles.info}`} {...props}>
        {children}
      </div>
    );
  },
  
  Quote: ({ children, author, ...props }) => (
    <div className="my-8 border-l-4 border-gold pl-6 py-2" {...props}>
      <blockquote className="text-xl italic text-gray-300 leading-relaxed">
        "{children}"
      </blockquote>
      {author && (
        <p className="mt-4 text-sm text-gray-500">— {author}</p>
      )}
    </div>
  ),
  
  Divider: (props) => (
    <hr className="my-8 border-white/10" {...props} />
  ),
  
  Note: ({ children, ...props }) => (
    <div className="my-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-blue-200" {...props}>
      {children}
    </div>
  ),
};

// Also export a utility function to create safe components
export function createSafeMdxComponents(
  baseComponents: MDXComponents = {}, 
  options: { warnOnFallback?: boolean } = {}
): MDXComponents {
  const { warnOnFallback = false } = options;
  
  // Merge base components with simple components (simple components take precedence for common ones)
  const mergedComponents: MDXComponents = {
    ...simpleMdxComponents,
    ...baseComponents,
  };
  
  // Create a proxy to handle missing components
  return new Proxy(mergedComponents, {
    get(target, prop: string) {
      if (typeof prop === 'symbol') {
        return (target as any)[prop];
      }
      
      const component = target[prop];
      if (component) {
        return component;
      }
      
      // Create fallback component
      const FallbackComponent: React.FC<any> = (props) => {
        if (warnOnFallback && process.env.NODE_ENV !== 'production') {
          console.warn(`[MDX Safe] Missing component "${prop}". Rendering fallback.`);
        }
        
        const { children, className, ...rest } = props || {};
        return (
          <div
            {...rest}
            data-missing-component={prop}
            className={`my-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-100 ${className || ''}`}
          >
            {children || <span className="opacity-80">[{prop}]</span>}
          </div>
        );
      };
      
      FallbackComponent.displayName = `Fallback(${prop})`;
      return FallbackComponent;
    }
  });
}

// React hook version
import * as React from 'react';

export function useSafeMdxComponents(
  baseComponents: MDXComponents = {}, 
  options: { warnOnFallback?: boolean } = {}
): MDXComponents {
  const { warnOnFallback = false } = options;
  
  return React.useMemo(() => {
    return createSafeMdxComponents(baseComponents, { warnOnFallback });
  }, [baseComponents, warnOnFallback]);
}

export default simpleMdxComponents;