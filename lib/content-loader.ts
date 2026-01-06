import { Post } from '@/types/post';

/* -------------------------------------------------------------------------- */
/* MOCK DATA (Fallback for Dev/Build resilience)                              */
/* -------------------------------------------------------------------------- */
const mockPosts: Post[] = [
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
    readTime: '2 min read',
    // FIX: Satisfy strict Post type requirements
    html: '<p>This is the welcome post content...</p>',
    compiledSource: '' 
  },
  {
    slug: 'getting-started',
    title: 'Getting Started Guide',
    date: '2024-01-02',
    content: 'Guide content here...',
    excerpt: 'Learn how to get started',
    coverImage: '/images/guide.jpg',
    published: true,
    featured: false,
    category: 'guides',
    tags: ['guide', 'tutorial'],
    author: 'Abraham',
    readTime: '5 min read',
    // FIX: Satisfy strict Post type requirements
    html: '<p>Guide content here...</p>',
    compiledSource: ''
  }
];

/* -------------------------------------------------------------------------- */
/* MAIN LOADER                                                                */
/* -------------------------------------------------------------------------- */

export async function loadPostsFromSource(): Promise<Post[]> {
  // 1. Dev Mode Bypass (Optional: Remove if you always want real content)
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true') {
    console.log('[content-loader] Using mock posts data');
    return mockPosts;
  }

  try {
    // 2. Dynamic Import of the Enterprise Helper
    // We use the alias '@/lib/contentlayer-helper' to match your project config
    const ContentHelper = await import('@/lib/contentlayer-helper');
    
    // Use the unified method from v5.0.0
    const docs = ContentHelper.getAllDocuments();

    // 3. Map ContentDoc to Post Interface
    return docs.map((doc: any) => ({
      slug: doc.slug || doc._raw?.flattenedPath || '',
      title: doc.title || 'Untitled',
      date: doc.date || new Date().toISOString().split('T')[0],
      
      // Handle Contentlayer body fields safely
      content: doc.body?.raw || doc.content || '',
      
      // FIX: Map the specific MDX fields required by the Post type
      // Contentlayer generates 'code' for MDX, and sometimes 'html' if configured
      html: doc.body?.html || '', 
      compiledSource: doc.body?.code || '',

      excerpt: doc.excerpt || doc.description || '',
      description: doc.description || '',
      coverImage: doc.coverImage || doc.coverimage || '/assets/images/placeholder.jpg',
      published: doc.published !== false && doc.draft !== true,
      featured: !!doc.featured,
      category: doc.category || 'General',
      tags: doc.tags || [],
      author: doc.author || 'Abraham of London',
      readTime: doc.readTime || doc.readtime || '5 min read',
      subtitle: doc.subtitle || '',
      
      // Ensure "kind" is tracked if you need to filter mixed content later
      kind: doc.type ? doc.type.toLowerCase() : 'post' 
    } as unknown as Post));

  } catch (error) {
    console.warn('[content-loader] Contentlayer load failed, falling back to mocks.', error);
    // Return mocks so the build/page doesn't crash completely
    return mockPosts;
  }
}

export async function initializeAllContent(): Promise<{ posts: Post[] }> {
  const posts = await loadPostsFromSource();
  // Filter to ensure we mostly return what the UI expects (e.g. valid slugs)
  const validPosts = posts.filter(p => p.slug);
  console.log(`[content-loader] Initialized ${validPosts.length} documents`);
  return { posts: validPosts };
}

export function createContentLoader() {
  return {
    load: async () => await loadPostsFromSource()
  };
}

export default {
  loadPostsFromSource,
  initializeAllContent,
  createContentLoader
};
