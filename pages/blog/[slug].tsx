--- a/pages/blog/[slug].tsx
+++ b/pages/blog/[slug].tsx
@@
-import { MDXRemote } from "next-mdx-remote";
-import { getAllPosts, getPostBySlug } from "@/lib/api";
-import MDXComponents from "@/components/mdx-components";
+import { MDXRemote } from "next-mdx-remote";
+import { getAllPosts, getPostBySlug } from "@/lib/api"; // assume these already exist
+import { mdxToSource } from "@/lib/mdx";
+import MDXComponents from "@/components/mdx-components";
+import Image from "next/image";
+import Head from "next/head";
 
 export async function getStaticPaths() {
-  const posts = getAllPosts(["slug"]);
-  return { paths: posts.map((p) => ({ params: { slug: p.slug } })), fallback: false };
+  const posts = getAllPosts(["slug", "date", "published"]);
+  // IMPORTANT: same predicate as index page
+  const visible = posts.filter((p: any) => (p.published ?? true) && new Date(p.date) <= new Date());
+  return { paths: visible.map((p: any) => ({ params: { slug: p.slug } })), fallback: "blocking" };
 }
 
 export async function getStaticProps({ params }: { params: { slug: string } }) {
-  const post = getPostBySlug(params.slug, [
-    "title", "date", "slug", "author", "content", "coverImage", "excerpt", "tags"
-  ]);
-  return { props: { post } };
+  const { content, ...post } = getPostBySlug(params.slug, [
+    "title",
+    "subtitle",
+    "date",
+    "slug",
+    "author",
+    "content",
+    "coverImage",
+    "excerpt",
+    "tags",
+    "published",
+  ]);
+
+  const source = await mdxToSource(content, {
+    // expose front-matter safely to MDX
+    title: post.title,
+    subtitle: (post as any).subtitle ?? "",
+    date: post.date,
+    author: post.author,
+  });
+
+  return {
+    props: { post, source },
+    revalidate: 60, // ISR
+  };
 }
 
-export default function BlogPost({ post }: any) {
-  return <article className="prose lg:prose-lg"><MDXRemote {...post.content} components={MDXComponents} /></article>;
+export default function BlogPost({ post, source }: any) {
+  return (
+    <>
+      <Head>
+        <title>{post.title} | Abraham of London</title>
+      </Head>
+      <header className="mb-6">
+        <h1 className="text-3xl md:text-4xl font-semibold">{post.title}</h1>
+        {post.subtitle ? <p className="text-lg text-neutral-600 mt-1">{post.subtitle}</p> : null}
+        {post.coverImage ? (
+          <div className="relative w-full aspect-[16/9] mt-4 overflow-hidden rounded-xl">
+            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
+          </div>
+        ) : null}
+      </header>
+      <article className="prose lg:prose-lg max-w-none">
+        <MDXRemote {...source} components={MDXComponents as any} />
+      </article>
+    </>
+  );
 }
