// lib/server/md-utils.tsx - UPDATED VERSION
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import type { SerializeOptions } from 'next-mdx-remote/serialize';
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/* -------------------------------------------------------------------------- */
/* ENV                                                                        */
/* -------------------------------------------------------------------------- */

const NODE_ENV = process.env.NODE_ENV ?? "development";
export const isProduction = () => NODE_ENV === "production";

/* -------------------------------------------------------------------------- */
/* CONTENT NORMALISATION                                                      */
/* -------------------------------------------------------------------------- */

export function validateAndSanitizeContent(content: unknown): string {
  if (content == null) return "Transmission pending...";

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

export function sanitizeData<T = any>(input: T, maxDepth: number = 25): any {
  const seen = new WeakSet<object>();

  const walk = (val: any, depth: number): any => {
    if (depth > maxDepth) return null;

    if (val == null) return val;

    const t = typeof val;

    if (t === "string" || t === "number" || t === "boolean") return val;

    if (t === "bigint") return val.toString();

    if (t === "function" || t === "symbol") return undefined;

    if (val instanceof Date) return val.toISOString();

    if (Array.isArray(val)) {
      return val.map((v) => walk(v, depth + 1)).filter((v) => v !== undefined);
    }

    if (t === "object") {
      if (seen.has(val)) return null;
      seen.add(val);

      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        const next = walk(v, depth + 1);
        if (next !== undefined) out[k] = next;
      }
      return out;
    }

    try {
      return JSON.parse(JSON.stringify(val));
    } catch {
      return null;
    }
  };

  return walk(input, 0);
}

/* -------------------------------------------------------------------------- */
/* SIMPLE MDX COMPONENTS (FOR BASIC PAGES)                                   */
/* -------------------------------------------------------------------------- */

export const simpleMdxComponents = {
  // Basic HTML elements with minimal styling
  h1: ({ children, ...props }: any) => (
    <h1 className="text-3xl font-bold mb-6 text-white" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-2xl font-bold mt-8 mb-4 text-white" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-xl font-bold mt-6 mb-3 text-white" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 className="text-lg font-bold mt-6 mb-2 text-white" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: any) => (
    <p className="mb-4 text-gray-300 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="mb-6 ml-6 list-disc space-y-2 text-gray-300" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="mb-6 ml-6 list-decimal space-y-2 text-gray-300" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-bold text-white" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic text-gray-300" {...props}>
      {children}
    </em>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-gold pl-4 my-6 italic text-gray-400" {...props}>
      {children}
    </blockquote>
  ),
  hr: (props: any) => (
    <hr className="my-8 border-white/10" {...props} />
  ),
  a: ({ children, href, ...props }: any) => (
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
  img: ({ src, alt, ...props }: any) => (
    <img 
      src={src} 
      alt={alt} 
      className="rounded-lg my-6 max-w-full"
      {...props}
    />
  ),
  code: ({ children, ...props }: any) => (
    <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }: any) => (
    <pre className="bg-white/5 p-4 rounded-lg overflow-x-auto my-6" {...props}>
      {children}
    </pre>
  ),
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-white/10" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-300 bg-white/5" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-3 text-sm text-gray-300 border-t border-white/5" {...props}>
      {children}
    </td>
  ),
  // Common components that might be used in MDX
  Callout: ({ children, type = "info" }: any) => {
    const typeStyles = {
      info: "border-blue-500/20 bg-blue-500/10 text-blue-200",
      warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
      success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      error: "border-red-500/20 bg-red-500/10 text-red-200",
      default: "border-white/20 bg-white/10 text-gray-200",
    };
    
    const style = typeStyles[type] || typeStyles.default;
    
    return (
      <div className={`my-6 rounded-lg border p-4 ${style}`}>
        <div className="prose-invert max-w-none">{children}</div>
      </div>
    );
  },
  Quote: ({ children, author }: any) => (
    <div className="my-8 border-l-4 border-gold pl-6 py-2">
      <blockquote className="text-xl italic text-gray-300 leading-relaxed">
        "{children}"
      </blockquote>
      {author && (
        <p className="mt-4 text-sm text-gray-500">— {author}</p>
      )}
    </div>
  ),
  Note: ({ children }: any) => (
    <div className="my-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
          i
        </div>
        <div className="prose-invert max-w-none">{children}</div>
      </div>
    </div>
  ),
  Warning: ({ children }: any) => (
    <div className="my-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
          !
        </div>
        <div className="prose-invert max-w-none">{children}</div>
      </div>
    </div>
  ),
};

/* -------------------------------------------------------------------------- */
/* MDX PROCESSOR                                                              */
/* -------------------------------------------------------------------------- */

export async function prepareMDX(
  content: unknown,
  options?: Partial<SerializeOptions>
): Promise<MDXRemoteSerializeResult> {
  const safeContent = validateAndSanitizeContent(content);

  const mdxOptions: SerializeOptions["mdxOptions"] = {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    development: !isProduction(),
  };

  try {
    const result = await serialize(safeContent, {
      mdxOptions,
      parseFrontmatter: false,
      ...(options ?? {}),
    });

    if (!result || typeof result !== 'object') {
      console.error("[MDX_PROCESSING] serialize() returned invalid result:", typeof result);
      throw new Error("serialize() returned invalid result");
    }

    if (!result.compiledSource || typeof result.compiledSource !== 'string') {
      console.warn("[MDX_PROCESSING] Missing or invalid compiledSource, using fallback");
      return {
        compiledSource: result.compiledSource || "",
        scope: result.scope || {},
        frontmatter: result.frontmatter || {},
      } as MDXRemoteSerializeResult;
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MDX error";

    if (isProduction()) {
      console.error("[MDX_PROCESSING_ERROR]", message.slice(0, 160));
    } else {
      console.error("[MDX_PROCESSING_ERROR]", message, error);
    }

    try {
      const fallbackResult = await serialize("Transmission pending...", {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
          development: !isProduction(),
        },
        parseFrontmatter: false,
      });

      if (!fallbackResult || !fallbackResult.compiledSource) {
        throw new Error("Fallback serialize also failed");
      }

      return fallbackResult;
    } catch (fallbackError) {
      if (!isProduction()) {
        console.error("[MDX_FALLBACK_FAILED]", fallbackError);
      }

      return {
        compiledSource: "function MDXContent(props) { return null; }",
        scope: {},
        frontmatter: {},
      } as MDXRemoteSerializeResult;
    }
  }
}