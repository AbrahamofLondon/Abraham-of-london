// pages/canon/[slug].tsx
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { ParsedUrlQuery } from "querystring";
import * as React from "react";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import SiteLayout from "@/components/SiteLayout";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

interface Params extends ParsedUrlQuery {
  slug: string;
}

interface CanonPageProps {
  meta: PostMeta;
  mdxSource: MDXRemoteSerializeResult;
}

/**
 * Removes all import/export statements from MDX content.
 * next-mdx-remote does not support imports, so they must be stripped.
 */
function stripImportsAndExports(content: string): string {
  if (!content) return "";

  const lines = content.split("\n");
  const cleanedLines: string[] = [];
  let inMultilineImport = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines at start
    if (cleanedLines.length === 0 && !trimmed) continue;

    // Check if line starts an import/export
    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export ") ||
      trimmed.startsWith("import{") ||
      trimmed.startsWith("export{")
    ) {
      // Check if it's a complete statement (ends with semicolon or quote)
      if (
        trimmed.endsWith(";") ||
        trimmed.endsWith("'") ||
        trimmed.endsWith('"')
      ) {
        // Complete single-line import/export, skip it
        continue;
      } else {
        // Multiline import/export starts
        inMultilineImport = true;
        continue;
      }
    }

    // If we're in a multiline import/export
    if (inMultilineImport) {
      // Check if this line ends the import/export
      if (
        trimmed.endsWith(";") ||
        trimmed.endsWith("'") ||
        trimmed.endsWith('"')
      ) {
        inMultilineImport = false;
      }
      continue;
    }

    // Keep this line
    cleanedLines.push(line);
  }

  return cleanedLines.join("\n").trim();
}

// ----------------------------------------------------------------------
// Page component
// ----------------------------------------------------------------------
const CanonPage: NextPage<CanonPageProps> = ({ meta, mdxSource }) => {
  const { title, excerpt, description, date } = meta;
  const metaDescription =
    excerpt ||
    description ||
    "Canon document from Abraham of London.";

  const displayDate = React.useMemo(() => {
    if (!date) return null;
    try {
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) return null;
      return parsedDate.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  }, [date]);

  return (
    <SiteLayout pageTitle={title} metaDescription={metaDescription}>
      <article className="prose prose-invert prose-lg mx-auto max-w-3xl py-10 md:py-16 prose-headings:font-serif prose-headings:text-cream prose-strong:text-cream prose-a:text-softGold">
        <header className="mb-8 border-b border-gray-700 pb-4">
          <h1 className="font-serif text-3xl font-bold text-cream md:text-4xl">
            {title}
          </h1>
          {displayDate && (
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-400">
              {displayDate}
            </p>
          )}
        </header>
        <MDXRemote {...mdxSource} components={mdxComponents} />
      </article>
    </SiteLayout>
  );
};

export default CanonPage;

// ----------------------------------------------------------------------
// Static generation
// ----------------------------------------------------------------------
export const getStaticPaths: GetStaticPaths<Params> = async () => {
  try {
    const canonItems = await getAllContent("canon");
    
    if (!canonItems || canonItems.length === 0) {
      console.warn("[Canon] No canon items found");
      return {
        paths: [],
        fallback: false,
      };
    }

    const paths = canonItems
      .filter((doc: { slug: string }) => doc.slug)
      .map((doc: { slug: string }) => ({
        params: { slug: doc.slug },
      }));

    console.log(`[Canon] Generated ${paths.length} paths:`, paths.map(p => p.params.slug).join(", "));
    return {
      paths,
      fallback: false,
    };
  } catch (error) {
    console.error("[Canon] Error in getStaticPaths:", error);
    return {
      paths: [],
      fallback: false,
    };
  }
};

export const getStaticProps: GetStaticProps<CanonPageProps, Params> = async ({
  params,
}) => {
  const slug = params?.slug;
  
  try {
    if (!slug) {
      console.error("[Canon] No slug provided");
      return { notFound: true };
    }

    console.log(`[Canon] Building page for slug: ${slug}`);

    const doc = await getContentBySlug("canon", slug);
    
    if (!doc) {
      console.error(`[Canon] Document not found for slug: ${slug}`);
      return { notFound: true };
    }

    const { meta, content } = doc;

    // Validate required fields
    if (!meta?.title) {
      console.error(`[Canon] Missing title for slug: ${slug}`);
      return { notFound: true };
    }

    if (!content) {
      console.error(`[Canon] Missing content for slug: ${slug}`);
      return { notFound: true };
    }

    // Strip import/export statements
    const cleanContent = stripImportsAndExports(content);

    if (!cleanContent) {
      console.error(`[Canon] Empty content after cleaning for slug: ${slug}`);
      console.error(`[Canon] Original content length: ${content.length}`);
      console.error(`[Canon] First 200 chars: ${content.substring(0, 200)}`);
      return { notFound: true };
    }

    console.log(`[Canon] Content cleaned for ${slug}: ${content.length} -> ${cleanContent.length} chars`);

    // Serialize MDX
    let mdxSource: MDXRemoteSerializeResult;
    try {
      mdxSource = await serialize(cleanContent, {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [],
          development: false,
        },
      });
      console.log(`[Canon] Serialization successful for ${slug}`);
    } catch (serializeError) {
      console.error(`[Canon] Serialization error for ${slug}:`, serializeError);
      console.error(`[Canon] Content that failed to serialize (first 500 chars):`, cleanContent.substring(0, 500));
      throw serializeError;
    }

    // Ensure meta is JSON-serializable
    const safeMeta: PostMeta = JSON.parse(JSON.stringify({
      title: String(meta.title || ""),
      slug: String(meta.slug || slug),
      excerpt: meta.excerpt ? String(meta.excerpt) : undefined,
      description: meta.description ? String(meta.description) : undefined,
      date: meta.date ? new Date(meta.date).toISOString() : undefined,
      // Include other meta fields if they exist and are serializable
      ...(meta.author && { author: String(meta.author) }),
      ...(meta.tags && Array.isArray(meta.tags) && { tags: meta.tags }),
      ...(meta.category && { category: String(meta.category) }),
    }));

    console.log(`[Canon] Successfully built ${slug}`);

    return {
      props: {
        meta: safeMeta,
        mdxSource,
      },
    };
  } catch (error) {
    console.error(`[Canon] Fatal error for slug ${slug}:`, error);
    if (error instanceof Error) {
      console.error(`[Canon] Error name: ${error.name}`);
      console.error(`[Canon] Error message: ${error.message}`);
      console.error(`[Canon] Error stack:`, error.stack);
    }
    
    // During build, we want to see the error
    throw error;
  }
};