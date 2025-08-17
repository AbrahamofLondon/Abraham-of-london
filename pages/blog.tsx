// pages/blog.tsx
import React from "react";
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/posts";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string; // Remove the optional operator since we'll always provide a fallback
  author?: string; // Add author field for SEO compatibility
}

interface BlogProps {
  posts: BlogPost[];
}

const Blog: React.FC<BlogProps> = ({ posts }) => {
  return (
    <>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta name="description" content="Insights, reflections, and writings from Abraham of London." />
      </Head>
      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <div key={post.slug} className="border rounded-2xl shadow-md overflow-hidden bg-white">
              <Image
                src={post.coverImage}
                alt={post.title}
                width={800}
                height={500}
                className="w-full h-56 object-cover"
              />
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-sm text-gray-500 mb-4">{post.date}</p>
                <p className="text-gray-700 mb-4">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read more →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps<BlogProps> = async () => {
  const rawPosts = getAllPosts([
    "slug",
    "title",
    "date",
    "publishedAt",
    "excerpt",
    "coverImage",
    "author",
  ]);

  // Clean and filter posts safely
  const posts: BlogPost[] = rawPosts
    .filter((p) => typeof p.slug === "string" && p.slug.trim() !== "")
    .map((p) => ({
      slug: (p.slug ?? "").trim(),
      title: p.title?.trim() || "Untitled",
      date: p.date || p.publishedAt || "",
      excerpt: p.excerpt?.trim() || "Read more for full details.",
      coverImage: p.coverImage || "/assets/images/og-image.jpg", // Always provide a fallback
      author: p.author || "Abraham Adaramola", // Add author with fallback
    }));

  return {
    props: { posts },
  };
};

export default Blog;






