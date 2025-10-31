// lib/content-fetcher.js

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Define the root directory where all your MDX content lives.
// Adjust this if your content is not in the project root.
const CONTENT_ROOT = process.cwd();

/**
 * Reads all MDX files in a given directory and extracts front matter.
 * @param {string} contentDir - The subdirectory (e.g., 'downloads', 'blog').
 * @returns {Array<Object>} An array of objects containing content front matter.
 */
export function getAllContent(contentDir) {
  const directoryPath = path.join(CONTENT_ROOT, contentDir);
  
  if (!fs.existsSync(directoryPath)) {
    console.warn(`[ContentFetcher] Directory not found: ${directoryPath}`);
    return [];
  }

  const fileNames = fs.readdirSync(directoryPath);

  const allContent = fileNames
    .filter(name => name.endsWith('.mdx') || name.endsWith('.md'))
    .map(fileName => {
      const fullPath = path.join(directoryPath, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      // Use gray-matter to parse the front matter (data)
      const { data } = matter(fileContents);
      
      // Determine the slug from the filename
      const slug = fileName.replace(/\.(mdx|md)$/, '');
      
      return { 
        ...data, 
        slug: data.slug || slug, // Use front matter slug if present, otherwise use filename
        fileName: fileName // Useful for debugging/linking
      };
    });

  return allContent;
}