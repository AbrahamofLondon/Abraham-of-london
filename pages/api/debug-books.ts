// pages/api/debug-books.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAllBooks, getBookBySlug } from '@/lib/books';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const books = getAllBooks();
    const problematicSlugs = [
      'fathering-without-fear',
      'the-architecture-of-human-purpose', 
      'the-fiction-adaptation'
    ];

    const debugInfo = problematicSlugs.map((slug) => {
      const book = getBookBySlug(slug);
      return {
        slug,
        exists: !!book,
        hasTitle: !!book?.title,
        contentPreview: book?.body?.raw?.substring(0, 100) || 'No content',
        url: book?.url,
      };
    });

    res.status(200).json({ 
      totalBooks: books.length,
      bookSlugs: books.map(b => {
        const slug = b.slug || b._raw?.flattenedPath?.split('/').pop();
        return { title: b.title, slug, url: b.url };
      }),
      problematicBooks: debugInfo 
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
}