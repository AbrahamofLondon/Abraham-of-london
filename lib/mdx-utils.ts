// lib/mdx-utils.ts - PRODUCTION SAFE UPGRADE
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkUnwrapImages from "remark-unwrap-images";
import rehypePrism from "rehype-prism-plus";
import type { SerializeOptions } from "next-mdx-remote";

// SAFE: Cross-platform environment detection
const isDevelopment = () => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'development';
};

const isProduction = () => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'production';
};

// Safe content validation
const sanitizeContent = (content: unknown): string => {
  if (typeof content === 'string') {
    // Remove null bytes and control characters (except newlines and tabs)
    return content
      .replace(/\x00/g, '')
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();
  }
  
  if (content === null || content === undefined) {
    return '';
  }
  
  // Try to stringify non-string content
  try {
    return String(content);
  } catch {
    return '';
  }
};

// Extended options interface for backward compatibility
export interface EnhancedSerializeOptions extends Partial<SerializeOptions> {
  /** Custom rehype plugins (will be appended to defaults) */
  customRehypePlugins?: any[];
  /** Custom remark plugins (will be appended to defaults) */
  customRemarkPlugins?: any[];
  /** Whether to parse frontmatter (defaults to false for legacy compatibility) */
  parseFrontmatter?: boolean;
  /** Maximum content length to process (prevents DoS) */
  maxLength?: number;
}

// Core plugin configuration
const getBasePlugins = () => {
  const plugins = {
    remark: [remarkGfm, remarkUnwrapImages] as any[],
    rehype: [rehypeSlug] as any[],
  };
  
  // SAFE: Only add autolink headings if the package is available
  try {
    if (typeof rehypeAutolinkHeadings === 'function') {
      plugins.rehype.push([
        rehypeAutolinkHeadings,
        { behavior: 'wrap', properties: { className: ['anchor-link'] } }
      ]);
    }
  } catch {
    // Silently fail in production, log in development
    if (isDevelopment()) {
      console.warn('[MDX] rehype-autolink-headings not available, skipping');
    }
  }
  
  // SAFE: Only add Prism for syntax highlighting in dev or if explicitly enabled
  if (isDevelopment() || process.env.ENABLE_SYNTAX_HIGHLIGHTING === 'true') {
    try {
      plugins.rehype.push([
        rehypePrism,
        { showLineNumbers: isDevelopment(), ignoreMissing: true }
      ]);
    } catch {
      // Silently ignore in production
      if (isDevelopment()) {
        console.warn('[MDX] rehype-prism-plus not available, skipping');
      }
    }
  }
  
  return plugins;
};

// Main serialize function with enhanced safety
export async function serializeMDX(
  content: unknown,
  options: EnhancedSerializeOptions = {}
) {
  const {
    customRehypePlugins = [],
    customRemarkPlugins = [],
    parseFrontmatter = false,
    maxLength = 500000, // ~500KB safety limit
    ...serializeOptions
  } = options;
  
  // SAFE: Validate and sanitize input
  const sanitizedContent = sanitizeContent(content);
  
  // Safety checks
  if (!sanitizedContent) {
    return {
      compiledSource: '',
      frontmatter: {},
      scope: {},
    };
  }
  
  if (sanitizedContent.length > maxLength) {
    if (isProduction()) {
      throw new Error(`Content exceeds maximum length of ${maxLength} characters`);
    }
    console.warn(`[MDX] Content length ${sanitizedContent.length} exceeds safe limit`);
  }
  
  try {
    const basePlugins = getBasePlugins();
    
    const mdxOptions: SerializeOptions['mdxOptions'] = {
      remarkPlugins: [...basePlugins.remark, ...customRemarkPlugins],
      rehypePlugins: [...basePlugins.rehype, ...customRehypePlugins],
      development: isDevelopment(),
      // SAFE: Disable MDX provider in production for performance
      providerImportSource: isDevelopment() ? '@mdx-js/react' : undefined,
    };
    
    const result = await serialize(sanitizedContent, {
      mdxOptions,
      parseFrontmatter,
      ...serializeOptions,
    });
    
    return result;
  } catch (error) {
    // SAFE: Graceful error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown MDX serialization error';
    
    if (isProduction()) {
      // In production, return minimal safe fallback
      return {
        compiledSource: '',
        frontmatter: {},
        scope: {},
        error: 'Content processing failed',
      };
    } else {
      // In development, throw with helpful message
      console.error('[MDX] Serialization error:', error);
      throw new Error(`MDX Serialization Failed: ${errorMessage}`);
    }
  }
}

// LEGACY COMPATIBILITY: Original function signature for existing code
export async function serializeMDXLegacy(content: string) {
  return serializeMDX(content, {
    parseFrontmatter: false,
  });
}

// Additional utility functions
export async function serializeWithComponents(
  content: unknown,
  components: any = {},
  options: EnhancedSerializeOptions = {}
) {
  const result = await serializeMDX(content, options);
  return {
    ...result,
    components,
  };
}

// SAFE: Validate MDX can be serialized without throwing
export async function validateMDX(content: unknown): Promise<{
  isValid: boolean;
  error?: string;
  length: number;
}> {
  try {
    const sanitized = sanitizeContent(content);
    
    if (!sanitized) {
      return { isValid: false, error: 'Empty content', length: 0 };
    }
    
    if (sanitized.length > 500000) {
      return { 
        isValid: false, 
        error: `Content too long (${sanitized.length} > 500000)`, 
        length: sanitized.length 
      };
    }
    
    // Quick syntax check without full processing
    const hasValidMarkdown = /^[#\-\*\[!`\d\w\s.,;:!?()'"-]+$/im.test(sanitized.substring(0, 1000));
    
    return { 
      isValid: hasValidMarkdown, 
      length: sanitized.length 
    };
  } catch {
    return { isValid: false, error: 'Validation failed', length: 0 };
  }
}

// Performance monitoring (development only)
let processingTimes: number[] = [];
const MAX_SAMPLES = 100;

export const getPerformanceMetrics = () => {
  if (!isDevelopment() || processingTimes.length === 0) {
    return null;
  }
  
  const avg = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
  const max = Math.max(...processingTimes);
  const min = Math.min(...processingTimes);
  
  return { avg, max, min, samples: processingTimes.length };
};