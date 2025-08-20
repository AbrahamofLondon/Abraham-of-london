// pages/blog/[slug].tsx
import Head from "next/head";
import Image from "next/image";
import type { GetStaticProps, GetStaticPaths } from "next";
import { format } from "date-fns";

import Layout from "@/components/Layout";
import MDXComponents from "@/components/MDXComponents";
import MDXProviderWrapper from "@/components/MDXProviderWrapper";

import { absUrl } from "@/lib/siteConfig";
import { getAllPosts, getPostBySlug, type PostMeta } from "@/lib/posts";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

type PageMeta = {
  slug: string;
  title: string;
  date: string | null;
  excerpt: string | null;
  coverImage: string | null;
  author: string | null;
  readTime: string | null;
  category: string | null;
};

type Props = {
  post: {
    meta: PageMeta;
    content: MDXRemoteSerializeResult;
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");

  const raw = getPostBySlug(slug, [
    "slug",
    "title",
    "date",
    "publishedAt",
    "excerpt",
    "coverImage",
    "author",
    "readTime",
    "category",
    "content",
  ]) as Partial<PostMeta> & { content?: string };

  if (!raw.slug || raw.title === "Post Not Found") {
    return { notFound: true };
  }

  const meta: PageMeta = {
    slug: raw.slug!,
    title: raw.title || "Untitled",
    date: (raw.date || raw.publishedAt || null) as string | null,
    excerpt: raw.excerpt ?? null,
    coverImage: (raw.coverImage as string | undefined) ?? null,
    author: raw.author ?? "Abraham of London",
    readTime: raw.readTime ?? null,
    category: raw.category ?? null,
  };

  const mdx = await serialize(raw.content ?? "", {
    parseFrontmatter: false,
    scope: meta,
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [],
    },
  });

  return {
    props: {
      post: { meta, content: mdx },
    },
    revalidate: 60,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts(["slug"]);
  return {
    paths: posts.map((p) => ({ params: { slug: String(p.slug) } })),
    fallback: "blocking",
  };
};

export default function BlogPost({ post }: Props) {
  const { slug, title, date, excerpt, coverImage, author, readTime, category } =
    post.meta;

  const formattedDate = date ? format(new Date(date), "MMMM d, yyyy") : "";

  // Open Graph/JSON-LD
  const cover = coverImage ? absUrl(coverImage) : absUrl("/assets/images/social/og-image.jpg");
  const canonical = absUrl(`/blog/${slug}`);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    image: [cover],
    datePublished: date || undefined,
    dateModified: date || undefined,
    author: { "@type": "Person", name: author || "Abraham of London" },
    publisher: {
      "@type": "Organization",
      name: "Abraham of London",
      logo: {
        "@type": "ImageObject",
        url: absUrl("/assets/images/logo/abraham-of-london-logo.svg"),
      },
    },
    description: excerpt || "",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };

  return (
    <Layout pageTitle={title}>
      <Head>
        <title>{title} | Abraham of London</title>
        {excerpt && <meta name="description" content={excerpt} />}
        <link rel="canonical" href={canonical} />

        <meta property="og:title" content={title} />
        {excerpt && <meta property="og:description" content={excerpt} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={cover} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {excerpt && <meta name="twitter:description" content={excerpt} />}
        <meta name="twitter:image" content={cover} />

        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <MDXProviderWrapper>
        <article className="mx-auto max-w-3xl px-4 py-10 md:py-16">
          {coverImage && (
            <div className="relative mb-10 h-72 w-full overflow-hidden rounded-lg shadow-lg md:h-96">
              <Image src={cover} alt={title} fill className="object-cover" priority />
            </div>
          )}

          <h1 className="mb-4 font-serif text-4xl text-forest md:text-5xl">
            {title}
          </h1>

          <div className="mb-6 text-sm text-deepCharcoal/70">
            <span>By {author || "Abraham of London"}</span>
            {formattedDate && <> · <time dateTime={date!}>{formattedDate}</time></>}
            {readTime && <> · {readTime}</>}
            {category && (
              <span className="ml-2 inline-block rounded border border-lightGrey bg-warmWhite px-2 py-0.5 text-xs">
                {category}
              </span>
            )}
          </div>

          <div className="prose prose-lg max-w-none text-deepCharcoal">
            <MDXRemote {...post.content} components={MDXComponents} />
          </div>
        </article>
      </MDXProviderWrapper>
    </Layout>
  );
}
