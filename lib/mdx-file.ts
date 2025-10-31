import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";

export async function loadMdxBySlug(dir: string, slug: string, opts?: { scope?: boolean }) {
  const full = path.join(dir, `${slug}.mdx`);
  const raw = await fs.readFile(full, "utf8");
  const { content, data: frontmatter } = matter(raw);

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
    scope: opts?.scope ? frontmatter : undefined, // ✅ makes {title} etc. available
    parseFrontmatter: false,
  });

  return { frontmatter, mdxSource };
}

export function listSlugs(dir: string): string[] {
  // return filenames without extension
  const files = require("fs").readdirSync(dir, { withFileTypes: true })
    .filter((d: any) => d.isFile() && d.name.endsWith(".mdx"))
    .map((d: any) => d.name.replace(/\.mdx$/, ""));
  return files;
}
