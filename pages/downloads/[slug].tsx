// pages/downloads/[slug].tsx (FINAL ROBUST VERSION)
import type { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import * as React from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

import Layout from "@/components/Layout";
import mdxComponents from '@/components/mdx-components';
import { getAllContent, getContentBySlug } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post"; // Using PostMeta as it matches

type DownloadMeta = PostMeta & { pdfPath?: string | null };
type Props = { meta: DownloadMeta; content: MDXRemoteSerializeResult };

// ----------------------------------------------------------------------
// 1. getStaticProps (Data Coercion and MDX Serialization)
// ----------------------------------------------------------------------
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const slug = String(params?.slug || "");
    const { content, ...data } = getContentBySlug("downloads", slug, { withContent: true });

    if (!data.title) {
      // If no title, it's not a real page
      return { notFound: true };
    }
    
    // Coerce data to safe types
    const meta: DownloadMeta = {
        slug,
        title: data.title ?? 'Untitled Download',
        date: data.date ?? null,
        excerpt: data.excerpt ?? null,
        coverImage: data.coverImage ?? null,
        pdfPath: (data as any).pdfPath ?? null,
        author: data.author ?? "Abraham of London",
        readTime: data.readTime ?? null,
        category: data.category ?? null,
        tags: Array.isArray(data.tags) ? data.tags : null,
        coverAspect: data.coverAspect ?? null,
        coverFit: data.coverFit ?? null,
        coverPosition: data.coverPosition ?? null,
    };

    const mdx = await serialize(content || "", {
        parseFrontmatter: false,
        scope: meta,
        mdxOptions: { remarkPlugins: [remarkGfm] },
    });

    return { 
      props: JSON.parse(JSON.stringify({ meta, content: mdx })), 
      revalidate: 3600 // Revalidate every hour
    };
};

// ----------------------------------------------------------------------
// 2. getStaticPaths (Required for SSG)
// ----------------------------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
    const slugs = getAllContent("downloads").map(item => item.slug.toLowerCase());
    return { 
      paths: slugs.map((slug) => ({ params: { slug } })), 
      // ✅ FIX: Use 'blocking' to fix 404s
      fallback: "blocking" 
    };
};

// ----------------------------------------------------------------------
// 3. COMPONENT (Defensive Rendering)
// ----------------------------------------------------------------------
export default function DownloadPage({ meta, content }: Props) {
    const {
        title, date, excerpt, coverImage, author, readTime, category, pdfPath
    } = meta;

    const formattedDate = date ? format(new Date(date), "MMMM d, yyyy") : "";
    const authorName = String(author || "Abraham of London");

    return (
        <Layout pageTitle={title}>
            <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
                
                {coverImage && (
                    <div className="mb-6 overflow-hidden rounded-xl border border-lightGrey shadow-card aspect-[16/9]">
                        <Image
                            src={String(coverImage)}
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
                    <MDXRemote {...content} components={mdxComponents} />
                </div>

                {pdfPath && (
                    <div className="mt-10">
                        <a href={String(pdfPath)} className="aol-btn" download rel="noopener">
                            Download PDF
                        </a>
                    </div>
                )}
            </main>
        </Layout>
    );
}/div>
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
                    
                    {/* Category Chip */}
                    {category && (
                        <span className="ml-2 inline-block rounded border border-lightGrey bg-warmWhite px-2 py-0.5 text-xs">
                            {category}
                        </span>
                    )}
                </div>

                <div className="prose prose-lg max-w-none text-deepCharcoal">
                    <MDXRemote {...content} components={mdxComponents} />
                </div>

                {/* Download Button */}
                {pdfPath && (
                    <div className="mt-10">
                        <Link href={String(pdfPath)} className="aol-btn" rel="noopener">
                            Download PDF
                        </Link>
                    </div>
                )}
            </main>
        </Layout>
    );
}