// config/mdx-plugins.ts
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";

export const remarkPlugins = [remarkGfm];

export const rehypePlugins = [
  rehypeSlug,
  [
    rehypeAutolinkHeadings,
    { behavior: "wrap", properties: { className: ["anchor"] } },
  ],
  [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
] as any[]; // next-mdx-remote/CL tolerate tuple form

