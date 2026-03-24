/* lib/briefs/content-engine.ts — BRIEF CONTENT LOADER (NO next-mdx-remote) */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_PATH = path.join(process.cwd(), "content/briefs");

export type BriefContentResult = {
  content: string;
  frontMatter: Record<string, unknown>;
};

export function getBriefContent(slug: string): BriefContentResult | null {
  const fullPath = path.join(CONTENT_PATH, `${slug}.mdx`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    content,
    frontMatter: data as Record<string, unknown>,
  };
}