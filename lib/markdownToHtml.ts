// lib/markdownToHtml.ts
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, checkboxes, etc.)

export default async function markdownToHtml(markdown: string) {
  const result = await remark()
    .use(remarkGfm) // Add this line if you use GitHub Flavored Markdown
    .use(html)
    .process(markdown);
  return result.toString();
}