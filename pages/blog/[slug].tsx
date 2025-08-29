import Head from "next/head";
import dynamic from "next/dynamic";
import type { GetStaticProps, GetStaticPaths } from "next";
import { format } from "date-fns";

import Layout from "@/components/Layout";
import MDXComponents from "@/components/MDXComponents";
import MDXProviderWrapper from "@/components/MDXProviderWrapper";
import PostHero from "@/components/PostHero";

import { absUrl } from "@/lib/siteConfig";
import { getPostSlugs, getPostBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

const Comments = dynamic(() => import("@/components/Comments"), { ssr: false });

type PageMeta = Omit<PostMeta, "tags"> & { slug: string };

type Props = {
  post: {
    meta: PageMeta;
    content: MDXRemoteSerializeResult;
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const raw = getPostBySlug(slug, { withContent: true });

  if (!raw.slug || !raw.title) return { notFound: true };

  const meta: PageMeta = {
    slug: raw.slug!,
    title: raw.title!,
    date: (raw.date as string) ?? null,
    excerpt: (raw.excerpt as string) ?? null,
    coverImage: (raw.coverImage as string) ?? null,
    author: (raw.author as any) ?? "Abraham of London",
    readTime: (raw.readTime as string) ?? null,
    category: (raw.category as string) ?? null,
    coverAspect: (raw.coverAspect as any) ?? null,
    coverFit: (raw.coverFit as any) ?? null,
    coverPosition: (raw.coverPosition as any) ?? null,
  };

  const mdx = await serialize(raw.content ?? "", {
    parseFrontmatter: false,
    scope: meta,
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [] },
  });

  return { props: { post: { meta, content: mdx } }, revalidate: 60 };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getPostSlugs();
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: "blocking" };
};

export default function BlogPost({ post }: Props) {
  const { slug, title, date, excerpt, coverImage, author, readTime, category,
          coverAspect, coverFit, coverPosition } = post.meta;

  const formattedDate = date ? format(new Date(date), "MMMM d, yyyy") : "";
  const coverForMeta = coverImage ? absUrl(coverImage) : absUrl("/assets/images/social/og-image.jpg");
  const canonical = absUrl(`/blog/${slug}`);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    image: [coverForMeta],
    datePublished: date || null,
    dateModified: date || null,
    author: { "@type": "Person", name: (typeof author === "string" ? author : author?.name) || "Abraham of London" },
    publisher: {
      "@type": "Organization",
      name: "Abraham of London",
      logo: { "@type": "ImageObject", url: absUrl("/assets/images/logo/abraham-of-london-logo.svg") },
    },
    description: excerpt || null,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };

  const authorName = typeof author === "string" ? author : author?.name || "Abraham of London";

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
        <meta property="og:image" content={coverForMeta} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {excerpt && <meta name="twitter:description" content={excerpt} />}
        <meta name="twitter:image" content={coverForMeta} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <MDXProviderWrapper>
        <article className="mx-auto max-w-3xl px-4 py-10 md:py-16">
          <PostHero
            title={title}
            coverImage={coverImage ?? undefined}
            coverAspect={coverAspect as any}
            coverFit={coverFit as any}
            coverPosition={coverPosition as any}
          />

          <h1 className="mb-4 font-serif text-4xl text-forest md:text-5xl">{title}</h1>

          <div className="mb-6 text-sm text-deepCharcoal/70">
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
            <MDXRemote {...post.content} components={MDXComponents} />
          </div>

          <div className="mt-12">
            <a href="#comments" className="luxury-link text-sm">Join the discussion ↓</a>
          </div>

          <section id="comments" className="mt-16">
            <Comments repo="AbrahamofLondon/abrahamoflondon-comments" issueTerm="pathname" useClassDarkMode />
          </section>
        </article>
      </MDXProviderWrapper>
    </Layout>
  );
}
