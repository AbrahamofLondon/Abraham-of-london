// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getAllPosts } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

type HomeProps = { posts: PostMeta[] };

function Home({ posts }: HomeProps) {
  return (
    <Layout>
      <Head>
        <title>Abraham of London</title>
        <meta
          name="description"
          content="Abraham of London — strategist, father, builder."
        />
      </Head>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-5xl font-bold">Abraham of London</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Strategist, writer, and builder. Dedicated to legacy, fatherhood, and
          principled work.
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
              className="block rounded-lg border p-4 hover:border-amber-400 hover:shadow-md"
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
    </Layout>
  );
}

Home.displayName = "Home";
export default Home;

export function getStaticProps() {
  const posts = getAllPosts();
  return { props: { posts } };
}
