import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import blogPosts from '../../data/blogPosts'; // ✅ default import

export async function getStaticPaths() {
  const paths = blogPosts.map((post) => ({
    params: { slug: post.slug },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'content/blog', `${params.slug}.mdx`);
  const source = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(source);
  const mdxSource = await serialize(content);

  return {
    props: {
      mdxSource,
      frontMatter: data,
    },
  };
}

export default function PostPage({ mdxSource, frontMatter }) {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">{frontMatter.title}</h1>
      <MDXRemote {...mdxSource} />
    </main>
  );
}
