// types/post-extensions.d.ts - Type declaration merge
import { Post } from './post';

// Ensure Post has coverImage
declare module './post' {
  interface Post {
    coverImage?: string | { src?: string } | null;
  }
}

// Re-export everything
export * from './post';

