// utils/image-utils.ts
import type { ImageType } from '@/types/post';

/**
 * Normalize image to string URL
 */
export function normalizeImage(image?: string | ImageType | null): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.src || null;
}

/**
 * Normalize image to string URL or undefined
 */
export function normalizeImageToUndefined(image?: string | ImageType | null): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  return image.src;
}

/**
 * Extract string from ImageType object
 */
export function imageToString(image?: string | ImageType | null): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  return image.src;
}
