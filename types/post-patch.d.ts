/// types/post-patch.d.ts
declare module "@/types/post" {
  export interface Post {
    slug: string;
    title: string;
    date: string;
    excerpt?: string;
    content?: string;
    subtitle?: string;
    tags?: string[];
    author?: string;
    status?: "published" | "draft" | "archived";
    featured?: boolean;
    image?: string;
    imageAlt?: string;
  }

  export interface PostWithContent extends Post {
    content: string;
    readingTime: number;
    wordCount: number;
  }

  export interface PostMeta {
    slug: string;
    title: string;
    date: string;
    excerpt?: string;
    subtitle?: string;
    tags?: string[];
    author?: string;
    status?: "published" | "draft" | "archived";
    featured?: boolean;
    image?: string;
    imageAlt?: string;
  }

  export type PostList = PostMeta[];

  export interface PostFilters {
    tag?: string;
    author?: string;
    status?: string;
    featured?: boolean;
    search?: string;
  }

  export interface PostPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }

  export interface PostResponse {
    posts: PostList;
    pagination: PostPagination;
    filters?: PostFilters;
  }

  export function getAllPosts(filters?: PostFilters): PostList;
  export function getPostBySlug(slug: string): PostWithContent | null;
  export function getPostsByTag(tag: string): PostList;
  export function getFeaturedPosts(): PostList;
  export function getRecentPosts(limit?: number): PostList;
}
