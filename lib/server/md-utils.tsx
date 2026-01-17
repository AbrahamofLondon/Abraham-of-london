// lib/server/md-utils.tsx
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import type { SerializeOptions } from 'next-mdx-remote/serialize';
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

// IMPORTANT: static imports avoid webpack warnings
import mdxComponents from "@/components/mdx-components";
import simpleMdxComponents from "@/components/mdx/MinimalMdxComponents";

/* -------------------------------------------------------------------------- */
/* ENV                                                                        */
/* -------------------------------------------------------------------------- */

const NODE_ENV = process.env.NODE_ENV ?? "development";
export const isProduction = () => NODE_ENV === "production";
export const isDevelopment = () => !isProduction();

/* -------------------------------------------------------------------------- */
/* CONTENT NORMALISATION                                                      */
/* -------------------------------------------------------------------------- */

export function validateAndSanitizeContent(content: unknown): string {
  if (content == null) return "Transmission pending...";

  // Contentlayer docs sometimes pass body.raw or body as non-string
  const asString =
    typeof content === "string"
      ? content
      : typeof (content as any)?.raw === "string"
        ? (content as any).raw
        : typeof (content as any)?.body?.raw === "string"
          ? (content as any).body.raw
          : "";

  const trimmed = String(asString).replace(/\u0000/g, "").trim();
  return trimmed.length > 0 ? trimmed : "Transmission pending...";
}

/* -------------------------------------------------------------------------- */
/* SANITIZER                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * sanitizeData()
 * - JSON-safe output (no functions/symbols)
 * - cycle-safe
 * - Date-safe
 * - BigInt-safe
 * - trims extremely deep objects to avoid runaway recursion
 */
export function sanitizeData<T = any>(input: T, maxDepth: number = 25): any {
  const seen = new WeakSet<object>();

  const walk = (val: any, depth: number): any => {
    if (depth > maxDepth) return null;

    if (val == null) return val;

    const t = typeof val;

    if (t === "string" || t === "number" || t === "boolean") return val;

    if (t === "bigint") return val.toString(); // JSON can't serialize BigInt

    if (t === "function" || t === "symbol") return undefined;

    if (val instanceof Date) return val.toISOString();

    if (Array.isArray(val)) {
      return val.map((v) => walk(v, depth + 1)).filter((v) => v !== undefined);
    }

    if (t === "object") {
      if (seen.has(val)) return null; // break cycles
      seen.add(val);

      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        const next = walk(v, depth + 1);
        if (next !== undefined) out[k] = next;
      }
      return out;
    }

    // fallback for weird types
    try {
      return JSON.parse(JSON.stringify(val));
    } catch {
      return null;
    }
  };

  return walk(input, 0);
}

/* -------------------------------------------------------------------------- */
/* MDX PROCESSOR                                                              */
/* -------------------------------------------------------------------------- */

/**
 * MDX PROCESSOR - Production safe with comprehensive error handling
 */
export async function prepareMDX(
  content: unknown,
  options?: Partial<SerializeOptions>
): Promise<MDXRemoteSerializeResult> {
  const safeContent = validateAndSanitizeContent(content);

  const mdxOptions: SerializeOptions["mdxOptions"] = {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    development: isDevelopment(),
    /**
     * providerImportSource is only useful when you're actually using MDX provider patterns.
     * Keeping it dev-only avoids unexpected runtime/provider coupling.
     */
    providerImportSource: isDevelopment() ? "@mdx-js/react" : undefined,
  };

  try {
    return await serialize(safeContent, {
      mdxOptions,
      parseFrontmatter: false,
      ...(options ?? {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MDX error";

    if (isProduction()) {
      console.error("[MDX_PROCESSING_ERROR]", message.slice(0, 160));
    } else {
      console.error("[MDX_PROCESSING_ERROR]", message, error);
    }

    // Guaranteed-valid fallback MDX
    try {
      return await serialize("Transmission pending...", {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
          development: isDevelopment(),
        },
        parseFrontmatter: false,
      });
    } catch (fallbackError) {
      // Absolute last-resort: return an empty MDXRemoteSerializeResult shape
      if (!isProduction()) {
        console.error("[MDX_FALLBACK_FAILED]", fallbackError);
      }

      return {
        compiledSource: "",
        frontmatter: {},
        scope: {},
      } as unknown as MDXRemoteSerializeResult;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* PROPS SANITIZER                                                            */
/* -------------------------------------------------------------------------- */

/**
 * PROPS SANITIZER - Production safe
 */
export function sanitizeProps<T extends Record<string, any>>(props: T): T {
  const out: any = { ...props };

  for (const key of Object.keys(out)) {
    // Never touch MDXRemoteSerializeResult or component maps
    if (key === "source" || key === "components") continue;
    out[key] = sanitizeData(out[key]);
  }

  return out as T;
}

/* -------------------------------------------------------------------------- */
/* SAFE COMPONENT SELECTOR                                                    */
/* -------------------------------------------------------------------------- */

/**
 * SAFE COMPONENT SELECTOR - Chooses appropriate components based on environment
 */
export function getSafeMdxComponents(useSimpleFallback: boolean = false) {
  if (useSimpleFallback || isProduction()) return simpleMdxComponents;
  return mdxComponents;
}

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

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
    issues.push("Content is empty");
    return { isValid: false, length: 0, issues };
  }

  const contentStr = validateAndSanitizeContent(content);
  const length = contentStr.length;

  if (length === 0 || contentStr === "Transmission pending...") {
    issues.push("Content is effectively empty");
  }

  if (length > 1_000_000) {
    issues.push(`Content is very large (${length} characters)`);
  }

  // Common MDX landmines
  if (contentStr.includes("\u0000")) issues.push("Contains null bytes");
  if (contentStr.includes("<!--")) issues.push("Contains HTML comments (may cause parsing issues)");

  // Unbalanced braces can choke MDX if embedded in JSX
  const openBraces = (contentStr.match(/{/g) ?? []).length;
  const closeBraces = (contentStr.match(/}/g) ?? []).length;
  if (openBraces !== closeBraces) {
    issues.push(`Possibly unbalanced braces: {=${openBraces}, }=${closeBraces}`);
  }

  return { isValid: issues.length === 0, length, issues };
}

export { mdxComponents, simpleMdxComponents };


