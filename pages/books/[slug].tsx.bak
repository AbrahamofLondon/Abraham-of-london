// pages/books/[slug].tsx
import type { GetStaticProps, GetStaticPaths } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
// ⬇️ use the named export
import { components } from "@/components/MdxComponents"; // Imported as 'components'
import { getBookBySlug, getBookSlugs } from "@/lib/books";

const Comments = dynamic(() => import("@/components/Comments"), { ssr: false });

const DEFAULT_BOOK_COVER = "/assets/images/fathering-without-fear-teaser.jpg";

type PageMetaSafe = {
    slug: string;
    title: string;
    author: string | null;
    excerpt: string | null;
    coverImage: string;
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

export default function BookPage({ book }: Props) {
    const { meta, content } = book;

    return (
        <Layout pageTitle={meta.title}>
            <article className="prose prose-lg mx-auto max-w-3xl px-4 py-10 md:py-16">
                <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-lg shadow">
                    <Image
                        src={meta.coverImage}
                        alt={meta.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 768px"
                        priority={false}
                    />
                </div>

                <h1 className="mb-2 font-serif text-4xl text-forest md:text-5xl">{meta.title}</h1>

                {meta.author && <p className="mb-6 text-sm text-[color:var(--color-on-secondary)/0.7]">By {meta.author}</p>}
                {meta.excerpt && <p className="mb-8 text-base text-[color:var(--color-on-secondary)/0.85]">{meta.excerpt}</p>}

                <div className="mt-8">
                    {/* FIX: Change 'MDXComponents' to the imported name 'components' */}
                    <MDXRemote {...content} components={components} />
                </div>

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

                <div className="mt-12">
                    <a href="#comments" className="luxury-link text-sm">
                        Join the discussion ↓
                    </a>
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
    const slugs = getBookSlugs();
    return {
        paths: slugs.map((slug) => ({ params: { slug: slug.replace(/\.mdx?$/i, "") } })),
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

    if (!raw?.slug || raw.title === "Book Not Found") return { notFound: true };

    const meta: PageMetaSafe = {
        slug: String(raw.slug),
        title: raw.title ?? "Untitled",
        author: raw.author ?? null,
        excerpt: raw.excerpt ?? null,
        coverImage:
            typeof raw.coverImage === "string" && raw.coverImage.trim()
                ? raw.coverImage
                : DEFAULT_BOOK_COVER,
        buyLink: raw.buyLink ?? null,
        genre: raw.genre ?? null,
        downloadPdf: raw.downloadPdf ?? null,
        downloadEpub: raw.downloadEpub ?? null,
    };

    const mdx = await serialize(raw.content ?? "", {
        scope: meta,
        mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [] },
    });

    return { props: { book: { meta, content: mdx } }, revalidate: 60 };
};