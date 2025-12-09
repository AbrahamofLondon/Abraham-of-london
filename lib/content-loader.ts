// lib/content-loader.ts - FINAL VERSION WITH WORKAROUND
import { Post } from '@/types/post';

const mockPosts = [
  {
    slug: 'welcome-post',
    title: 'Welcome to Abraham of London',
    date: '2024-01-01',
    content: 'This is the welcome post content...',
    excerpt: 'A warm welcome to our platform',
    coverImage: '/images/welcome.jpg',
    published: true,
    featured: true,
    category: 'announcements',
    tags: ['welcome', 'introduction'],
    author: 'Abraham',
    readTime: '2 min read'
  },
  {
    slug: 'getting-started',
    title: 'Getting Started Guide',
    date: '2024-01-02',
    content: 'Guide content here...',
    excerpt: 'Learn how to get started',
        coverImage: '/images/guide.jpg',
    published: true,
    category: 'guides',
    tags: ['guide', 'tutorial'],
    author: 'Abraham',
    readTime: '5 min read'
  }
] as Post[];

export async function loadPostsFromSource(): Promise<Post[]> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[content-loader] Using mock posts data');
      return mockPosts;
    }

    try {
      const contentlayer = await import('./contentlayer-helper');
      const docs = contentlayer.getAllContentlayerDocs();
      
      return docs.map(doc => ({
        slug: doc.slug || '',
        title: doc.title || 'Untitled',
        date: doc.date || new Date().toISOString().split('T')[0],
                content: doc.body?.raw || (doc as any).content || '',
        excerpt: doc.excerpt || '',
        description: doc.description,
        coverImage: doc.coverImage,
                published: (doc as any).published !== false,
                featured: (doc as any).featured || false,
                category: (doc as any).category,
        tags: doc.tags || [],
                author: (doc as any).author,
                readTime: (doc as any).readTime,
                subtitle: (doc as any).subtitle,
      } as Post));
    } catch (contentlayerError) {
      console.warn('[content-loader] Contentlayer not available');
      return mockPosts;
    }
    
  } catch (error) {
    console.error('[content-loader] Error:', error);
    return mockPosts;
  }
}

export async function initializeAllContent(): Promise<{ posts: Post[] }> {
  try {
    const posts = await loadPostsFromSource();
    console.log(`[content-loader] Initialized ${posts.length} posts`);
    return { posts };
  } catch (error) {
    console.error('[content-loader] Error:', error);
    return { posts: [] };
  }
}

export function createContentLoader() {
  return {
    load: async () => await loadPostsFromSource()
  };
}

// Default export remains for compatibility
export default {
  loadPostsFromSource,
  initializeAllContent,
  createContentLoader
};
