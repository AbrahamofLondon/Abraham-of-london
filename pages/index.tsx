// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getAllPosts } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";
import StickyCTA from "@/components/StickyCTA";
import siteConfig from "@/config/site";

type HomeProps = { posts: PostMeta[] };

function Home({ posts }: HomeProps) {
  // Safe fallbacks so missing config values never crash build
  const siteTitle = siteConfig?.title ?? "Abraham of London";
  const siteDescription =
    siteConfig?.description ?? "Abraham of London — strategist, father, builder.";
  const siteUrl = siteConfig?.url ?? "https://abrahamoflondon.org";
  const socialImage =
    siteConfig?.socialImage ?? `${siteUrl}/assets/images/social/og-image.jpg`;

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />

        {/* Open Graph */}
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={socialImage} />
        <meta property="og:image:alt" content={siteTitle} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={socialImage} />
        <link rel="canonical" href={siteUrl} />
      </Head>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-5xl font-bold">Abraham of London</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Strategist, writer, and builder. Dedicated to legacy, fatherhood, and principled work.
        </p>
      </section>

      {/* Blog */}
      <section className="px-6 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Latest Posts</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-lg border p-4 transition-all hover:border-amber-400 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold">{post.title}</h3>
              {post.excerpt && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {post.excerpt}
                </p>
              )}
              <div className="mt-3 text-xs text-gray-500">
                {post.date && (
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString()}
                  </time>
                )}
                {post.readTime && <> · {post.readTime}</>}
                {post.category && <> · {post.category}</>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Sticky mini-CTA */}
      <StickyCTA
        showAfter={480}
        phoneHref="tel:+442086225909"
        phoneLabel="Call Abraham"
        primaryHref="/contact"
        primaryLabel="Work With Me"
        secondaryHref="/newsletter"
        secondaryLabel="Subscribe"
      />
    </Layout>
  );
}

Home.displayName = "Home";
export default Home;

// Build-time data
export async function getStaticProps() {
  // getAllPosts() already normalizes optional fields; safe to return directly
  const posts = getAllPosts();
  return { props: { posts } };
}
