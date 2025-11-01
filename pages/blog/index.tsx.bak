import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import Head from "next/head";
import { GetStaticProps, NextPage } from "next"; // 💡 UPGRADE: Import NextPage and GetStaticProps types

// 💡 UPGRADE: Use null | string instead of string | undefined for consistency with usage
type PostMeta = {
  title: string;
  date: string | null;      // Date should be string or null for sorting/display
  excerpt: string | null;
  coverImage: string | null;
  slug: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

// --- [ GetStaticProps: Data Fetching ] ---

// 💡 UPGRADE: Use the correct type signature for GetStaticProps
export const getStaticProps: GetStaticProps<{ posts: PostMeta[] }> = async () => {
  // 💡 UPGRADE: Use error handling for directory read
  let files: string[] = [];
  try {
    if (fs.existsSync(BLOG_DIR)) {
      files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
    }
  } catch (error) {
    console.error("Error reading blog directory:", error);
    // If there's an error, we return an empty array gracefully
  }

  const posts: PostMeta[] = files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      
      // CRITICAL: Ensure robust file reading
      try {
        const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
        const { data } = matter(raw);
        
        // 💡 UPGRADE: Type conversions are safer and adhere to the PostMeta definition
        const dateValue = data.date 
            ? (data.date instanceof Date ? data.date.toISOString() : String(data.date)) 
            : null;

        return {
          // Fallback to slug if title is missing
          title: String(data.title ?? slug),
          
          // 💡 UPGRADE: Explicitly map null if the property is missing
          date: dateValue,
          excerpt: data.excerpt ? String(data.excerpt) : null,
          coverImage: data.coverImage ? String(data.coverImage) : null,
          slug,
        };
      } catch (e) {
        console.error(`Failed to process MDX file: ${filename}`, e);
        // Return a null object or throw to filter out bad posts later
        return null;
      }
    })
    .filter((post): post is PostMeta => post !== null) // Filter out any failed posts
    .sort((a, b) => {
        // 💡 CRITICAL FIX: Robust date sorting logic, ensuring null dates are handled
        const dateA = a.date ? +new Date(a.date) : 0;
        const dateB = b.date ? +new Date(b.date) : 0;
        
        return dateB - dateA; // Sort descending (newest first)
    });

  return { 
    props: { posts },
    revalidate: 60, // 💡 UPGRADE: Recommended to add revalidate for blog content
  };
}

// --- [ Component Rendering ] ---

type Props = { posts: PostMeta[] };

// 💡 UPGRADE: Use NextPage type
const BlogIndex: NextPage<Props> = ({ posts }) => {
  return (
    <>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta name="robots" content="index,follow" />
        <meta name="description" content="Thoughts, essays, and resources on leadership, faith, and strategy." />
      </Head>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-4xl font-extrabold tracking-tight">Blog</h1>
        {posts.length === 0 ? (
          <p className="text-lg text-neutral-500">No posts yet. Check back soon for new content!</p>
        ) : (
          <ul className="space-y-8">
            {posts.map((p) => (
              <li key={p.slug} className="group border-b pb-8"> {/* 💡 UPGRADE: Added border/spacing */}
                <h2 className="text-3xl font-bold transition-colors duration-200">
                  <Link href={`/blog/${p.slug}`} className="hover:text-blue-600"> {/* 💡 UPGRADE: Added hover color */}
                    {p.title}
                  </Link>
                </h2>
                {p.date && (
                  <time 
                    dateTime={p.date} // 💡 UPGRADE: Use <time> and dateTime for semantics
                    className="mt-2 block text-sm text-neutral-600 dark:text-neutral-300"
                  >
                    {/* 💡 UPGRADE: Formatting for robust date handling */}
                    {new Date(p.date).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
                {p.excerpt && <p className="mt-3 text-lg text-neutral-700 dark:text-neutral-400">{p.excerpt}</p>}
                
                {/* 💡 UPGRADE: Added 'Read More' link */}
                <Link 
                    href={`/blog/${p.slug}`} 
                    className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                >
                    Read Post &rarr;
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

export default BlogIndex;