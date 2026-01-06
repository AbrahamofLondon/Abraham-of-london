/* lib/server/md-utils.tsx - PRODUCTION SAFE UPGRADE */
import React from 'react';
import { serialize } from 'next-mdx-remote/serialize';
import type { SerializeOptions } from 'next-mdx-remote';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import dynamic from 'next/dynamic';

// SAFE: Environment detection
const isProduction = (): boolean => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'production';
};

const isDevelopment = (): boolean => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'development';
};

/**
 * SAFE COMPONENT LOADER - Production resilient dynamic imports
 */
const createSafeDynamicImport = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ComponentType<any> = () => null
) => {
  return dynamic(
    () => importFn().catch(() => ({ default: fallback })),
    { 
      ssr: true, // Keep SSR for performance
      loading: () => <div data-placeholder /> // Minimal placeholder
    }
  );
};

/**
 * MASTER MDX REGISTRY WITH PRODUCTION SAFETY
 * Dynamically imports components with comprehensive fallbacks
 */
export const mdxComponents = {
  // Core MDX Components with safe imports
  Badge: createSafeDynamicImport(() => import('@/components/mdx/Badge'), 
    (props: any) => <span className="inline-block bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-sm" {...props} />
  ),
  BrandFrame: createSafeDynamicImport(() => import('@/components/mdx/BrandFrame'),
    (props: any) => <div className="border border-gray-700 rounded-lg p-4" {...props} />
  ),
  Callout: createSafeDynamicImport(() => import('@/components/mdx/Callout'),
    (props: any) => (
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-4 my-4" {...props} />
    )
  ),
  HeroEyebrow: createSafeDynamicImport(() => import('@/components/mdx/HeroEyebrow'),
    (props: any) => <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold" {...props} />
  ),
  Note: createSafeDynamicImport(() => import('@/components/mdx/Note'),
    (props: any) => (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 my-4" {...props} />
    )
  ),
  PullLine: createSafeDynamicImport(() => import('@/components/mdx/PullLine'),
    (props: any) => (
      <div className="text-2xl font-serif italic text-amber-300 border-l-4 border-amber-500 pl-6 my-8" {...props} />
    )
  ),
  Quote: createSafeDynamicImport(() => import('@/components/mdx/Quote'),
    (props: any) => (
      <blockquote className="border-l-4 border-amber-500 pl-6 italic text-xl my-8" {...props} />
    )
  ),
  ResourcesCTA: createSafeDynamicImport(() => import('@/components/mdx/ResourcesCTA'),
    (props: any) => <div className="bg-charcoal rounded-xl p-6 my-6" {...props} />
  ),
  Rule: createSafeDynamicImport(() => import('@/components/mdx/Rule'),
    (props: any) => <hr className="my-8 border-gray-700" {...props} />
  ),
  Verse: createSafeDynamicImport(() => import('@/components/mdx/Verse'),
    (props: any) => <div className="bg-gray-800/50 rounded-lg p-6 italic my-6" {...props} />
  ),
  Grid: createSafeDynamicImport(() => import('@/components/mdx/Grid'),
    (props: any) => <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6" {...props} />
  ),
  
  // Mapping for layout logic with safety
  ResourceGrid: createSafeDynamicImport(() => import('@/components/mdx/Grid'),
    (props: any) => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6" {...props} />
  ),
  
  // Standard HTML elements for MDX with production-safe attributes
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const { children, className, ...rest } = props;
    return (
      <h1 
        className={`text-4xl font-bold mt-8 mb-4 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </h1>
    );
  },
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const { children, className, ...rest } = props;
    return (
      <h2 
        className={`text-3xl font-bold mt-6 mb-3 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </h2>
    );
  },
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const { children, className, ...rest } = props;
    return (
      <h3 
        className={`text-2xl font-bold mt-4 mb-2 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </h3>
    );
  },
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const { children, className, ...rest } = props;
    return (
      <h4 
        className={`text-xl font-bold mt-3 mb-2 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </h4>
    );
  },
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => {
    const { children, className, ...rest } = props;
    return (
      <p 
        className={`my-4 leading-relaxed ${className || ''}`}
        {...rest}
      >
        {children || null}
      </p>
    );
  },
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const { children, href, className, ...rest } = props;
    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
    
    return (
      <a 
        href={href}
        className={`text-amber-500 hover:text-amber-400 underline ${className || ''}`}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        target={isExternal ? '_blank' : undefined}
        {...rest}
      >
        {children || null}
      </a>
    );
  },
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => {
    const { children, className, ...rest } = props;
    return (
      <ul 
        className={`list-disc pl-6 my-4 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </ul>
    );
  },
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => {
    const { children, className, ...rest } = props;
    return (
      <ol 
        className={`list-decimal pl-6 my-4 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </ol>
    );
  },
  li: (props: React.HTMLAttributes<HTMLLIElement>) => {
    const { children, className, ...rest } = props;
    return (
      <li 
        className={`my-2 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </li>
    );
  },
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => {
    const { children, className, ...rest } = props;
    return (
      <blockquote 
        className={`border-l-4 border-amber-500 pl-4 italic my-4 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </blockquote>
    );
  },
  code: (props: React.HTMLAttributes<HTMLElement>) => {
    const { children, className, ...rest } = props;
    return (
      <code 
        className={`bg-gray-800 rounded px-1 py-0.5 font-mono text-sm ${className || ''}`}
        {...rest}
      >
        {children || null}
      </code>
    );
  },
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => {
    const { children, className, ...rest } = props;
    return (
      <pre 
        className={`bg-gray-900 rounded-lg p-4 overflow-x-auto my-4 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </pre>
    );
  },
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { src, alt = '', className, loading = 'lazy', ...rest } = props;
    return (
      <img 
        src={src}
        alt={alt}
        className={`rounded-lg my-4 max-w-full ${className || ''}`}
        loading={loading}
        {...rest}
      />
    );
  },
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => {
    const { className, ...rest } = props;
    return (
      <hr 
        className={`my-8 border-gray-700 ${className || ''}`}
        {...rest}
      />
    );
  },
  table: (props: React.HTMLAttributes<HTMLTableElement>) => {
    const { children, className, ...rest } = props;
    return (
      <table 
        className={`min-w-full divide-y divide-gray-700 my-4 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </table>
    );
  },
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => {
    const { children, className, ...rest } = props;
    return (
      <thead 
        className={`bg-gray-800 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </thead>
    );
  },
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => {
    const { children, className, ...rest } = props;
    return (
      <tbody 
        className={`divide-y divide-gray-700 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </tbody>
    );
  },
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => {
    const { children, ...rest } = props;
    return (
      <tr {...rest}>
        {children || null}
      </tr>
    );
  },
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => {
    const { children, className, ...rest } = props;
    return (
      <th 
        className={`px-4 py-2 text-left font-semibold ${className || ''}`}
        {...rest}
      >
        {children || null}
      </th>
    );
  },
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => {
    const { children, className, ...rest } = props;
    return (
      <td 
        className={`px-4 py-2 ${className || ''}`}
        {...rest}
      >
        {children || null}
      </td>
    );
  },
};

/**
 * SIMPLE FALLBACK COMPONENTS - Guaranteed to work in any environment
 */
export const simpleMdxComponents = {
  // Minimal fallbacks that never fail
  Badge: (props: any) => <span className="inline-block bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-sm" {...props} />,
  Callout: (props: any) => (
    <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-4 my-4" {...props} />
  ),
  Note: (props: any) => (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 my-4" {...props} />
  ),
  Quote: (props: any) => (
    <blockquote className="border-l-4 border-amber-500 pl-6 italic text-xl my-8" {...props} />
  ),
  PullLine: (props: any) => (
    <div className="text-2xl font-serif italic text-amber-300 border-l-4 border-amber-500 pl-6 my-8" {...props} />
  ),
  Verse: (props: any) => (
    <div className="bg-gray-800/50 rounded-lg p-6 italic my-6" {...props} />
  ),
  Grid: (props: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6" {...props} />
  ),
  // Standard HTML elements (minimal)
  h1: (props: any) => <h1 className="text-4xl font-bold mt-8 mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-3xl font-bold mt-6 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-bold mt-4 mb-2" {...props} />,
  h4: (props: any) => <h4 className="text-xl font-bold mt-3 mb-2" {...props} />,
  p: (props: any) => <p className="my-4 leading-relaxed" {...props} />,
  a: (props: any) => <a className="text-amber-500 hover:text-amber-400 underline" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-6 my-4" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-6 my-4" {...props} />,
  li: (props: any) => <li className="my-2" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-amber-500 pl-4 italic my-4" {...props} />,
  code: (props: any) => <code className="bg-gray-800 rounded px-1 py-0.5 font-mono text-sm" {...props} />,
  pre: (props: any) => <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto my-4" {...props} />,
  img: (props: any) => <img className="rounded-lg my-4 max-w-full" alt="" {...props} />,
  hr: (props: any) => <hr className="my-8 border-gray-700" {...props} />,
  table: (props: any) => <table className="min-w-full divide-y divide-gray-700 my-4" {...props} />,
  thead: (props: any) => <thead className="bg-gray-800" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-gray-700" {...props} />,
  tr: (props: any) => <tr {...props} />,
  th: (props: any) => <th className="px-4 py-2 text-left font-semibold" {...props} />,
  td: (props: any) => <td className="px-4 py-2" {...props} />,
};

/**
 * THE SANITIZER - Production safe
 * Prevents "Reason: undefined cannot be serialized as JSON"
 */
export function sanitizeData<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  
  try {
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        // SAFE: Handle undefined values
        if (value === undefined) return null;
        
        // SAFE: Handle circular references
        if (typeof value === 'object' && value !== null) {
          try {
            // Quick check for circular references
            JSON.stringify(value);
            return value;
          } catch {
            return `[Circular Reference: ${key}]`;
          }
        }
        
        return value;
      })
    );
  } catch (error) {
    // SAFE: Return null instead of crashing
    if (isDevelopment()) {
      console.warn('[SANITIZE_DATA] Failed to sanitize:', error);
    }
    return null as any;
  }
}

