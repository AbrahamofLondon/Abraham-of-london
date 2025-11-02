// pages/downloads/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import * as React from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

// ✅ CLEANED IMPORTS: Use unified system
import Layout from "@/components/Layout";
import mdxComponents from '@/components/mdx-components';
import { getAllContent, getContentBySlug } from "@/lib/mdx"; // Assuming these are the unified server functions

// --- Data Fetching Functions --- (Assuming these are still necessary as local helpers)
const CONTENT_TYPE = "downloads";

// Assuming getDownloadSlugs is now handled by getAllContent('downloads')
// Assuming getDownloadBySlug is now handled by getContentBySlug('downloads', slug)

type DownloadMeta = {
  slug: string;
  title: string;
  date?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  pdfPath?: string | null;
  author?: string | null;
  readTime?: string | null;
  category?: string | null;
  tags?: string[] | null;
  coverAspect?: "book" | "wide" | "square" | null;
  coverFit?: "cover" | "contain" | null;
  coverPosition?: "left" | "center" | "right" | null;
  // CRITICAL: Ensure all ContentLayer required fields are present if ContentLayer is active, otherwise remove ContentLayer entirely
};

type Props = { meta: DownloadMeta; content: MDXRemoteSerializeResult };

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const { content, ...data } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });

  const meta: DownloadMeta = {
    slug,
    title: (data as any).title || slug,
    date: (data as any).date ?? null,
    excerpt: (data as any).excerpt ?? null,
    coverImage: (data as any).coverImage ?? null,
    pdfPath: (data as any).pdfPath ?? null,
    author: (data as any).author ?? "Abraham of London",
    readTime: (data as any).readTime ?? null,
    category: (data as any).category ?? null,
    tags: Array.isArray((data as any).tags) ? (data as any).tags : null,
    coverAspect: (data as any).coverAspect ?? null,
    coverFit: (data as any).coverFit ?? null,
    coverPosition: (data as any).coverPosition ?? null,
  };

  const mdx = await serialize(content || "", {
    parseFrontmatter: false,
    scope: meta,
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [] },
  });

  return { props: { meta, content: mdx }, revalidate: 120 };
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Use unified getAllContent
  const slugs = getAllContent(CONTENT_TYPE).map(item => item.slug.toLowerCase());
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: "blocking" };
};

export default function DownloadPage({ meta, content }: Props) {
  const {
    slug,
    title,
    date,
    excerpt,
    coverImage,
    author,
    readTime,
    category,
    tags,
    pdfPath,
  } = meta;

  const formattedDate = date ? format(new Date(date), "MMMM d, yyyy") : "";
  const authorName = typeof author === "string" ? author : "Abraham of London";

  return (
    <Layout pageTitle={title}>
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        {/* Simplified Image Rendering for stability */}
        {coverImage && (
          <div className="mb-6 overflow-hidden rounded-xl border border-lightGrey shadow-card aspect-[16/9]">
            <Image
              src={coverImage}
              alt={title}
              width={1600}
              height={900}
              sizes="(max-width: 768px) 100vw, 1200px"
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        )}

        <h1 className="mb-4 font-serif text-4xl text-deepCharcoal md:text-5xl">{title}</h1>

        <div className="mb-6 text-sm text-[color:var(--color-on-secondary)/0.7]">
          <span>By {authorName}</span>
          {date && (
            <>
              {" "}· <time dateTime={date}>{formattedDate}</time>
            </>
          )}
          {readTime && <> · {readTime}</>}
          {category && (
            <span className="ml-2 inline-block rounded border border-lightGrey bg-warmWhite px-2 py-0.5 text-xs">
              {category}
            </span>
          )}
        </div>

        <div className="prose prose-lg max-w-none text-deepCharcoal">
          {/* ✅ FIX: Use lowercase mdxComponents */}
          <MDXRemote {...content} components={mdxComponents} />
        </div>

        {pdfPath && (
          <div className="mt-10">
            <Link href={pdfPath} className="aol-btn" rel="noopener">
              Download PDF
            </Link>
          </div>
        )}
      </main>
    </Layout>
  );
}