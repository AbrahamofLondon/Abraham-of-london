import Head from "next/head";
import Image from "next/image";
import type { GetStaticProps, GetStaticPaths } from "next";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { absUrl } from "@/lib/siteConfig";
import { getAllPosts, getPostBySlug, type PostMeta } from "@/lib/posts";
import { generatedCover } from "@/lib/og";
import Layout from "@/components/Layout";
import MDXProviderWrapper from "@/components/MDXProviderWrapper";
import { MDXComponents } from "@/components/MDXComponents";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

// Dynamic imports
const MDXRemote = dynamic(() => import("next-mdx-remote").then((m) => m.MDXRemote), {
  ssr: true,
});

// Types
type PageMeta = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readTime: string;
  category: string;
};

type Props = {
  post: {
    meta: PageMeta;
    content: MDXRemoteSerializeResult;
  };
};

// Data Fetching
/**
 * Fetches the post content and metadata for a given slug.
 * @param {object} context - The context object from Next.js.
 * @returns {Promise<GetStaticPropsResult<Props>>} The props for the page.
 */
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

  // Refined meta object with robust fallbacks
  const meta: PageMeta = {
    slug: raw.slug,
    title: raw.title || "Untitled",
    date: (raw.date || raw.publishedAt || "") as string,
    excerpt: raw.excerpt || "Discover insights and wisdom in this compelling read.",
    // Use the centralized generatedCover function for a consistent fallback strategy
    coverImage: raw.coverImage ? raw.coverImage : generatedCover(raw.slug, raw.title),
    author: raw.author || "Abraham of London",
    readTime: raw.readTime || "5 min read",
    category: raw.category || "Insights",
  };

  // ESM-safe dynamic imports for the serializer + plugins
  const { serialize } = await import("next-mdx-remote/serialize");
  const remarkGfm = (await import("remark-gfm")).default;

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

/**
 * Specifies the static paths for all blog posts.
 * @returns {Promise<GetStaticPathsResult>} The paths object.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts(["slug"]);
  return {
    paths: posts.map((p) => ({ params: { slug: String(p.slug) } })),
    fallback: "blocking",
  };
};

// Component
export default function BlogPost({ post }: Props) {
  // Extract meta data for cleaner JSX
  const { slug, title, date, excerpt, coverImage, author, readTime, category } = post.meta;
  const formattedDate = date ? format(new Date(date), "MMMM d, yyyy") : "";

  // Structured Data (JSON-LD) for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    image: [absUrl(coverImage)],
    datePublished: date,
    dateModified: date,
    author: { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: "Abraham of London",
      logo: { "@type": "ImageObject", url: absUrl("/assets/images/logo/abraham-of-london-logo.svg") },
    },
    description: excerpt,
    mainEntityOfPage: { "@type": "WebPage", "@id": absUrl(`/blog/${slug}`) },
  };

  return (
    <Layout>
      <Head>
        {/* Basic SEO */}
        <title>{title} | Abraham of London</title>
        <meta name="description" content={excerpt} />
        <link rel="canonical" href={absUrl(`/blog/${slug}`)} />

        {/* Open Graph & Twitter for social sharing */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={absUrl(`/blog/${slug}`)} />
        <meta property="og:image" content={absUrl(coverImage)} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={excerpt} />
        <meta name="twitter:image" content={absUrl(coverImage)} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <MDXProviderWrapper>
        <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
          {coverImage && (
            <div className="mb-8 md:mb-16 relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={absUrl(coverImage)}
                alt={title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <h1 className="font-serif text-5xl md:text-6xl tracking-brand text-forest mb-6">
            {title}
          </h1>

          <div className="text-sm text-deepCharcoal/70 mb-4">
            <span>By {author}</span> &middot; <span>{formattedDate}</span>
            {readTime && <span> &middot; {readTime}</span>}
            {category && (
              <span className="ml-2 inline-block text-xs rounded bg-warmWhite border border-lightGrey px-2 py-1">
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
