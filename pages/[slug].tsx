// pages/[slug].tsx
// Dynamic blog post route – reads MDX from content/posts (or Posts/blog)
// and works both locally (Windows) and on Netlify (Linux).

import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Image from "next/image";
import Layout from "@/components/Layout";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { mdxComponents } from "@/components/mdx-components";

type FrontMatter = {
  type?: string;
  title?: string;
  slug?: string;
  date?: string | Date;
  author?: string;
  excerpt?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  [key: string]: unknown;
};

type PostPageProps = {
  slug: string;
  frontMatter: {
    title: string;
    slug: string;
    date: string | null;
    author: string | null;
    excerpt: string | null;
    readTime: string | null;
    category: string | null;
    tags: string[] | null;
    coverImage: string | null;
  };
  mdxSource: MDXRemoteSerializeResult | null;
  content: string | null;
};

/* -------------------------------------------------------------------------- */
/*  Helpers: robustly locate the posts directory                              */
/* -------------------------------------------------------------------------- */

function resolvePostsDir(): string | null {
  const contentRoot = path.join(process.cwd(), "content");

  const candidates = ["posts", "Posts", "blog", "Blog"];

  for (const dir of candidates) {
    const full = path.join(contentRoot, dir);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      console.log(`[posts] Using directory: ${full}`);
      return full;
    }
  }

  console.warn(
    "[posts] No posts directory found. Checked:",
    candidates.map((d) => path.join(contentRoot, d)).join(", "),
  );
  return null;
}

const POSTS_DIR = resolvePostsDir();

function listPostFiles(): string[] {
  if (!POSTS_DIR || !fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
}

function readFrontMatter(filePath: string): {
  frontMatter: FrontMatter;
  content: string;
} {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    frontMatter: data as FrontMatter,
    content,
  };
}

function effectiveSlugFromFile(fileName: string): string {
  if (!POSTS_DIR) return fileName.replace(/\.mdx?$/, "");
  const fullPath = path.join(POSTS_DIR, fileName);
  const { frontMatter } = readFrontMatter(fullPath);

  const fmSlug =
    typeof frontMatter.slug === "string" && frontMatter.slug.trim().length
      ? frontMatter.slug.trim()
      : null;

  return fmSlug ?? fileName.replace(/\.mdx?$/, "");
}

function findPostFileBySlug(slug: string): string | null {
  if (!POSTS_DIR) return null;
  const files = listPostFiles();
  for (const file of files) {
    const eff = effectiveSlugFromFile(file);
    if (eff === slug) {
      return path.join(POSTS_DIR, file);
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  getStaticPaths                                                            */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  if (!POSTS_DIR) {
    return {
      paths: [],
      fallback: "blocking",
    };
  }

  const files = listPostFiles();

  const paths = files.map((file) => ({
    params: { slug: effectiveSlugFromFile(file) },
  }));

  console.log(
    "[posts] getStaticPaths slugs:",
    paths.map((p) => p.params.slug),
  );

  return {
    paths,
    fallback: "blocking",
  };
};

/* -------------------------------------------------------------------------- */
/*  getStaticProps                                                            */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<PostPageProps> = async (ctx) => {
  try {
    const slugParam = ctx.params?.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam || "";

    if (!slug || !POSTS_DIR) {
      console.warn("[posts] Missing slug or POSTS_DIR");
      return { notFound: true };
    }

    const filePath = findPostFileBySlug(slug);
    if (!filePath) {
      console.warn("[posts] No file found for slug:", slug);
      return { notFound: true };
    }

    const { frontMatter, content } = readFrontMatter(filePath);

    const rawDate = frontMatter.date ?? null;
    const date =
      rawDate instanceof Date
        ? rawDate.toISOString()
        : typeof rawDate === "string"
        ? rawDate
        : null;

    const fm = {
      title: (frontMatter.title ?? slug) as string,
      slug,
      date,
      author: (frontMatter.author as string) ?? null,
      excerpt: (frontMatter.excerpt as string) ?? null,
      readTime: (frontMatter.readTime as string) ?? null,
      category: (frontMatter.category as string) ?? null,
      tags: Array.isArray(frontMatter.tags)
        ? (frontMatter.tags as string[])
        : null,
      coverImage:
        typeof frontMatter.coverImage === "string"
          ? frontMatter.coverImage
          : null,
    };

    let mdxSource: MDXRemoteSerializeResult | null = null;

    if (content && content.trim().length) {
      try {
        mdxSource = await serialize(content, {
          mdxOptions: {
            remarkPlugins: [],
            rehypePlugins: [],
          },
        });
      } catch (err) {
        console.error("[posts] MDX serialize failed for slug:", slug, err);
        // Fall back to raw content rendering
        mdxSource = null;
      }
    }

    return {
      props: {
        slug,
        frontMatter: fm,
        mdxSource,
        content: content || null,
      },
      revalidate: 3600,
    };
  } catch (err) {
    console.error("[posts] getStaticProps crashed:", err);
    // Fail safe – if something unexpected happens, don't kill the whole export
    return { notFound: true };
  }
};

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default function PostPage({
  frontMatter,
  mdxSource,
  content,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const pageTitle = frontMatter.title || "Article";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        {frontMatter.excerpt && (
          <meta name="description" content={frontMatter.excerpt} />
        )}
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {frontMatter.category || "Article"}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-deepCharcoal sm:text-4xl">
            {frontMatter.title}
          </h1>
          {(frontMatter.date || frontMatter.readTime) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {frontMatter.date && (
                <span>
                  <span aria-hidden>📅 </span>
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(frontMatter.date))}
                </span>
              )}
              {frontMatter.readTime && (
                <>
                  <span aria-hidden>•</span>
                  <span>{frontMatter.readTime}</span>
                </>
              )}
            </div>
          )}
        </header>

        {frontMatter.coverImage && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-lightGrey">
            <Image
              src={frontMatter.coverImage}
              alt={frontMatter.title}
              width={1200}
              height={630}
              className="h-auto w-full object-cover"
              priority={false}
            />
          </div>
        )}

        <article className="prose prose-sm max-w-none text-gray-800 prose-headings:font-serif prose-a:text-forest dark:prose-invert">
          {mdxSource ? (
            <MDXRemote {...mdxSource} components={mdxComponents as any} />
          ) : content ? (
            <p>{content}</p>
          ) : null}
        </article>
      </main>
    </Layout>
  );
}