import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

export async function getStaticPaths() {
  console.log('--- Debugging getStaticPaths ---');
  const contentDirectory = path.join(process.cwd(), 'content', 'blog');
  console.log('Content directory path in getStaticPaths:', contentDirectory);

  let files = [];
  try {
    files = fs.readdirSync(contentDirectory);
    console.log('Files found in content/blog:', files);
  } catch (error) {
    console.error('Error reading content/blog directory in getStaticPaths:', error);
  }

  const paths = files.map((filename) => ({
    params: { slug: filename.replace('.mdx', '') }
  }));
  console.log('Generated paths in getStaticPaths:', paths);
  console.log('--- End Debugging getStaticPaths ---');

  return { paths, fallback: false };
}

export async function getStaticProps({ params: { slug } }) {
  console.log('--- Debugging getStaticProps ---');
  console.log('Slug in getStaticProps:', slug);

  const filePath = path.join(process.cwd(), 'content', 'blog', slug + '.mdx');
  console.log('Attempting to read file:', filePath);

  let markdownWithMeta;
  try {
    markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
    console.log('File read successfully for slug:', slug);
  } catch (error) {
    console.error(`Error reading MDX file for slug ${slug}:`, error);
    // You might want to return notFound: true here in a real app if the file isn't found
    return { notFound: true };
  }

  const { data: frontmatter, content } = matter(markdownWithMeta);
  console.log('Frontmatter parsed for slug:', slug, frontmatter);
  console.log('Content length for slug:', slug, content.length);

  const mdxSource = await serialize(content);
  console.log('MDX content serialized for slug:', slug);
  console.log('--- End Debugging getStaticProps ---');

  return {
    props: {
      frontmatter,
      mdxSource
    }
  };
}

export default function BlogPost({ frontmatter, mdxSource }) {
  console.log('--- Debugging BlogPost Component ---');
  console.log('Rendering blog post with title:', frontmatter?.title);
  console.log('--- End Debugging BlogPost Component ---');

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
        <MDXRemote {...mdxSource} />
      </div>
    </article>
  );
}