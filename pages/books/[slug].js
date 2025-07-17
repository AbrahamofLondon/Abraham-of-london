import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Layout from '../../components/Layout'; // Adjust path if necessary

// Import any custom components you want to use within your MDX files
// For example, if you have a <Callout /> component:
// import Callout from '../../components/Callout';

const components = {
  // Add any custom components you want to render in MDX here
  // For example: Callout, MyImageComponent, etc.
  // Make sure to import them first
};

export default function BookPage({ frontMatter, mdxSource }) {
  return (
    <Layout>
      <article className="prose lg:prose-xl mx-auto py-8">
        {/* You can display frontmatter data here, like title, author */}
        <h1>{frontMatter.title || 'Untitled Book'}</h1>
        {frontMatter.author && <p>By {frontMatter.author}</p>}
        {frontMatter.description && <p>{frontMatter.description}</p>}

        {/* Render the MDX content */}
        <MDXRemote {...mdxSource} components={components} />
      </article>
    </Layout>
  );
}

// getStaticPaths tells Next.js which paths to pre-render at build time
export async function getStaticPaths() {
  const booksDirectory = path.join(process.cwd(), 'content', 'books');
  const filenames = fs.readdirSync(booksDirectory);

  const paths = filenames.map((filename) => ({
    params: {
      slug: filename.replace(/\.mdx$/, ''), // Remove the .mdx extension
    },
  }));

  return {
    paths,
    fallback: false, // Set to 'blocking' or true if you want to handle paths not generated at build time
  };
}

// getStaticProps fetches data for each individual page
export async function getStaticProps({ params }) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'content', 'books', `${slug}.mdx`);
  const source = fs.readFileSync(filePath, 'utf8');

  // Use gray-matter to parse the frontmatter and content
  const { data: frontMatter, content } = matter(source);

  // Serialize the MDX content for rendering
  const mdxSource = await serialize(content, {
    scope: frontMatter, // Pass frontmatter as scope to MDX components
  });

  return {
    props: {
      frontMatter,
      mdxSource,
    },
  };
}