/**
 * SAFE CONTENT VALIDATION
 */
function validateAndSanitizeContent(content: unknown): string {
  // Handle empty content
  if (!content) return 'Transmission pending...';
  
  // Convert to string safely
  let contentStr: string;
  try {
    contentStr = String(content);
  } catch {
    return 'Transmission pending...';
  }
  
  // CRITICAL: Remove null bytes and control characters
  contentStr = contentStr
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit content size for production safety
  const MAX_CONTENT_SIZE = isProduction() ? 500000 : 1000000; // 500KB in prod
  if (contentStr.length > MAX_CONTENT_SIZE) {
    if (isProduction()) {
      console.warn(`[MDX_CONTENT_SIZE] Content truncated from ${contentStr.length} to ${MAX_CONTENT_SIZE} chars`);
    }
    contentStr = contentStr.substring(0, MAX_CONTENT_SIZE);
  }
  
  return contentStr.trim() || 'Transmission pending...';
}

/**
 * MDX PROCESSOR - Production safe with comprehensive error handling
 */
export async function prepareMDX(content: unknown, options?: Partial<SerializeOptions>) {
  const safeContent = validateAndSanitizeContent(content);
  
  try {
    const mdxOptions: SerializeOptions['mdxOptions'] = {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
      development: isDevelopment(),
      // SAFE: Disable provider in production for performance
      providerImportSource: isDevelopment() ? '@mdx-js/react' : undefined,
    };
    
    const result = await serialize(safeContent, {
      mdxOptions,
      parseFrontmatter: false,
      ...options,
    });
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown MDX error';
    
    // SAFE: Log error appropriately
    if (isProduction()) {
      console.error('[MDX_PROCESSING_ERROR]', errorMessage.substring(0, 100));
    } else {
      console.error('[MDX_PROCESSING_ERROR]', errorMessage, error);
    }
    
    // SAFE: Return guaranteed valid MDX fallback
    try {
      return await serialize('Transmission pending...', {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
          development: isDevelopment(),
        },
      });
    } catch (fallbackError) {
      // CRITICAL: This should never happen, but if it does, return empty result
      return {
        compiledSource: '',
        frontmatter: {},
        scope: {},
      };
    }
  }
}

