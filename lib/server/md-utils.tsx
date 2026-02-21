/* lib/server/md-utils.tsx — PRODUCTION MDX COMPILER (MDX-FORCED, JSX-SAFE) */
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

const NODE_ENV = process.env.NODE_ENV ?? "development";
export const isProduction = () => NODE_ENV === "production";

/**
 * Ensure content is always a safe string for MDX compilation.
 * IMPORTANT: This function MUST NOT strip JSX/MDX tags.
 */
export function validateAndSanitizeContent(content: unknown): string {
  if (content == null) return "Transmission pending...";

  const raw =
    typeof content === "string"
      ? content
      : (content as any)?.body?.raw ||
        (content as any)?.raw ||
        (content as any)?.content ||
        "";

  // Only remove null bytes + normalize line endings. Do NOT strip <Tag />.
  const clean = String(raw).replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();

  return clean.length > 0 ? clean : "Transmission pending...";
}

/**
 * MDX compilation.
 * Key fixes:
 * - Force format: "mdx" so <Callout> and <Divider /> are parsed as MDX/JSX
 * - providerImportSource enables component resolution cleanly
 * - keep plugins minimal and deterministic
 */
export async function prepareMDX(content: unknown): Promise<MDXRemoteSerializeResult> {
  const mdx = validateAndSanitizeContent(content);

  try {
    const result = await serialize(mdx, {
      mdxOptions: {
        // ✅ Critical: force MDX parsing (otherwise JSX can be treated as text)
        format: "mdx",

        // ✅ Helps MDX runtime wire components predictably
        providerImportSource: "@mdx-js/react",

        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],

        // Next-MDX-Remote forwards this to @mdx-js/mdx
        development: !isProduction(),
      },
      parseFrontmatter: false,
    });

    /**
     * Safety assertion: if MDX tags are still present in compiledSource,
     * something upstream is escaping tags (e.g. sanitize scripts).
     */
    const compiled = String((result as any)?.compiledSource ?? "");
    if (/(<Callout\b|<Divider\b|<\/Callout>)/.test(compiled)) {
      // This means the MDX compiler didn't treat them as components.
      // Typically: content was pre-escaped (&lt;Callout&gt;) or sanitized.
      console.warn(
        "[MDX_WARN] Compiled output still contains raw <Callout>/<Divider> tags. Upstream sanitation/escaping likely."
      );
    }

    return result;
  } catch (error) {
    console.error("[MDX_FATAL]", error);

    // Fail “loudly” in-page rather than silently rendering nothing.
    const safe = await serialize(
      `# Content compilation failed\n\nA rendering error occurred while preparing this document.`,
      {
        mdxOptions: {
          format: "mdx",
          providerImportSource: "@mdx-js/react",
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
          development: !isProduction(),
        },
        parseFrontmatter: false,
      }
    );

    return safe;
  }
}