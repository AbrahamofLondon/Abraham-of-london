// lib/mdx-file.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const isMDX = (f: string) => f.toLowerCase().endsWith(".mdx");
const toSlug = (filename: string) => filename.replace(/\.mdx$/i, "");
const isPublic = (f: string) => !f.startsWith("_") && !f.startsWith(".");

export function listSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  const slugs = files
    .filter(isPublic)
    .filter(isMDX)
    .map(toSlug);

  // de-dupe defensively to avoid SSG conflicts
  return Array.from(new Set(slugs));
}

export async function loadMdxBySlug(dir: string, slug: string) {
  const file = path.join(dir, `${slug}.mdx`);
  if (!fs.existsSync(file)) {
    throw new Error(`MDX not found for slug: ${slug} at ${file}`);
  }

  const raw = fs.readFileSync(file, "utf8");
  const { content, data } = matter(raw);

  // MDX serialization (no Date objects leak)
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkBreaks],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
      format: "mdx",
    },
    scope: data ?? {},
  });

  // Normalize frontmatter; ensure plain JSON (no Date instances)
  const frontmatter = JSON.parse(JSON.stringify(data ?? {}));

  return { frontmatter, mdxSource };
}
