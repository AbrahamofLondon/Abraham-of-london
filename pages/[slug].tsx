// pages/[slug].tsx
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Image from "next/image";
import Layout from "@/components/Layout";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import {
  getAllPostsMeta,
  getPostBySlug,
  type PostWithContent,
} from "@/lib/server/posts-data";
import * as mdxComponents from "@/components/mdx-components";

type BlogPageProps = {
  post: {
    slug: string;
    title: string;
    date: string | null;
    excerpt: string | null;
    coverImage: string | null;
    tags: string[] | null;
  };
  mdxSource: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPostsMeta();
  const paths = posts
    .filter((p) => p.slug && String(p.slug).trim().length > 0)
    .map((p) => ({
      params: { slug: String(p.slug) },
    }));

  return {
    paths,
    fallback: false, // all valid slugs are known at build time
  };
};

export const getStaticProps: GetStaticProps<BlogPageProps> = async (ctx) => {
  const slugParam = ctx.params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (!slug) return { notFound: true };

  const doc: PostWithContent | null = getPostBySlug(String(slug));
  if (!doc) return { notFound: true };

  const mdxSource = await serialize(doc.content);

  return {
    props: {
      post: {
        slug: doc.slug,
        title: (doc.title as string) ?? "",
        date: doc.date ?? null,
        excerpt: (doc.excerpt as string) ?? null,
        coverImage: (doc.coverImage as string) ?? null,
        tags: (doc.tags as string[] | null) ?? null,
      },
      mdxSource,
    },
  };
};

export default function BlogPostPage({
  post,
  mdxSource,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const pageTitle = post.title || "Article";

  const displayDate =
    post.date && new Date(post.date).toString() !== "Invalid Date"
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(post.date))
      : null;

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        {post.excerpt && (
          <meta name="description" content={post.excerpt} />
        )}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {post.coverImage && (
          <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl border border-lightGrey bg-black/5">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 960px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Blog
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-deepCharcoal sm:text-4xl">
            {post.title}
          </h1>

          {(displayDate || (post.tags && post.tags.length)) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              {displayDate && (
                <span>
                  <span aria-hidden>📅 </span>
                  {displayDate}
                </span>
              )}
              {post.tags && post.tags.length > 0 && (
                <>
                  <span aria-hidden>•</span>
                  <span>
                    {post.tags.map((tag, i) => (
                      <span key={tag}>
                        {i > 0 && ", "}
                        {tag}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </div>
          )}
        </header>

        <article className="prose prose-sm max-w-none text-gray-800 prose-headings:font-serif prose-a:text-forest">
          <MDXRemote {...mdxSource} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
}