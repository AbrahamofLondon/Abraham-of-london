/* lib/server/md-utils.tsx — HARDENED CONTENT ENGINE */
import * as React from 'react';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

const NODE_ENV = process.env.NODE_ENV ?? "development";
export const isProduction = () => NODE_ENV === "production";

/**
 * Ensures content is never null or non-string before serialization.
 */
export function validateAndSanitizeContent(content: unknown): string {
  if (content == null) return "Transmission pending...";
  
  const raw = typeof content === "string" 
    ? content 
    : (content as any)?.body?.raw || (content as any)?.raw || "";

  const clean = String(raw).replace(/\u0000/g, "").trim();
  return clean.length > 0 ? clean : "Transmission pending...";
}

/**
 * LEGACY EXPORT ALIAS
 * Explicitly resolves the build error: "Export sanitizeData doesn't exist"
 */
export const sanitizeData = validateAndSanitizeContent;

/**
 * Institutional MDX Components 
 * Mirrors the aesthetic of the 163 intelligence briefs.
 */
export const simpleMdxComponents = {
  h1: (p: any) => <h1 className="text-4xl font-serif italic mb-8 text-white" {...p} />,
  h2: (p: any) => <h2 className="text-2xl font-mono tracking-tighter uppercase mt-12 mb-4 text-gold" {...p} />,
  blockquote: (p: any) => <blockquote className="border-l-2 border-gold/50 pl-6 my-8 italic text-white/70" {...p} />,
  table: (p: any) => (
    <div className="my-8 overflow-x-auto border border-white/5 rounded-sm">
      <table className="min-w-full divide-y divide-white/10" {...p} />
    </div>
  ),
  th: (p: any) => <th className="px-4 py-3 bg-zinc-900 text-left font-mono text-[10px] uppercase tracking-widest text-gold" {...p} />,
  td: (p: any) => <td className="px-4 py-3 text-sm border-t border-white/5 text-white/60" {...p} />,
  Callout: ({ children, type = "info" }: any) => {
    const colors = {
      info: "border-gold/20 bg-gold/5 text-gold",
      warning: "border-red-500/20 bg-red-500/5 text-red-200",
    };
    return (
      <div className={`my-8 p-6 border-l-2 font-light ${colors[type as keyof typeof colors]}`}>
        {children}
      </div>
    );
  }
};

/**
 * Main MDX Processor
 */
export async function prepareMDX(content: unknown): Promise<MDXRemoteSerializeResult> {
  const safeContent = validateAndSanitizeContent(content);

  try {
    return await serialize(safeContent, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
        development: !isProduction(),
      },
      parseFrontmatter: false,
    });
  } catch (error) {
    console.error("[MDX_FATAL]", error);
    return {
      compiledSource: "var MDXContent=()=>null;",
      scope: {},
      frontmatter: {},
    } as any;
  }
}