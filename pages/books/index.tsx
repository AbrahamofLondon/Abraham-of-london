// pages/blog/index.tsx
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import Head from "next/head";

type PostMeta = {
  title: string;
  date: string | null; // Corrected for null serialization
  excerpt: string | null; // Corrected for null serialization
  coverImage: string | null; // Corrected for null serialization
  slug: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export async function getStaticProps() {
  // Defensive check for directory existence
  const files = fs.existsSync(BLOG_DIR)
    ? fs.readdirSync(BLOG_DIR).filter(f => f.endsWith(".mdx"))
    : [];

  const posts: PostMeta[] = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
    const { data } = matter(raw);
    return {
      title: String(data.title ?? slug),
      // FINAL FIX: Assign null instead of undefined for all optional properties
      date: data.date ? String(data.date) : null, 
      excerpt: data.excerpt ? String(data.excerpt) : null,
      coverImage: data.coverImage ? String(data.coverImage) : null,
      slug,
    };
  })
  // newest first if date present
  .sort((a, b) => +new Date(b.date ?? 0) - +new Date(a.date ?? 0));

  return { props: { posts } };
}

type Props = { posts: PostMeta[] };

function BlogIndex({ posts }: Props) {
  return (
    <>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-4xl font-extrabold tracking-tight">Blog</h1>
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((p) => (
              <li key={p.slug} className="card">
                <h2 className="text-2xl font-bold">
                  <Link href={`/blog/${p.slug}`} className="hover:underline">
                    {p.title}
                  </Link>
                </h2>
                {p.date && (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {new Date(p.date).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                {p.excerpt && <p className="mt-3">{p.excerpt}</p>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

export default BlogIndex;