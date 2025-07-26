// lib/posts.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// Define the directory where your posts are stored
const postsDirectory = join(process.cwd(), '_posts');

// Define the PostMeta type for metadata (content is handled separately when fetched)
export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  coverImage?: string;
  excerpt: string;
  author: string;
  description: string;
  image?: string; // Critical for the SEO image meta tag fix
  readTime?: string;
  category?: string;
  tags?: string[];
  genre?: string[];
  buyLink?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
};

// This type represents a post with its raw markdown content
export type PostWithContent = PostMeta & { content: string };

// Function to get all post slugs (filenames without .md)
export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

// Function to get a single post by its slug, dynamically typing return based on 'content' field
export function getPostBySlug(slug: string, fields: string[] = []): PostMeta | PostWithContent {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents); // 'content' from gray-matter is always a string

  // Initialize an object to build the post data
  const items: Partial<PostWithContent> = { slug: realSlug }; // Start with all possible fields as partial

  // If 'content' is requested, assign it directly (it's a string)
  if (fields.includes('content')) {
    items.content = content;
  }

  // Iterate over other requested fields and add them from frontmatter
  fields.forEach((field) => {
    // Exclude 'slug' and 'content' as they are handled explicitly
    if (field !== 'slug' && field !== 'content' && data[field] !== undefined) {
      if (field === 'tags' || field === 'genre') {
        items[field] = Array.isArray(data[field])
          ? data[field].map((tag: any) => String(tag))
          : [String(data[field])];
      } else if (field === 'seo') {
        if (typeof data[field] === 'object' && data[field] !== null) {
          items.seo = data[field];
        }
      } else {
        // Assign other fields directly
        (items as any)[field] = data[field]; // Using 'any' here for flexibility in dynamic assignment
      }
    }
  });

  // Manually ensure required fields are present with default values if not found in frontmatter
  // This helps satisfy the PostMeta type if fields are missing in some MD files
  if (items.title === undefined) items.title = '';
  if (items.date === undefined) items.date = '';
  if (items.excerpt === undefined) items.excerpt = '';
  if (items.author === undefined) items.author = '';
  if (items.description === undefined) items.description = '';
  if (items.image === undefined) items.image = '';

  // Return type depends on whether 'content' was requested
  if (fields.includes('content')) {
    return items as PostWithContent; // Content is guaranteed to be a string here
  } else {
    return items as PostMeta; // Only metadata, content is not guaranteed or not requested
  }
}

// Function to get all posts, optionally filtering by fields
// This function generally fetches only PostMeta (metadata)
export function getAllPosts(fields: string[] = []): PostMeta[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields) as PostMeta) // Cast here as getAllPosts typically doesn't need 'content'
    // Sort posts by date in descending order (newest first)
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}