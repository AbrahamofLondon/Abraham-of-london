import Head from 'next/head';
import Image from 'next/image';
import type { GetStaticProps, GetStaticPaths } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import Layout from '../../components/Layout';
import MDXProviderWrapper from '../../components/MDXProviderWrapper';
import { MDXComponents } from '../../components/MDXComponents';
import { getAllBooks, getBookBySlug, BookMeta } from '../../lib/books';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkHtml from 'remark-html';
import rehypeStringify from 'rehype-stringify';

type PageMeta = {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string | string[];
  downloadPdf?: string;
  downloadEpub?: string;
};

type Props = {
  book: {
    meta: PageMeta;
    content: MDXRemoteSerializeResult;
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || '');
  const raw = getBookBySlug(slug, [
    'slug',
    'title',
    'author',
    'excerpt',
    'coverImage',
    'buyLink',
    'genre',
    'downloadPdf',
    'downloadEpub',
    'content',
  ]) as Partial<BookMeta> & { content?: string };

  if (!raw.slug || raw.title === 'Book Not Found') return { notFound: true };

  const meta: PageMeta = {
    slug: raw.slug,
    title: raw.title || 'Untitled',
    author: raw.author || 'Abraham of London',
    excerpt: raw.excerpt || '',
    coverImage:
      typeof raw.coverImage === 'string' && raw.coverImage.trim()
        ? raw.coverImage
        : '/assets/images/default-book.jpg',
    buyLink: raw.buyLink || '#',
    genre: raw.genre || 'Uncategorized',
    downloadPdf: raw.downloadPdf || undefined,
    downloadEpub: raw.downloadEpub || undefined,
  };

  const mdx = await serialize(raw.content ?? '', {
    parseFrontmatter: false,
    scope: meta,
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
        remarkParse,
        remarkRehype,
        remarkHtml,
      ],
      rehypePlugins: [rehypeStringify],
    },
  });

  return { props: { book: { meta, content: mdx } }, revalidate: 60 };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks(['slug']);
  return {
    paths: books.map((b) => ({ params: { slug: String(b.slug) } })),
    fallback: 'blocking',
  };
};

export default function BookPage({ book }: Props) {
  const siteUrl = 'https://abrahamoflondon.org';
  return (
    <Layout>
      <MDXProviderWrapper>
        <Head>
          <title>{book.meta.title} | Abraham of London</title>
          <meta name="description" content={book.meta.excerpt || 'Book by Abraham of London'} />
          <meta property="og:image" content={`${siteUrl}${book.meta.coverImage}`} />
        </Head>

        <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
          {book.meta.coverImage && (
            <div className="mb-8 md:mb-16 relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={book.meta.coverImage}
                alt={book.meta.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <h1 className="font-serif text-5xl md:text-6xl tracking-brand text-forest mb-6">{book.meta.title}</h1>

          <div className="text-sm text-deepCharcoal/70 mb-4">
            <span>{book.meta.author}</span> · <span>{Array.isArray(book.meta.genre) ? book.meta.genre.join(', ') : book.meta.genre}</span>
            {book.meta.buyLink && (
              <a
                href={book.meta.buyLink}
                className="ml-2 inline-block text-xs rounded bg-forest text-cream px-2 py-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy Now
              </a>
            )}
          </div>

          <div className="prose prose-lg max-w-none text-deepCharcoal">
            <MDXRemote {...book.content} components={MDXComponents} />
          </div>

          {(book.meta.downloadPdf || book.meta.downloadEpub) && (
            <div className="mt-6 flex gap-4">
              {book.meta.downloadPdf && (
                <a
                  href={book.meta.downloadPdf}
                  className="border border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download PDF
                </a>
              )}
              {book.meta.downloadEpub && (
                <a
                  href={book.meta.downloadEpub}
                  className="border border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download EPUB
                </a>
              )}
            </div>
          )}
        </article>
      </MDXProviderWrapper>
    </Layout>
  );
}