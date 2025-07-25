import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Interface defining the post metadata structure
export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  coverImage: string;
  excerpt: string;
  author: string;
  readTime: string;
  category: string;
  tags: string[];
  // Add an index signature if you plan to dynamically access properties by string key
  // [key: string]: any;
}

// Service to handle file system operations (Dependency Inversion)
interface FileSystem {
  readDirSync(directory: string): string[];
  readFileSync(filePath: string, encoding: BufferEncoding): string;
}

class NodeFileSystem implements FileSystem {
  readDirSync(directory: string): string[] {
    return fs.readdirSync(directory);
  }

  readFileSync(filePath: string, encoding: BufferEncoding): string {
    return fs.readFileSync(filePath, encoding);
  }
}

// Post service to encapsulate data retrieval logic
class PostService { // <--- THIS CLASS WRAPPER IS CRUCIAL
  private readonly fs: FileSystem;
  private readonly postsDirectory: string;

  constructor(fs: FileSystem, postsDirectory: string) {
    this.fs = fs;
    this.postsDirectory = postsDirectory;
  }

  // Fetch all post slugs
  getPostSlugs(): string[] {
    return this.fs.readDirSync(this.postsDirectory).map((fileName) => fileName.replace(/\.mdx$/, ''));
  }

  // Fetch a single post by slug
  getPostBySlug(slug: string, fields: (keyof PostMeta)[] = []): Partial<PostMeta> {
    const fullPath = path.join(this.postsDirectory, `${slug}.mdx`);
    try {
      const fileContents = this.fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      // Normalize tags to always be an array
      const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags.toString()] : [];

      const post: PostMeta = {
        slug,
        title: data.title || '',
        date: data.date || '',
        coverImage: data.coverImage || '',
        excerpt: data.excerpt || '',
        author: data.author || '',
        readTime: data.readTime || '',
        category: data.category || '',
        tags,
      };

      return this.selectFields(post, fields);
    } catch (error) {
      console.error(`Error reading post ${slug}:`, error);
      return {};
    }
  }

  // Fetch all posts
  getAllPosts(fields: (keyof PostMeta)[] = []): PostMeta[] {
    const fileNames = this.fs.readDirSync(this.postsDirectory);
    return fileNames.map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(this.postsDirectory, fileName);
      try {
        const fileContents = this.fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);

        // Normalize tags to always be an array
        const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags.toString()] : [];

        const post: PostMeta = {
          slug,
          title: data.title || '',
          date: data.date || '',
          coverImage: data.coverImage || '',
          excerpt: data.excerpt || '',
          author: data.author || '',
          readTime: data.readTime || '',
          category: data.category || '',
          tags,
        };

        return this.selectFields(post, fields) as PostMeta;
      } catch (error) {
        console.error(`Error reading post ${fileName}:`, error);
        return {} as PostMeta;
      }
    }).filter((post) => Object.keys(post).length > 0).sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  // Helper method to select fields with type safety
  private selectFields(post: PostMeta, fields: (keyof PostMeta)[]): Partial<PostMeta> {
    return fields.reduce((acc, field) => {
      // Type-safe assignment using a type guard, ensuring post is indexed correctly
      // Since `PostMeta` should have `[key: string]: any;` (similar to BookMeta),
      // or if not, the explicit cast below is a fallback for `strict: true`.
      if (Object.prototype.hasOwnProperty.call(post, field)) {
          (acc as any)[field] = (post as any)[field];
      }
      return acc;
    }, {} as Partial<PostMeta>);
  }
}

// Export a singleton instance for use
export const postService = new PostService(new NodeFileSystem(), path.join(process.cwd(), 'posts'));

// Export functions for convenience (these call the service methods)
export const getPostSlugs = () => postService.getPostSlugs();
export const getPostBySlug = (slug: string, fields: (keyof PostMeta)[] = []) =>
  postService.getPostBySlug(slug, fields);
export const getAllPosts = (fields: (keyof PostMeta)[] = []) => postService.getAllPosts(fields);