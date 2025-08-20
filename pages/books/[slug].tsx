// pages/books/[slug].tsx
import type { GetStaticProps, GetStaticPaths } from "next";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
import MDXComponents from "@/components/MDXComponents";
import { getBookBySlug, getBookSlugs, type BookMeta } from "@/lib/books";

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

  return (
    <Layout pageTitle={meta.title}>
      <article className="prose prose-lg max-w-3xl px-4 py-10 md:py-16 mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-forest mb-4">
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
        : "/assets/images/default-book.jpg",
    buyLink: raw.buyLink || "#",
    genre: raw.genre || "Uncategorized",
    downloadPdf: raw.downloadPdf ?? null,
    downloadEpub: raw.downloadEpub ?? null,
  };

  const mdx = await serialize(raw.content ?? "", {
    scope: meta,
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [],
    },
  });

  return {
    props: {
      book: { meta, content: mdx },
    },
    revalidate: 60,
  };
};
