import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { formatDate, parseDate } from './dateUtils';
import { safeString, safeSplit } from './stringUtils';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  publishedAt: string;
  coverImage?: string;
  excerpt: string;
  author: string;
  description: string;
  image?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  genre?: string[];
  content?: string;
};

export function getPostSlugs(): string[] {
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn('Posts directory does not exist, creating it...');
      fs.mkdirSync(postsDirectory, { recursive: true });
      return [];
    }
    return fs.readdirSync(postsDirectory).filter(name => name.endsWith('.mdx') || name.endsWith('.md'));
  } catch (error) {
    console.error('Error reading posts directory:', error);
    return [];
  }
}

export function getPostBySlug(slug: string, fields: string[] = []): PostMeta {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);
  const fallbackPath = path.join(postsDirectory, `${realSlug}.md`);

  try {
    let fileContents: string;

    if (fs.existsSync(fullPath)) {
      fileContents = fs.readFileSync(fullPath, 'utf8');
    } else if (fs.existsSync(fallbackPath)) {
      fileContents = fs.readFileSync(fallbackPath, 'utf8');
    } else {
      throw new Error(`Post file not found: ${fullPath} or ${fallbackPath}`);
    }

    const { data, content } = matter(fileContents);

    const post: PostMeta = {
      slug: realSlug,
      title: safeString(data.title) || 'Untitled',
      date: formatDate(data.date || data.publishedAt),
      publishedAt: formatDate(data.date || data.publishedAt),
      excerpt: safeString(data.excerpt) || '',
      author: safeString(data.author) || 'Abraham of London',
      description: safeString(data.description) || '',
      content: content || '',
    };

    const allFields = Object.keys(data);
    const requestedFields = fields.length > 0 ? fields : ['slug', 'content', ...allFields];

    const postRecord: Partial<PostMeta> = { ...post };

    requestedFields.forEach((field) => {
      switch (field) {
        case 'slug':
          postRecord.slug = realSlug;
          break;
        case 'content':
          postRecord.content = content || '';
          break;
        case 'date':
        case 'publishedAt':
          if (data.date || data.publishedAt) {
            const formattedDate = formatDate(data.date || data.publishedAt);
            postRecord.date = formattedDate;
            postRecord.publishedAt = formattedDate;
          }
          break;
        case 'tags':
          if (data.tags) {
            postRecord.tags = Array.isArray(data.tags)
              ? data.tags.map(tag => safeString(tag))
              : safeSplit(safeString(data.tags), ',').map(tag => tag.trim()).filter(Boolean);
          }
          break;
        default:
          if (field in data) {
            postRecord[field as keyof PostMeta] = data[field];
          }
          break;
      }
    });

    return postRecord as PostMeta;
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return {
      slug: realSlug,
      title: 'Post Not Found',
      date: formatDate(new Date()),
      publishedAt: formatDate(new Date()),
      excerpt: '',
      author: 'Abraham of London',
      description: 'This post could not be loaded.',
      content: '',
    };
  }
}

export function getAllPosts(fields: string[] = []): PostMeta[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    .filter(post => post.title !== 'Post Not Found')
    .sort((post1, post2) => {
      const date1 = parseDate(post1.date);
      const date2 = parseDate(post2.date);
      return date2.getTime() - date1.getTime();
    });
  return posts;
}