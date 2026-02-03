/* lib/briefs/content-engine.ts — HIGH-FIDELITY MDX LOADER */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';

const CONTENT_PATH = path.join(process.cwd(), 'content/briefs');

export async function getBriefContent(slug: string) {
  const fullPath = path.join(CONTENT_PATH, `${slug}.mdx`);
  
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  const mdxSource = await serialize(content, {
    scope: data,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });

  return {
    source: mdxSource,
    frontMatter: data,
  };
}