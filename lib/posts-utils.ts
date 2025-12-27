import { Post, PostForClient, ImageType } from '@/types/post';

export function normalizeImageToUndefined(image: ImageType): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image.src) return image.src;
  return undefined;
}

export function transformPostForClient(post: Post): PostForClient {
  return {
    ...post,
    coverImage: normalizeImageToUndefined(post.coverImage as any),
    ogImage: normalizeImageToUndefined(post.ogImage as any),
    content: post.content || '',
    html: post.html || '',
    compiledSource: post.compiledSource || '',
  };
}
