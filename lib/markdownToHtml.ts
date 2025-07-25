// lib/markdownToHtml.ts

// This is the correct way to import 'remark' for the version we are using.
// It's a default import, not a named import.
import remark from 'remark';

export default async function markdownToHtml(markdown: string) {
  // These dynamic imports are still important for avoiding deep type conflicts
  // with remark-gfm and remark-html.
  const { default: remarkGfm } = await import('remark-gfm');
  const { default: remarkHtml } = await import('remark-html');

  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);
  return result.toString();
}