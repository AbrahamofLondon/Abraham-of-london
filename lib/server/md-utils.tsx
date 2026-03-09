/* lib/server/md-utils.tsx — PRODUCTION MDX COMPILER (build-safe, JSX-safe) */
import "server-only";

import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

const NODE_ENV = process.env.NODE_ENV ?? "development";

export const isProduction = (): boolean => NODE_ENV === "production";

/**
 * Ensure content is always a safe string for MDX compilation.
 * IMPORTANT:
 * - Do NOT strip JSX / MDX component tags
 * - Do NOT HTML-escape content here
 * - Only normalize safely
 */
export function validateAndSanitizeContent(content: unknown): string {
  if (content == null) return "Transmission pending...";

  const raw =
    typeof content === "string"
      ? content
      : (content as { body?: { raw?: unknown }; raw?: unknown; content?: unknown })?.body
          ?.raw ??
        (content as { raw?: unknown })?.raw ??
        (content as { content?: unknown })?.content ??
        "";

  const clean = String(raw)
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

  return clean.length > 0 ? clean : "Transmission pending...";
}

/**
 * Compile MDX content in a way that is compatible with next-mdx-remote.
 *
 * Notes:
 * - We intentionally do NOT pass providerImportSource because the current
 *   next-mdx-remote compile options type rejects it.
 * - We intentionally keep plugins minimal and deterministic.
 * - JSX/MDX tags such as <Callout /> remain valid as long as the renderer
 *   supplies matching components at render time.
 */
export async function prepareMDX(
  content: unknown
): Promise<MDXRemoteSerializeResult> {
  const mdx = validateAndSanitizeContent(content);

  try {
    const result = await serialize(mdx, {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
        development: !isProduction(),
      },
    });

    /**
     * If raw tags still appear in compiledSource, it usually means upstream content
     * was escaped before it reached the compiler, not that MDX itself failed.
     */
    const compiled = String(
      (result as { compiledSource?: unknown })?.compiledSource ?? ""
    );

    if (/(<Callout\b|<Divider\b|<\/Callout>)/.test(compiled)) {
      console.warn(
        "[MDX_WARN] Compiled output still contains raw component tags. Upstream escaping/sanitization may be occurring before MDX compilation."
      );
    }

    return result;
  } catch (error) {
    console.error("[MDX_FATAL]", error);

    const fallback = await serialize(
      [
        "# Content compilation failed",
        "",
        "A rendering error occurred while preparing this document.",
      ].join("\n"),
      {
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
          development: !isProduction(),
        },
      }
    );

    return fallback;
  }
}

export default {
  isProduction,
  validateAndSanitizeContent,
  prepareMDX,
};