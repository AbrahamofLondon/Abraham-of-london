/* pages/blog/[slug].tsx — REIFIED FOR CONTENTLAYER2 */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import { getPostBySlug, getPublishedPosts } from "@/lib/content/server";

const BlogSlugPage: NextPage<any> = ({ post, initialLocked }) => {
  const [activeCode, setActiveCode] = React.useState(post.bodyCode || "");
  const [loading, setLoading] = React.useState(false);

  // Use your existing unlock logic but point to the new bodyCode field
  const handleUnlock = async () => {
    setLoading(true);
    const res = await fetch(`/api/canon/${encodeURIComponent(post.slug)}`); // Reuse canon API or create blog API
    const json = await res.json();
    if (json.ok) setActiveCode(json.bodyCode);
    setLoading(false);
  };

  return (
    <Layout title={post.title}>
      <article className="max-w-4xl mx-auto py-20 px-6">
        <h1 className="text-5xl font-serif mb-8">{post.title}</h1>
        <div className="relative">
          {loading && <Loader2 className="animate-spin mx-auto mb-10 text-amber-500" />}
          <SafeMDXRenderer code={activeCode} />
        </div>
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getPublishedPosts() || [];
  return {
    paths: posts.map((p: any) => ({ params: { slug: p.slug.replace(/^blog\//, "") } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const postRaw = getPostBySlug(String(params?.slug));
  if (!postRaw || postRaw.draft) return { notFound: true };

  const initialLocked = postRaw.accessLevel !== "public";

  const post = {
    ...postRaw,
    slug: params?.slug,
    bodyCode: initialLocked ? "" : postRaw.body.code,
  };

  return {
    props: { post, initialLocked },
    revalidate: 1800,
  };
};

export default BlogSlugPage;