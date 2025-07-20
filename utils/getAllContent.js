// utils/getAllContent.js

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export function getAllContent(contentType) {
  const directory = path.join(process.cwd(), 'content', contentType);
  const filenames = fs.readdirSync(directory);

  return filenames.map((filename) => {
    const slug = filename.replace('.mdx', '');
    const fileContent = fs.readFileSync(path.join(directory, filename), 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    return {
      slug,
      frontmatter: {
        title: frontmatter.title || '',
        date: frontmatter.date || '',
        excerpt: frontmatter.excerpt || '',
        coverImage: frontmatter.coverImage || '',
        category: frontmatter.category || '',
        author: frontmatter.author || 'Abraham of London',
        readTime: frontmatter.readTime || '',
      },
      content,
    };
  });
}