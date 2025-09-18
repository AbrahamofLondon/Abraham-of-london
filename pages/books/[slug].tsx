// pages/books/[slug].tsx
import type { GetStaticProps, GetStaticPaths } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import fs from "fs";
import path from "path";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
import MDXComponents from "@/components/MDXComponents";
import { getBookBySlug, getBookSlugs } from "@/lib/books";
import { OgHead, BookJsonLd } from "@/lib/seo"; // centralized SEO

// Client-only comments widget (optional)
const Comments = dynamic(() => import("@/components/Comments"), { ssr: false });

// ✅ Fallback if no per-book cover exists
const DEFAULT_BOOK_COVER = "/assets/images/fathering-without-fear-teaser.jpg";

/** JSON-serializable meta (no `undefined`) */
type PageMetaSafe = {
  slug: string;
  title: string;
  author: string | null;
  excerpt: string | null;
  coverImage: string;         // always a string (falls back to DEFAULT_BOOK_COVER)
  buyLink: string | null;
  genre: string | null;
  downloadPdf: string | null;
  downloadEpub: string | null;
};

interface Props {
  book: {
    meta: PageMetaSafe;
    content: MDXRemoteSerializeResult;
  };
}

// ---- helpers ---------------------------------------------------

/** Prefer /public/assets/images/books/<slug>.(jpg|jpeg|png|webp|avif) if present */
function resolveLocalCover(slug: string): string | null {
  const relDir = "/assets/images/books";
  const absDir = path.join(process.cwd(), "public", "assets", "images", "books");
  const candidates = [
    `${slug}.jpg`,
    `${slug}.jpeg`,
    `${slug}.png`,
    `${slug}.webp`,
    `${slug}.avif`,
  ];

  for (const file of candidates) {
    const abs = path.join(absDir, file);
    if (fs.existsSync(abs)) return `${relDir}/${file}`;
  }
  return null;
}

export default function BookPage({ book }: Props) {
  const { meta, content } = book;
  const canonicalPath = `/books/${meta.slug}`;

  return (
    <Layout pageTitle={meta.title}>
      {/* ✅ OG/Twitter + canonical; pass cover as OG image explicitly */}
      <OgHead
        title={meta.title}
        description={meta.excerpt ?? "Books by Abraham of London."}
        path={canonicalPath}
        ogImagePath={meta.coverImage}
      />

      {/* ✅ JSON-LD for richer SERPs */}
      <BookJsonLd
        name={meta.title}
        author={meta.author ?? "Abraham of London"}
        path={canonicalPath}
        image={meta.coverImage}
        description={meta.excerpt ?? undefined}
      />

      <article className="prose prose-lg mx-auto max-w-3xl px-4 py-10 md:py-16">
        {/* Cover — use book aspect and don't crop */}
        <div className="relative mb-8 aspect-[3/4] w-full overflow-hidden rounded-xl border border-lightGrey bg-warmWhite">
          <Image
            src={meta.coverImage}
            alt={`Cover of ${meta.title}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
            priority={false}
          />
        </div>

        <h1 className="mb-2 font-serif text-4xl text-forest md:text-5xl">{meta.title}</h1>

        {meta.author && (
          <p className="mb-6 text-sm text-deepCharcoal/70">By {meta.author}</p>
        )}

        {meta.excerpt && (
          <p className="mb-8 text-base text-deepCharcoal/85">{meta.excerpt}</p>
        )}

        <div className="mt-8">
          <MDXRemote {...content} components={MDXComponents} />
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          {meta.buyLink && (
            <a
              href={meta.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Buy the book
            </a>
          )}
          {meta.downloadPdf && (
            <a
              href={meta.downloadPdf}
              className="rounded-full border border-lightGrey px-5 py-2 text-sm font-medium text-deepCharcoal hover:bg-warmWhite"
            >
              Download PDF
            </a>
          )}
          {meta.downloadEpub && (
            <a
              href={meta.downloadEpub}
              className="rounded-full border border-lightGrey px-5 py-2 text-sm font-medium text-deepCharcoal hover:bg-warmWhite"
            >
              Download EPUB
            </a>
          )}
        </div>

        {/* Optional: comments */}
        <div className="mt-12">
          <a href="#comments" className="luxury-link text-sm">Join the discussion ↓</a>
        </div>
        <section id="comments" className="mt-16">
          <Comments
            repo="AbrahamofLondon/abrahamoflondon-comments"
            issueTerm="pathname"
            useClassDarkMode
          />
        </section>
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getBookSlugs(); // e.g. ["fathering-without-fear.mdx", ...]
  return {
    paths: slugs.map((slug) => ({
      params: { slug: slug.replace(/\.mdx?$/i, "") },
    })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "");

  // Pull everything we need (content + meta), tolerate missing fields
  const raw = getBookBySlug(slug, [
    "slug",
    "title",
    "author",
    "excerpt",
    "coverImage",
    "buyLink",
    "genre",
    "downloadPdf",
    "downloadEpub",
    "content",
  ]) as Partial<{
    slug: string;
    title: string;
    author: string;
    excerpt: string;
    coverImage: string;
    buyLink: string;
    genre: string;
    downloadPdf: string;
    downloadEpub: string;
    content: string;
  }>;

  if (!raw?.slug || raw.title === "Book Not Found") {
    return { notFound: true };
  }

  // Prefer a file named after the slug in /public/assets/images/books/
  const localCover = resolveLocalCover(slug);
  const coverFromFrontmatter =
    typeof raw.coverImage === "string" && raw.coverImage.trim() ? raw.coverImage : null;

  // ✅ Normalize to JSON-safe values (no `undefined`)
  const meta: PageMetaSafe = {
    slug: String(raw.slug),
    title: raw.title ?? "Untitled",
    author: raw.author ?? null,
    excerpt: raw.excerpt ?? null,
    coverImage: localCover || coverFromFrontmatter || DEFAULT_BOOK_COVER,
    buyLink: raw.buyLink ?? null,
    genre: raw.genre ?? null,
    downloadPdf: raw.downloadPdf ?? null,
    downloadEpub: raw.downloadEpub ?? null,
  };

  const mdx = await serialize(raw.content ?? "", {
    scope: meta,
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [] },
  });

  return {
    props: { book: { meta, content: mdx } },
    revalidate: 60,
  };
};
