// Simple, safe fallback for post covers.
// You can make this smarter later, but this will never fail builds.
export function generatedCover(_slug: string): string {
  // Choose a high-quality, wide image that definitely exists in /public.
  // From your screenshots this path exists:
  return "/assets/images/abraham-of-london-banner.webp";
  // If you prefer another fallback you have, swap to:
  // return "/assets/images/writing-desk.webp";
  // or  "/assets/images/blog/fathering-without-fear-teaser.jpg"
}
