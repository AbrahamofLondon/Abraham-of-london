// lib/og.ts

// Point to the API route that will generate the image.
// This is a much more powerful and flexible approach.
export function generatedCover(slug?: string, title?: string) {
  if (title && slug) {
    // Return an absolute URL to the API route that generates the image.
    // The query parameters can be used to customize the image.
    return `/api/og?title=${encodeURIComponent(title)}&slug=${encodeURIComponent(slug)}`;
  }
  // Fallback to the default image if title or slug is missing.
  return "/assets/images/blog/default-blog-cover.jpg";
}






