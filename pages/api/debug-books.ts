import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Simulating book data for debugging
    const books = [
      {
        slug: 'fathering-without-fear',
        title: 'Fathering Without Fear',
        body: { raw: 'Sample content for Fathering Without Fear...' },
        url: '/books/fathering-without-fear'
      },
      {
        slug: 'the-architecture-of-human-purpose',
        title: 'The Architecture of Human Purpose',
        body: { raw: 'Sample content for The Architecture of Human Purpose...' },
        url: '/books/the-architecture-of-human-purpose'
      },
      {
        slug: 'the-fiction-adaptation',
        title: 'The Fiction Adaptation',
        body: { raw: 'Sample content for The Fiction Adaptation...' },
        url: '/books/the-fiction-adaptation'
      }
    ];

    const problematicSlugs = [
      'fathering-without-fear',
      'the-architecture-of-human-purpose', 
      'the-fiction-adaptation'
    ];

    const debugInfo = problematicSlugs.map((slug) => {
      const book = books.find(b => b.slug === slug);
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
      bookSlugs: books.map(b => ({
        title: b.title,
        slug: b.slug,
        url: b.url
      })),
      problematicBooks: debugInfo 
    });
  } catch (_error) {
    console.error('Debug error:', _error);
    res.status(500).json({ error: 'Debug failed' });
  }
}