import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export default async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown);

    return String(file);
  } catch (error) {
    console.error('Error processing markdown:', error);
    return markdown; // Return original markdown as fallback
  }
}