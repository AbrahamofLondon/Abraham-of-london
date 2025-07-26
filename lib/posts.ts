// lib/posts.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// Define the directory where your posts are stored
const postsDirectory = join(process.cwd(), '_posts');

// Define the PostMeta type to match your frontmatter structure
export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  coverImage?: string; // Made optional as not all posts might have one
  excerpt: string;
  author: string;
  description: string; // THIS IS NOW REQUIRED AND WILL BE POPULATED
  readTime?: string; // Optional field
  category?: string; // Optional field
  tags?: string[]; // Optional field
  genre?: string[]; // Optional field for books/memoirs
  buyLink?: string; // Optional field for books/memoirs
  seo?: { // Optional SEO metadata
    title?: string;
    description?: string;
    keywords?: string;
  };
};

// Function to get all post slugs (filenames without .md)
export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

// Function to get a single post by its slug
export function getPostBySlug(slug: string, fields: string[] = []) {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Initialize an empty object to hold the post data
  const items: Partial<PostMeta & { content: string }> = {};

  // Ensure slug and content are included if requested
  if (fields.includes('slug')) {
    items.slug = realSlug;
  }
  if (fields.includes('content')) {
    items.content = content;
  }

  // Iterate over other requested fields and add them from frontmatter
  fields.forEach((field) => {
    if (field !== 'slug' && field !== 'content' && data[field] !== undefined) {
      // Special handling for tags, ensure it's an array
      if (field === 'tags' || field === 'genre') {
        items[field as keyof PostMeta] = Array.isArray(data[field]) ? data[field] : [data[field].toString()];
      } else {
        items[field as keyof PostMeta] = data[field];
      }
    }
  });

  // Manually ensure required fields are present with default values if not found in frontmatter
  // This helps satisfy the PostMeta type if fields are missing in some MD files
  if (items.title === undefined) items.title = '';
  if (items.date === undefined) items.date = '';
  if (items.excerpt === undefined) items.excerpt = '';
  if (items.author === undefined) items.author = '';
  if (items.description === undefined) items.description = ''; // Crucial for this fix

  return items as PostMeta & { content?: string }; // Cast to combined type
}


// Function to get all posts, optionally filtering by fields
export function getAllPosts(fields: string[] = []) {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    // Sort posts by date in descending order (newest first)
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}