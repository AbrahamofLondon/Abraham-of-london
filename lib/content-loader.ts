/* lib/content-loader.ts — SYSTEMATIC MDX LOADER FOR INTELLIGENCE ASSETS */
import { allPosts, Post as ContentlayerPost } from 'contentlayer/generated';
import { Post } from '@/types/post';
import { compareDesc, parseISO } from 'date-fns';

/**
 * PRODUCTION-GRADE CONTENT LOADER
 * Orchestrates the retrieval of the 75-brief portfolio with strict type safety.
 */

export async function loadPostsFromSource(): Promise<Post[]> {
  try {
    // 1. Fetch documents from the auto-generated Contentlayer cache
    // This is the most efficient method for 75+ documents
    const documents = allPosts;

    if (!documents || documents.length === 0) {
      console.warn('[content-loader] No documents found in Contentlayer cache.');
      return [];
    }

    // 2. Map Contentlayer documents to the Unified Post Interface
    const mappedPosts: Post[] = documents
      .map((doc) => {
        // Calculate dynamic reading time if not provided in frontmatter
        const wordsPerMinute = 200;
        const noOfWords = doc.body.raw.split(/\s/g).length;
        const minutes = Math.ceil(noOfWords / wordsPerMinute);
        const autoReadTime = `${minutes} min read`;

        return {
          slug: doc.slug || doc._raw.flattenedPath,
          title: doc.title || 'Untitled Brief',
          subtitle: doc.subtitle || '',
          date: doc.date,
          
          // Content Handling: Providing both raw and compiled MDX
          content: doc.body.raw,
          html: doc.body.html || '',
          compiledSource: doc.body.code, // This is required for <MDXRemote /> hydration

          excerpt: doc.excerpt || doc.description || '',
          description: doc.description || '',
          coverImage: doc.coverImage || '/assets/images/placeholders/brief-default.jpg',
          
          // Security & Status
          published: doc.published !== false,
          featured: !!doc.featured,
          category: doc.category || 'Intelligence',
          tags: doc.tags || [],
          author: doc.author || 'Abraham of London',
          readTime: doc.readTime || autoReadTime,
          
          // Institutional Metadata (Extension for the 75-brief series)
          kind: doc.type?.toLowerCase() || 'post',
          classification: (doc as any).classification || 'Unclassified',
          series: (doc as any).series || 'General',
          volume: (doc as any).volume || 1
        } as Post;
      })
      // 3. Systematic Filtering & Sorting
      .filter((post) => process.env.NODE_ENV === 'development' || post.published)
      .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));

    console.log(`[content-loader] Systematically indexed ${mappedPosts.length} assets.`);
    return mappedPosts;

  } catch (error) {
    console.error('[content-loader] CRITICAL_LOAD_FAILURE:', error);
    // In production, we return an empty array to prevent build-time crashes
    // while the error is logged to the system audit.
    return [];
  }
}

/**
 * INITIALIZER
 * Used in getStaticProps or generateStaticParams for the 75-brief grid.
 */
export async function initializeAllContent(): Promise<{ posts: Post[] }> {
  const posts = await loadPostsFromSource();
  return { posts };
}

/**
 * API WRAPPER
 */
export const contentLoaderApi = {
  loadPostsFromSource,
  initializeAllContent,
  // Helper for single asset retrieval
  getPostBySlug: async (slug: string) => {
    const posts = await loadPostsFromSource();
    return posts.find(p => p.slug === slug) || null;
  }
};

export default contentLoaderApi;