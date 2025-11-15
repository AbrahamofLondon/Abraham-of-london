src/lib/server/unified-content.ts
import { getAllPages } from './pages-data';
import { getAllDownloads } from './downloads-data';
import { getAllEvents } from './events-data';

export interface UnifiedContent {
  id: string;
  type: 'page' | 'download' | 'event';
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  content?: string;
  url: string;
}

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  try {
    const [pages, downloads, events] = await Promise.all([
      getAllPages(),
      getAllDownloads(),
      getAllEvents()
    ]);

    const unified: UnifiedContent[] = [];

    // Add pages
    pages.forEach(page => {
      unified.push({
        id: `page-${page.slug}`,
        type: 'page',
        slug: page.slug,
        title: page.title,
        description: page.description,
        excerpt: page.excerpt,
        date: page.date,
        author: page.author,
        category: page.category,
        tags: page.tags,
        content: page.content,
        url: `/${page.slug}`
      });
    });

    // Add downloads
    downloads.forEach(download => {
      unified.push({
        id: `download-${download.slug}`,
        type: 'download',
        slug: download.slug,
        title: download.title || 'Untitled Download',
        description: download.description || download.excerpt,
        excerpt: download.excerpt,
        date: download.date,
        author: download.author,
        category: download.category,
        tags: download.tags,
        url: `/downloads/${download.slug}`
      });
    });

    // Add events
    events.forEach(event => {
      unified.push({
        id: `event-${event.slug}`,
        type: 'event',
        slug: event.slug,
        title: event.title,
        description: event.description,
        excerpt: event.excerpt,
        date: event.date,
        author: event.author,
        category: event.category,
        tags: event.tags,
        url: `/events/${event.slug}`
      });
    });

    // Sort by date (newest first)
    unified.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return unified;
  } catch (error) {
    console.error('[unified-content] Error fetching unified content:', error);
    return [];
  }
}

export async function getUnifiedContentByType(type: UnifiedContent['type']): Promise<UnifiedContent[]> {
  const allContent = await getAllUnifiedContent();
  return allContent.filter(item => item.type === type);
}

export async function searchUnifiedContent(query: string): Promise<UnifiedContent[]> {
  const allContent = await getAllUnifiedContent();
  const lowerQuery = query.toLowerCase();
  
  return allContent.filter(item =>
    item.title.toLowerCase().includes(lowerQuery) ||
    item.description?.toLowerCase().includes(lowerQuery) ||
    item.excerpt?.toLowerCase().includes(lowerQuery) ||
    item.content?.toLowerCase().includes(lowerQuery) ||
    item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export default {
  getAllUnifiedContent,
  getUnifiedContentByType,
  searchUnifiedContent
};