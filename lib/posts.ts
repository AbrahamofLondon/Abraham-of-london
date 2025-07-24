// lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter'; // You might need to install gray-matter: npm install gray-matter

// Define the path to your markdown posts directory
const postsDirectory = path.join(process.cwd(), 'posts'); // Assuming your posts are in a 'posts' directory at the root

export interface PostMeta {
  title: string;
  date: string;
  excerpt: string;
  coverImage: string; // Corrected to coverImage based on your latest frontmatter
  category: string; // Assuming category is part of your frontmatter
  author: string;
  readTime: string; // Assuming readTime is part of your frontmatter
  slug: string; // The slug is typically the filename without extension
  // Added SEO interface for consistency, though it's optional here if only used in page
  seo?: {
    title: string;
    description: string;
    keywords: string;
  };
}

interface Post {
  slug: string;
  data: PostMeta;
  content: string;
}

export function getPostSlugs(): string[] {
  return fs.readdirSync(postsDirectory)
    // --- ADD THIS FILTER LINE ---
    .filter(fileName => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
    // --------------------------
    .map(fileName => fileName.replace(/\.mdx?$/, ''));
}

export function getPostBySlug(slug: string): Post {
  // Adjusted to handle both .md and .mdx extensions
  const potentialPaths = [`${slug}.md`, `${slug}.mdx`];
  let fullPath: string | undefined;

  for (const p of potentialPaths) {
    const currentPath = path.join(postsDirectory, p);
    if (fs.existsSync(currentPath)) {
      fullPath = currentPath;
      break;
    }
  }

  if (!fullPath) {
    throw new Error(`Post with slug "${slug}" not found.`);
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    data: data as PostMeta, // Cast data to PostMeta interface
    content,
  };
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  // Ensure we only try to get posts that actually exist after filtering
  const posts = slugs
    .map(slug => {
      try {
        return getPostBySlug(slug);
      } catch (error) {
        console.warn(`Could not load post with slug: ${slug}. It might be an invalid file.`);
        return null; // Return null for invalid posts
      }
    })
    .filter((post): post is Post => post !== null); // Filter out any nulls

  // Sort posts by date in descending order (newest first)
  posts.sort((a, b) => {
    const dateA = new Date(a.data.date);
    const dateB = new Date(b.data.date);
    return dateB.getTime() - dateA.getTime();
  });

  return posts;
}