// pages/blog/[slug].tsx

import { GetStaticProps, GetStaticPaths, GetStaticPropsContext } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { getAllContent, getContentBySlug } from '../../utils/getAllContent'; // Assuming these utils exist and work
import { BookCard } from '../../components/BookCard'; // Use curly braces for named export

// Define your PostFrontmatter interface to match the data structure from your Markdown/MDX files
interface PostFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  readTime: string;
  // Add any other properties you expect in your blog post's frontmatter
  [key: string]: any; // Allows for additional, non-strictly typed properties
}

// Define the props for your PostPage component
interface PostPageProps {
  frontmatter: PostFrontmatter;
  mdxSource: MDXRemoteSerializeResult;
}

// You can define custom components to be used within your MDX here
// For example:
// const components = {
//   h1: (props: any) => <h1 className="text-4xl font-bold my-4" {...props} />,
//   p: (props: any) => <p className="text-lg my-2" {...props} />,
//   img: (props: any) => <img className="w-full my-4" {...props} />,
//   // ... other custom components
// };

export default function PostPage({ frontmatter, mdxSource }: PostPageProps) {
  return (
    <Layout> {/* Wrap your page content with your Layout component */}
      <article className="max-w-3xl mx-auto py-8 px-4">
        {/* Post Header */}
        <h1 className="text-4xl md:text-5xl font-bold font-display leading-tight mb-4 text-primary">
          {frontmatter.title}
        </h1>
        <p className="text-sm text-softGrey uppercase tracking-wide font-medium mb-6">
          {frontmatter.category} • {frontmatter.date} • By {frontmatter.author} • {frontmatter.readTime}
        </p>

        {/* Cover Image */}
        {frontmatter.coverImage && (
          <img
            src={frontmatter.coverImage}
            alt={frontmatter.title}
            className="w-full h-80 object-cover rounded-lg mb-8 shadow-md"
          />
        )}

        {/* MDX Content */}
        {/* The 'prose' class from @tailwindcss/typography helps style markdown content */}
        <div className="prose max-w-none text-charcoal font-body">
          <MDXRemote {...mdxSource} components={{}} /> {/* Pass your custom components here if defined */}
        </div>
      </article>
    </Layout>
  );
}

// getStaticPaths is required for dynamic routes (like [slug].tsx)
export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = getAllContent('blog'); // Get all blog post slugs
  const paths = allPosts.map((post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    fallback: false, // Set to 'blocking' or true if you want to use fallback pages
  };
};

// getStaticProps fetches the data for each static page
export const getStaticProps: GetStaticProps<PostPageProps, { slug: string }> = async ({ params }) => {
  const { slug } = params as { slug: string }; // Cast params to ensure slug is a string

  // Fetch the content and frontmatter for the specific blog post
  const { content, data } = getContentBySlug('blog', slug);

  // Serialize the MDX content for rendering with next-mdx-remote
  const mdxSource = await serialize(content, {
    // Optionally pass frontmatter data to the MDX scope if needed within MDX
    scope: data,
  });

  // Explicitly cast the data (frontmatter) to the PostFrontmatter type
  const frontmatter = data as PostFrontmatter;

  // Basic check for essential frontmatter properties, redirect to 404 if missing
  if (!frontmatter || !frontmatter.title || !frontmatter.date || !frontmatter.excerpt) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      frontmatter, // This now strictly conforms to PostFrontmatter
      mdxSource,
    },
    revalidate: 60, // Optional: Revalidate page every 60 seconds (ISR)
  };
};