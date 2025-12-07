// lib/content-utils.ts
import { 
  getAllPosts, 
  getAllBooks, 
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllCanons,
  getAllStrategies,
  type PostDocument 
} from "@/lib/mdx";

// Backward compatibility wrapper
export function getAllContent(collection?: string): PostDocument[] {
  const collectionMap = {
    // Blog/Posts
    'posts': getAllPosts,
    'post': getAllPosts,
    'blog': getAllPosts,
    'essay': getAllPosts,
    
    // Books
    'books': getAllBooks,
    'book': getAllBooks,
    'volume': getAllBooks,
    
    // Downloads
    'downloads': getAllDownloads,
    'download': getAllDownloads,
    'tool': getAllDownloads,
    'tools': getAllDownloads,
    
    // Events
    'events': getAllEvents,
    'event': getAllEvents,
    'session': getAllEvents,
    'sessions': getAllEvents,
    
    // Prints
    'prints': getAllPrints,
    'print': getAllPrints,
    'edition': getAllPrints,
    'editions': getAllPrints,
    
    // Resources
    'resources': getAllResources,
    'resource': getAllResources,
    'framework': getAllResources,
    'frameworks': getAllResources,
    
    // Canons
    'canons': getAllCanons,
    'canon': getAllCanons,
    
    // Strategies
    'strategies': getAllStrategies,
    'strategy': getAllStrategies,
  };

  if (!collection) {
    // Return all content combined
    return [
      ...getAllPosts(),
      ...getAllBooks(),
      ...getAllDownloads(),
      ...getAllEvents(),
      ...getAllPrints(),
      ...getAllResources(),
      ...getAllCanons(),
      ...getAllStrategies(),
    ];
  }

  const key = collection.toLowerCase() as keyof typeof collectionMap;
  const getter = collectionMap[key];
  
  if (getter) {
    return getter();
  }
  
  console.warn(`Unknown collection: ${collection}`);
  return [];
}

// Re-export everything
export { 
  getAllPosts, 
  getAllBooks, 
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllCanons,
  getAllStrategies,
  type PostDocument 
};