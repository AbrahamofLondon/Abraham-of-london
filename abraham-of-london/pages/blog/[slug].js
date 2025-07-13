import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import MDXComponents from '@/components/MDXComponents'; // ✅ NEW

export async function getStaticPaths() {
  const files = fs.readdirSync(path.join('content', 'blog'));
  const paths = files.map((filename) => ({
    params: { slug: filename.replace('.mdx', '') }
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params: { slug } }) {
  const markdownWithMeta = fs.readFileSync(path.join('content', 'blog', slug + '.mdx'), 'utf-8');
  const { data: frontmatter, content } = matter(markdownWithMeta);
  const mdxSource = await serialize(content);
  return {
    props: {
      frontmatter,
      mdxSource
    }
  };
}

export default function BlogPost({ frontmatter, mdxSource }) {
  return (
    <article className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">{frontmatter.title}</h1>
      <p className="text-gray-500">{new Date(frontmatter.date).toLocaleDateString()}</p>
      <img
        src={frontmatter.image}
        alt={frontmatter.title}
        className="rounded-xl mt-4 mb-6 w-full object-cover"
        loading="lazy"
      />
      <div className="prose">
        <MDXComponents>
          <MDXRemote {...mdxSource} />
        </MDXComponents>
      </div>
    </article>
  );
}
