// pages/downloads/[slug].tsx (ABSOLUTE FINAL ROBUST VERSION)
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
import mdxComponents from '@/components/mdx-components'; // Corrected casing import
import { getAllContent, getContentBySlug } from "@/lib/mdx"; // Unified server functions

// --- Data Type Definitions (Ensuring null safety) ---
const CONTENT_TYPE = "downloads";

type DownloadMeta = {
    slug: string;
    title: string;
    // CRITICAL: Ensure all optional properties allow null
    date: string | null; 
    excerpt: string | null;
    coverImage: string | null;
    pdfPath: string | null;
    author: string | null;
    readTime: string | null;
    category: string | null;
    tags: string[] | null;
    coverAspect: "book" | "wide" | "square" | null;
    coverFit: "cover" | "contain" | null;
    coverPosition: "left" | "center" | "right" | null;
};

type Props = { meta: DownloadMeta; content: MDXRemoteSerializeResult };

// ----------------------------------------------------------------------
// 1. CRITICAL FIX: getStaticProps (Data Coercion and MDX Serialization)
// ----------------------------------------------------------------------
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const slug = String(params?.slug || "");
    
    // Fetch content; relies on lib/mdx.ts to perform robust file reading and null coalescing
    const { content, ...data } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });
    
    // CRITICAL SAFETY CHECK: Ensure data is clean and coercing occurs
    const meta: DownloadMeta = {
        slug,
        title: (data as any).title || slug,
        
        // FIX: Explicitly map potentially complex/optional fields, coercing undefined to null/string
        date: (data as any).date ?? null,
        excerpt: (data as any).excerpt ?? null,
        coverImage: (data as any).coverImage ?? null,
        pdfPath: (data as any).pdfPath ?? null,
        author: (data as any).author ?? "Abraham of London", // Guaranteed string fallback for rendering
        readTime: (data as any).readTime ?? null,
        category: (data as any).category ?? null,
        tags: Array.isArray((data as any).tags) ? (data as any).tags : null,
        
        // Ensure complex union types are correctly assigned or null
        coverAspect: (data as any).coverAspect ?? null,
        coverFit: (data as any).coverFit ?? null,
        coverPosition: (data as any).coverPosition ?? null,
    };

    const mdx = await serialize(content || "", {
        parseFrontmatter: false,
        scope: meta, // Pass cleaned meta to MDX scope
        mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [] },
    });

    // CRITICAL: Ensure props are fully JSON-safe before returning
    return { props: JSON.parse(JSON.stringify({ meta, content: mdx })), revalidate: 120 };
};

// ----------------------------------------------------------------------
// 2. CRITICAL FIX: getStaticPaths (Required for SSG)
// ----------------------------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
    // Use unified getAllContent, ensuring slugs are lowercased for path matching
    const slugs = getAllContent(CONTENT_TYPE).map(item => item.slug.toLowerCase());
    return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: "blocking" };
};

// ----------------------------------------------------------------------
// 3. COMPONENT (Defensive Rendering)
// ----------------------------------------------------------------------
export default function DownloadPage({ meta, content }: Props) {
    const {
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

    // ROBUSTNESS: Ensure date is safe for formatting
    const formattedDate = date ? format(new Date(date), "MMMM d, yyyy") : "";
    
    // ROBUSTNESS: Ensure author is a simple string for rendering
    const authorName = String(author || "Abraham of London");

    return (
        <Layout pageTitle={title}>
            <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
                
                {/* Image Rendering: Uses defensive casting */}
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