/**
 * PROPS SANITIZER - Production safe
 */
export function sanitizeProps<T extends Record<string, any>>(props: T): T {
  const out: any = { ...props };
  
  for (const key of Object.keys(out)) {
    // Never touch MDXRemoteSerializeResult
    if (key === "source" || key === "components") continue;
    
    // SAFE: Sanitize other props
    out[key] = sanitizeData(out[key]);
  }
  
  return out;
}

/**
 * SAFE COMPONENT SELECTOR - Chooses appropriate components based on environment
 */
export function getSafeMdxComponents(useSimpleFallback: boolean = false) {
  if (useSimpleFallback || isProduction()) {
    // In production or when requested, use simple fallbacks
    return simpleMdxComponents;
  }
  
  // In development, try dynamic imports with fallbacks
  return mdxComponents;
}

/**
 * MDX CONTENT VALIDATION UTILITY
 */
export function validateMdxContent(content: unknown): {
  isValid: boolean;
  length: number;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!content) {
    issues.push('Content is empty');
    return { isValid: false, length: 0, issues };
  }
  
  const contentStr = validateAndSanitizeContent(content);
  const length = contentStr.length;
  
  if (length === 0 || contentStr === 'Transmission pending...') {
    issues.push('Content is effectively empty');
  }
  
  if (length > 1000000) {
    issues.push(`Content is very large (${length} characters)`);
  }
  
  // Check for common MDX issues
  if (contentStr.includes('\\u0000')) {
    issues.push('Contains null bytes');
  }
  
  if (contentStr.includes('<!--')) {
    issues.push('Contains HTML comments (may cause parsing issues)');
  }
  
  return {
    isValid: issues.length === 0,
    length,
    issues,
  };
}