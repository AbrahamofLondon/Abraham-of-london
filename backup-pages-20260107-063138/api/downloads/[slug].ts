import { getServerAllPosts, getServerPostBySlug } from '@/lib/contentlayer';
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import type { GetStaticPaths, GetStaticProps } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

type Props = {
  post: {
    title: string;
    excerpt: string | null;
    author: string | null;
    coverImage: string | null;
    date: string | null;
    slug: string;
    url: string;
  };
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getServerAllPosts();
  
  return {
    paths: posts.map((post) => ({
      params: { slug: post.slug },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  
  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    const post = await getServerPostBySlug(slug);
    
    if (!post) {
      return {
        notFound: true,
      };
    }

    // Serialize MDX content if it exists
    let source: MDXRemoteSerializeResult | null = null;
    if (post.body) {
      source = await serialize(post.body, {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
        },
      });
    }

    return {
      props: {
        post: {
          title: post.title,
          excerpt: post.excerpt || null,
          author: post.author || null,
          coverImage: post.coverImage || null,
          date: post.date || null,
          slug: post.slug,
          url: post.url || `/blog/${post.slug}`,
        },
        source,
      },
    };
  } catch (error) {
    console.error("[BLOG_PAGE_ERROR]", error);
    return {
      notFound: true,
    };
  }
};
