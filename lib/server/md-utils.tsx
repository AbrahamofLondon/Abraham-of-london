/* lib/server/md-utils.tsx — PRODUCTION MDX COMPILER (build-safe, JSX-safe) */
import "server-only";

import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

const NODE_ENV = process.env.NODE_ENV ?? "development";

export const isProduction = (): boolean => NODE_ENV === "production";

type ContentLike =
  | string
  | {
      body?: { raw?: unknown };
      raw?: unknown;
      content?: unknown;
    }
  | null
  | undefined;

/**
 * Ensure content is always a safe string for MDX compilation.
 * IMPORTANT:
 * - Do NOT strip JSX / MDX component tags
 * - Do NOT HTML-escape content here
 * - Only normalize safely
 */
export function validateAndSanitizeContent(content: ContentLike): string {
  if (content == null) return "Transmission pending...";

  const raw =
    typeof content === "string"
      ? content
      : content?.body?.raw ?? content?.raw ?? content?.content ?? "";

  const clean = String(raw)
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

  return clean.length > 0 ? clean : "Transmission pending...";
}

const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeSlug],
  development: !isProduction(),
};

/**
 * Compile MDX content in a way that is compatible with next-mdx-remote.
 */
export async function prepareMDX(
  content: ContentLike
): Promise<MDXRemoteSerializeResult> {
  const mdx = validateAndSanitizeContent(content);

  try {
    const result = await serialize(mdx, {
      parseFrontmatter: false,
      mdxOptions,
    });

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

    return serialize(
      [
        "# Content compilation failed",
        "",
        "A rendering error occurred while preparing this document.",
      ].join("\n"),
      {
        parseFrontmatter: false,
        mdxOptions,
      }
    );
  }
}

export default {
  isProduction,
  validateAndSanitizeContent,
  prepareMDX,
};