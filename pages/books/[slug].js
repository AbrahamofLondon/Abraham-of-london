// pages/books/[slug].tsx
import { getAllContent } from '../../utils/getAllContent';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import SeoMeta from '../../components/SeoMeta';

export async function getStaticPaths() {
  const books = getAllContent('books');
  const paths = books.map((book) => ({ params: { slug: book.slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const books = getAllContent('books');
  const book = books.find((b) => b.slug === params.slug);
  const mdxSource = await serialize(book.content);

  return {
    props: {
      frontmatter: book.frontmatter,
      mdxSource,
      slug: book.slug,
    },
  };
}

export default function BookDetail({ frontmatter, mdxSource, slug }) {
  const siteUrl = 'https://www.abrahamoflondon.com';

  return (
    <>
      <SeoMeta
        title={frontmatter.title}
        description={frontmatter.excerpt}
        coverImage={frontmatter.coverImage}
        url={`${siteUrl}/books/${slug}`}
      />
      <article className="max-w-3xl mx-auto py-16 px-6 bg-white shadow-xl rounded-xl">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 border-b pb-2 border-gray-200">{frontmatter.title}</h1>
        <p className="text-gray-500 text-sm mb-6 italic">By {frontmatter.author}</p>
        {frontmatter.coverImage && <img src={frontmatter.coverImage} alt={frontmatter.title} className="mb-8 w-full h-auto rounded-lg shadow-md border" />}
        <div className="prose prose-lg max-w-none text-gray-800">
          <MDXRemote {...mdxSource} />
        </div>
      </article>
    </>
  );
}