// lib/posts.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// CORRECTED: Changed 'posts' to 'content/posts' for consistency with 'content/books'
// You must ensure your actual blog post .mdx files are in a folder named 'content/posts'
const postsDirectory = join(process.cwd(), 'content/posts');

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
  genre?: string[]; // Although posts usually don't have 'genre', keeping for type consistency if desired
  buyLink?: string; // Although posts usually don't have 'buyLink', keeping for type consistency if desired
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
};

// This type represents a post with its raw markdown content
export type PostWithContent = PostMeta & { content: string };

// Function to get all post slugs (filenames without .mdx)
export function getPostSlugs() {
  // CORRECTED: Filter to only include .mdx files to prevent issues with other file types
  return fs.readdirSync(postsDirectory).filter(filename => filename.endsWith('.mdx'));
}

// Function to get a single post by its slug, dynamically typing return based on 'content' field
export function getPostBySlug(slug: string, fields: string[] = []): PostMeta | PostWithContent {
  // The slug replacement and fullPath construction are already correct
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = join(postsDirectory, `${realSlug}.mdx`); // Using '.mdx' extension

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents); // 'content' from gray-matter is always a string

  // Initialize an object to build the post data
  const items: Partial<PostWithContent> = { slug: realSlug };

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
        (items as any)[field] = data[field];
      }
    }
  });

  // Manually ensure required fields are present with default values if not found in frontmatter
  if (items.title === undefined) items.title = '';
  if (items.date === undefined) items.date = '';
  if (items.excerpt === undefined) items.excerpt = '';
  if (items.author === undefined) items.author = '';
  if (items.description === undefined) items.description = '';
  if (items.image === undefined) items.image = '';


  // Return type depends on whether 'content' was requested
  if (fields.includes('content')) {
    return items as PostWithContent;
  } else {
    return items as PostMeta;
  }
}

// Function to get all posts, optionally filtering by fields
// This function generally fetches only PostMeta (metadata)
export function getAllPosts(fields: string[] = []): PostMeta[] {
  const slugs = getPostSlugs(); // Now correctly filters for .mdx files
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields) as PostMeta)
    // Sort posts by date in descending order (newest first)
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}