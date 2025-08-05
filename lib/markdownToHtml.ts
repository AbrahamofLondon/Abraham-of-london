// lib/markdownToHtml.ts
import { remark } from 'remark';
import html from 'remark-html';

export default async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await remark().use(html).process(markdown);
    return String(result);
  } catch (error) {
    console.error('Error processing markdown:', error);
    return markdown; // Return original markdown as fallback
  }
}