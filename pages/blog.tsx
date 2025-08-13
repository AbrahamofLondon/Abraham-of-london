// pages/blog.tsx
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getAllPosts } from "../lib/posts";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

interface BlogPageProps {
  posts: BlogPost[];
}

export default function BlogPage({ posts }: BlogPageProps) {
  return (
    <>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta
          name="description"
          content="Read articles, essays, and updates from Abraham of London."
        />
      </Head>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Blog</h1>
        {posts.length === 0 && <p>No posts available.</p>}
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug} className="border-b pb-4">
              <Link href={`/posts/${post.slug}`}>
                <h2 className="text-xl font-semibold hover:underline">
                  {post.title}
                </h2>
              </Link>
              <p className="text-gray-500 text-sm">{post.date}</p>
              <p className="mt-2">{post.excerpt}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<BlogPageProps> = async () => {
  const allPosts = getAllPosts([
    "slug",
    "title",
    "date",
    "publishedAt",
    "excerpt",
  ]);

  const posts: BlogPost[] = allPosts
    .filter(
      (p): p is typeof p & { slug: string } =>
        typeof p.slug === "string" && p.slug.trim() !== ""
    )
    .map((p) => ({
      slug: p.slug.trim(),
      title: p.title?.trim() || "Untitled",
      date: p.date || p.publishedAt || "",
      excerpt: p.excerpt?.trim() || "Read more for full details.",
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    props: { posts },
  };
};
