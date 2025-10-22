// pages/downloads/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import * as React from "react";

import Layout from "@/components/Layout";
import MDXProviderWrapper from "@/components/MDXProviderWrapper";
import components from "@/components/MdxComponents"; // Correctly imported as 'components'
import SEOHead from "@/components/SEOHead";
import { absUrl } from "@/lib/siteConfig";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content", "downloads");

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
};

type Props = { meta: DownloadMeta; content: MDXRemoteSerializeResult };

function getDownloadSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

function getDownloadBySlug(slug: string) {
  const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { data, content };
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getDownloadSlugs();
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const { data, content } = getDownloadBySlug(slug);

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

  const mdx = await serialize(content, {
    parseFrontmatter: false,
    scope: meta,
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [] },
  });

  return { props: { meta, content: mdx }, revalidate: 120 };
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
  const coverForMeta = absUrl(coverImage || "/assets/images/social/og-image.jpg");
  const authorName = typeof author === "string" ? author : "Abraham of London";

  return (
    <Layout pageTitle={title}>
      <SEOHead
        title={title}
        description={excerpt ?? ""}
        slug={`/downloads/${slug}`}
        coverImage={coverForMeta}
        publishedTime={date ?? undefined}
        modifiedTime={date ?? undefined}
        authorName={authorName}
        tags={tags ?? []}
      />

      <MDXProviderWrapper>
        <article className="mx-auto max-w-3xl px-4 py-10 md:py-16">
          {coverImage && (
            <div className="mb-6 overflow-hidden rounded-xl border border-lightGrey shadow-card">
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

          <h1 className="mb-4 font-serif text-4xl text-forest md:text-5xl">{title}</h1>

          <div className="mb-6 text-sm text-[color:var(--color-on-secondary)/0.7]">
            <span>By {authorName}</span>
            {date && (
              <>
                {" "}? <time dateTime={date}>{formattedDate}</time>
              </>
            )}
            {readTime && <> ? {readTime}</>}
            {category && (
              <span className="ml-2 inline-block rounded border border-lightGrey bg-warmWhite px-2 py-0.5 text-xs">
                {category}
              </span>
            )}
          </div>

          <div className="prose prose-lg max-w-none text-deepCharcoal">
            <MDXRemote {...content} components={components} />
          </div>

          {pdfPath && (
            <div className="mt-10">
              <Link href={pdfPath} className="aol-btn" rel="noopener">
                Download PDF
              </Link>
            </div>
          )}
        </article>
      </MDXProviderWrapper>
    </Layout>
  );
}
