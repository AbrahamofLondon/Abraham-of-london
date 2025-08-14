import { GetStaticProps, GetStaticPaths } from "next";
import { getBookBySlug, getBookSlugs, BookMeta } from "@/lib/books";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import MDXComponents from "@/components/MDXComponents";

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
  return (
    <article className="prose max-w-none">
      <h1>{book.meta.title}</h1>
      <MDXRemote {...book.content} components={MDXComponents} />
    </article>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getBookSlugs();
  return {
    paths: slugs.map((slug) => ({
      params: { slug: slug.replace(/\.md$/, "") },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");

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
    downloadPdf: raw.downloadPdf,
    downloadEpub: raw.downloadEpub,
  };

  const mdx = await serialize(raw.content ?? "", {
    scope: meta,
    mdxOptions: {
      remarkPlugins: [remarkGfm], // Removed remarkRehype
      rehypePlugins: [],
    },
  });

  return { props: { book: { meta, content: mdx } }, revalidate: 60 };
};




