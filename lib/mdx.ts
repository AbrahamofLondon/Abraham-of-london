--- /dev/null
+++ b/lib/mdx.ts
@@
+import { serialize } from "next-mdx-remote/serialize";
+import remarkGfm from "remark-gfm";
+import rehypeSlug from "rehype-slug";
+import rehypeAutolinkHeadings from "rehype-autolink-headings";
+
+export async function mdxToSource(markdown: string, scope: Record<string, any> = {}) {
+  const mdxSource = await serialize(markdown, {
+    mdxOptions: {
+      remarkPlugins: [remarkGfm],
+      rehypePlugins: [
+        rehypeSlug,
+        [rehypeAutolinkHeadings, { behavior: "wrap" }],
+      ],
+      format: "mdx",
+    },
+    parseFrontmatter: false,
+    scope,
+  });
+  return mdxSource;
+}
