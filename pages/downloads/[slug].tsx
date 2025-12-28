// pages/downloads/[slug].tsx - COMPLETE FIXED VERSION
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import {
  getAllDownloads,
  normalizeSlug,
  resolveDocDownloadUrl,
  resolveDocCoverImage,
} from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { Download, FileText } from "lucide-react";

type Props = {
  download: {
    title: string;
    excerpt: string | null;
    description: string | null;
    category: string;
    fileUrl: string | null;
    coverImage: string | null;
    slug: string;
    date: string | null;
    tags: string[];
  };
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const downloads = getAllDownloads();
    
    const paths = downloads
      .filter((d) => {
        // Exclude drafts
        if (d.draft === true) return false;
        // Must have a valid slug
        const slug = normalizeSlug(d);
        return slug && slug.length > 0;
      })
      .map((d) => ({
        params: { slug: normalizeSlug(d) },
      }));

    console.log(`📥 Downloads: Generated ${paths.length} paths`);

    return { paths, fallback: false };
  } catch (error) {
    console.error("❌ Error generating static paths for downloads:", error);
    return { paths: [], fallback: false };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = String(params?.slug ?? "").trim().toLowerCase();
    
    if (!slug) {
      return { notFound: true };
    }

    const downloads = getAllDownloads();
    const rawDoc = downloads.find((d) => normalizeSlug(d) === slug);

    if (!rawDoc) {
      console.warn(`⚠️ Download not found for slug: ${slug}`);
      return { notFound: true };
    }

    // Check if it's a draft
    if (rawDoc.draft === true) {
      console.warn(`⚠️ Download is draft: ${slug}`);
      return { notFound: true };
    }

    // Extract MDX content from various possible locations
    const mdxContent =
      typeof rawDoc.body?.raw === "string"
        ? rawDoc.body.raw
        : typeof rawDoc.body?.code === "string"
        ? rawDoc.body.code
        : typeof rawDoc.content === "string"
        ? rawDoc.content
        : "";

    if (!mdxContent || mdxContent.trim().length === 0) {
      console.warn(`⚠️ Download "${rawDoc.title}" has no content for slug: ${slug}`);
      return { notFound: true };
    }

    // Build the download object (extract only serializable primitives)
    const download = {
      title: rawDoc.title || "Download",
      excerpt: rawDoc.excerpt || null,
      description: rawDoc.description || rawDoc.excerpt || null,
      category: rawDoc.category || "Vault Resource",
      fileUrl: resolveDocDownloadUrl(rawDoc),
      coverImage: resolveDocCoverImage(rawDoc),
      slug,
      date: rawDoc.date || null,
      tags: Array.isArray(rawDoc.tags) ? rawDoc.tags : [],
    };

    // Serialize MDX
    const mdxSource = await serialize(mdxContent, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    return {
      props: {
        download,
        source: mdxSource,
      },
      revalidate: 3600, // ISR: regenerate every hour
    };
  } catch (error) {
    console.error(`❌ Error in getStaticProps for download:`, params?.slug, error);
    return { notFound: true };
  }
};

const DownloadPage: NextPage<Props> = ({ download, source }) => {
  return (
    <Layout title={download.title}>
      <Head>
        <title>{download.title} | Downloads | Abraham of London</title>
        {download.description && (
          <meta name="description" content={download.description} />
        )}
        {download.coverImage && (
          <>
            <meta property="og:image" content={download.coverImage} />
            <meta name="twitter:image" content={download.coverImage} />
          </>
        )}
        <meta property="og:type" content="article" />
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-20">
        {/* Header Section */}
        <header className="mb-12 border-b border-gold/10 pb-10">
          {/* Category Badge */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
              <FileText className="h-5 w-5 text-gold" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold/70">
              {download.category}
            </p>
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl font-semibold text-cream sm:text-5xl">
            {download.title}
          </h1>

          {/* Excerpt */}
          {download.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-gray-300">
              {download.excerpt}
            </p>
          )}

          {/* Tags */}
          {download.tags && download.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {download.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Download Button */}
          {download.fileUrl && (
            <a
              href={download.fileUrl}
              download
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:scale-105 hover:bg-amber-400 hover:shadow-lg hover:shadow-gold/20"
            >
              <Download className="h-4 w-4" />
              Download Document
            </a>
          )}

          {/* Date */}
          {download.date && (
            <p className="mt-6 text-sm text-gold/60">
              Published: {new Date(download.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </header>

        {/* Content Section */}
        <article className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-headings:text-cream prose-p:text-gray-300 prose-a:text-gold prose-a:no-underline hover:prose-a:text-amber-200 prose-strong:text-cream prose-code:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>

        {/* Bottom CTA */}
        {download.fileUrl && (
          <footer className="mt-16 border-t border-gold/10 pt-10">
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-charcoal/90 to-charcoal/70 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/30">
                <Download className="h-8 w-8 text-gold" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-cream">
                  Ready to download?
                </h2>
                <p className="mt-2 text-sm text-gold/70">
                  Get instant access to {download.title}
                </p>
              </div>
              <a
                href={download.fileUrl}
                download
                className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:scale-105 hover:bg-amber-400 hover:shadow-lg hover:shadow-gold/20"
              >
                <Download className="h-4 w-4" />
                Download Now
              </a>
            </div>
          </footer>
        )}
      </main>
    </Layout>
  );
};

export default DownloadPage;