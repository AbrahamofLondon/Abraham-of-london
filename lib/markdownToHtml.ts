// lib/markdownToHtml.ts
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export default async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const processor = remark()
      .use(remarkGfm)
      // Cast to any to bypass TypeScript compatibility issues
      .use(remarkRehype as any)
      .use(rehypeStringify);
    
    const file = await processor.process(markdown);
    return String(file);
  } catch (error) {
    console.error('Error processing markdown:', error);
    return markdown; // Return original markdown as fallback
  }
}