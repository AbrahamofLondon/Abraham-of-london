import type { GetStaticProps, GetStaticPaths } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
import MDXComponents from "@/components/MDXComponents";
import { getBookBySlug, getBookSlugs, type BookMeta } from "@/lib/books";

// Client-only comments widget (optional; keep if you want comments on books)
const Comments = dynamic(() => import("@/components/Comments"), { ssr: false });

// ✅ Use an image that exists in your repo (per your screenshot)
const DEFAULT_BOOK_COVER = "/assets/images/fathering-without-fear-teaser.jpg";

type PageMeta = Pick<
  BookMeta,
  | "slug"
  | "title"
  | "author"
  | "excerpt"
  | "coverImage"
  | "buyLink"
  | "genre"
  | "downloadPdf"
  | "downloadEpub"
>;

interface Props {
  book: {
    meta: PageMeta;
    content: MDXRemoteSerializeResult;
  };
}

export default function BookPage({ book }: Props) {
  const { meta, content } = book;

  // local-only path for Next <Image />
  const coverSrc =
    typeof meta.coverImage === "string" && meta.coverImage.trim()
      ? meta.coverImage
      : DEFAULT_BOOK_COVER;

  return (
    <Layout pageTitle={meta.title}>
      <article className="prose prose-lg max-w-3xl px-4 py-10 md:py-16 mx-auto">
        {/* Cover */}
        <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-lg shadow">
          <Image
            src={coverSrc}
            alt={meta.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority={false}
          />
        </div>

        <h1 className="font-serif text-4xl md:text-5xl text-forest mb-2">
          {meta.title}
        </h1>

        {meta.author && (
          <p className="text-sm text-deepCharcoal/70 mb-6">By {meta.author}</p>
        )}

        {meta.excerpt && (
          <p className="text-base text-deepCharcoal/85 mb-8">{meta.excerpt}</p>
        )}

        <div className="mt-8">
          <MDXRemote {...content} components={MDXComponents} />
        </div>

        {/* Optional: comments on book pages */}
        <div className="mt-12">
          <a href="#comments" className="luxury-link text-sm">Join the discussion ↓</a>
        </div>
        <section id="comments" className="mt-16">
          <Comments
            repo="AbrahamofLondon/abrahamoflondon-comments"
            issueTerm="pathname"
            // label="comments" // only if you created this label
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
  ]) as Partial<BookMeta> & { content?: string };

  if (!raw.slug || raw.title === "Book Not Found") {
    return { notFound: true };
  }

  const meta: PageMeta = {
    slug: raw.slug,
    title: raw.title || "Untitled",
    author: raw.author || "Abraham of London",
    excerpt: raw.excerpt || "",
    coverImage:
      typeof raw.coverImage === "string" && raw.coverImage.trim()
        ? raw.coverImage
        : DEFAULT_BOOK_COVER, // ✅ correct fallback
    buyLink: raw.buyLink || "#",
    genre: raw.genre || "Memoir",
    downloadPdf: raw.downloadPdf ?? undefined,
    downloadEpub: raw.downloadEpub ?? undefined,
  };

  const mdx = await serialize(raw.content ?? "", {
    scope: meta,
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [],
    },
  });

  return {
    props: { book: { meta, content: mdx } },
    revalidate: 60,
  };
};
