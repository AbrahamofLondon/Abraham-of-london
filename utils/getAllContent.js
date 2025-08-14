import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Define the base directory for your content (e.g., 'content/blog', 'content/books')
// This assumes your project structure is like:
// - project-root/
//   - content/
//     - blog/
//       - post1.mdx
//     - books/
//       - book1.mdx
//   - utils/
//     - getAllContent.js

export function getAllContent(contentType) {
  const contentDirectory = path.join(process.cwd(), 'content', contentType);

  // Check if the content directory exists
  if (!fs.existsSync(contentDirectory)) {
    console.warn(`Warning: Content directory not found: ${contentDirectory}`);
    return []; // Return empty array if directory doesn't exist
  }

  // Get all file names in the content type directory
  // Filter for .mdx files and handle potential errors during readdirSync
  let fileNames = [];
  try {
    fileNames = fs.readdirSync(contentDirectory).filter(file => file.endsWith('.mdx'));
  } catch (error) {
    console.error(`Error reading directory ${contentDirectory}:`, error);
    return [];
  }

  const allContentData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, '');
    const fullPath = path.join(contentDirectory, fileName);

    // Check if the file exists and is readable before attempting to read
    if (!fs.existsSync(fullPath)) {
      console.warn(`Warning: File not found or inaccessible: ${fullPath}`);
      return null; // Skip this file
    }

    try {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      return {
        slug,
        frontmatter: data,
        content, // Include content for potential future use (e.g., on detail pages)
      };
    } catch (error) {
      console.error(`Error processing file ${fullPath}:`, error);
      return null; // Skip this file if there's an error reading or parsing
    }
  }).filter(Boolean); // Filter out any null entries from failed processing

  return allContentData;
}

// You might also want a function to get single content item (e.g., for [slug].tsx)
export function getContentBySlug(contentType, slug) {
  const contentDirectory = path.join(process.cwd(), 'content', contentType);
  const fullPath = path.join(contentDirectory, `${slug}.mdx`);

  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Content file not found: ${fullPath}`);
    return null;
  }

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    return {
      slug,
      frontmatter: data,
      content,
    };
  } catch (error) {
    console.error(`Error processing single file ${fullPath}:`, error);
    return null;
  }
}