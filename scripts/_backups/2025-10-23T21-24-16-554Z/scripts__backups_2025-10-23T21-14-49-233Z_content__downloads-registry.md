// pages/blog/[slug].tsx

import dynamic from "next/dynamic";
import type { GetStaticPaths, GetStaticProps } from "next";
import { format } from "date-fns";
import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import * as React from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import { MDXComponents } from "@/components/MDXComponents";
import MDXProviderWrapper from "@/components/MDXProviderWrapper";
import PostHero from "@/components/PostHero";
import SEOHead from "@/components/SEOHead";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";

import BrandFrame from "@/components/print/BrandFrame";

import { absUrl } from "@/lib/siteConfig";

// Dynamically import the Comments component (e.g., Giscus)
const Comments = dynamic(() => import('@giscus/react'), { ssr: false });


type PageMeta = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "left" | "center" | "right";
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  socialCaption?: string;
  draft?: boolean;
};

type Props = {
  post: {
    meta: PageMeta;
    content: MDXRemoteSerializeResult;
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const postsDir = path.join(process.cwd(), "content/blog");
  const filePath = path.join(postsDir, `${slug}.mdx`);

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data: frontMatter, content } = matter(fileContent);

    // FIX 1: Add a runtime check and safe fallback for required string fields (slug and title)
    const slug = String(frontMatter.slug || "").trim();
    const title = String(frontMatter.title || "").trim();

    if (!title || !slug) {
      return { notFound: true };
    }

    const meta: PageMeta = {
      // Use the safely casted and checked slug and title
      slug: slug, // FIX APPLIED HERE
      title: title, // FIX APPLIED HERE
      date: frontMatter.date ?? undefined,
      excerpt: frontMatter.excerpt ?? undefined,
      coverImage: frontMatter.coverImage ?? undefined,
      author: frontMatter.author ?? "Abraham of London",
      readTime: frontMatter.readTime ?? undefined,
      category: frontMatter.category ?? undefined,
      tags: frontMatter.tags ?? undefined,
      coverAspect: frontMatter.coverAspect ?? undefined,
      coverFit: frontMatter.coverFit ?? undefined,
      coverPosition: frontMatter.coverPosition ?? undefined,
      description: frontMatter.description ?? undefined,
      ogTitle: frontMatter.ogTitle ?? undefined,
      ogDescription: frontMatter.ogDescription ?? undefined,
      socialCaption: frontMatter.socialCaption ?? undefined,
      draft: frontMatter.draft ?? false,
    };

    const mdx = await serialize(content, {
      scope: meta,
      mdxOptions: {
        remarkPlugins: [],
        rehypePlugins: [],
        format: "mdx",
      },
    });

    return { props: { post: { meta, content: mdx } }, revalidate: 60 };
  } catch (error) {
    console.error(`Error processing ${slug}.mdx:`, error);
    return { notFound: true };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  const postsDir = path.join(process.cwd(), "content/blog");
  const filenames = await fs.readdir(postsDir);
  const paths = filenames
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => ({
      params: { slug: file.replace(/\.mdx$/, "") },
    }));

  return { paths, fallback: "blocking" };
};

export default function BlogPost({ post }: Props) {
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
    coverAspect,
    coverFit,
    coverPosition,
    description,
    ogTitle,
    ogDescription,
    draft,
  } = post.meta;

  if (draft) {
    return <Layout pageTitle="Draft Post">This post is a draft and not publicly available.</Layout>;
  }

  const formattedDate = date ? format(new Date(date), "MMMM d, yyyy") : "";
  const coverForMeta = coverImage
    ? absUrl(coverImage)
    : absUrl("/assets/images/social/og-image.jpg");
  const authorName = author || "Abraham of London";

  const isFatherhood =
    category === "Fatherhood" ||
    (Array.isArray(tags) && tags.map((t) => t.toLowerCase()).includes("fatherhood"));

  return (
    <Layout pageTitle={title} hideSocialStrip hideCTA>
      <SEOHead
        title={ogTitle || title}
        description={description || excerpt || ""}
        slug={`/blog/${slug}`}
        coverImage={coverForMeta}
        publishedTime={date}
        modifiedTime={date}
        authorName={authorName}
        tags={tags || []}
      />

      <MDXProviderWrapper>
        <article className="mx-auto max-w-3xl px-4 py-10 md:py-16">
          <PostHero
            slug={slug}
            title={title}
            coverImage={coverImage}
            coverAspect={coverAspect}
            coverFit={coverFit}
            coverPosition={coverPosition}
          />

          <h1 className="sr-only">{title}</h1>

          <div className="mb-6 text-sm text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.75]">
            <span>By {authorName}</span>
            {date && (
              <>
                {" "}time dateTime={date}>{formattedDate}</time>
              </>
            )}
            {readTime && <> readTime}</>}
            {category && (
              <span className="ml-2 inline-block rounded border border-lightGrey bg-warmWhite px-2 py-0.5 text-xs">
                {category}
              </span>
            )}
          </div>

          <div className="prose md:prose-lg max-w-none text-deepCharcoal dark:prose-invert">
            <MDXRemote {...post.content} components={{ ...MDXComponents, ResourcesCTA, BrandFrame }} />
          </div>

          {isFatherhood && <ResourcesCTA className="mt-12" />}

          <div className="mt-12">
            <a href="#comments" className="luxury-link text-sm">
              Join the discussion a>
          </div>

          <section id="comments" className="mt-16">
            <Comments
              repo="AbrahamofLondon/abrahamoflondon-comments"
              issueTerm="pathname"
              useClassDarkMode
            />
          </section>
        </article>
      </MDXProviderWrapper>
    </Layout>
  );
}



