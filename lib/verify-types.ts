// lib/verify-types.ts
import type { PostMeta } from "@/types/post";

// Test that PostMeta accepts metadata fields (content fields are NOT required here)
const testPostMeta: PostMeta = {
  slug: "test",
  title: "Test Post",
  date: "2024-01-01",
  excerpt: "Test excerpt",
  published: true,
  featured: false,
  category: "test",
  tags: ["test"],
  author: "Test Author",
  readTime: "5 min",
  description: "Test description",
  coverImage: "/images/test.jpg",
  subtitle: "Test Subtitle",
};

console.log("✅ PostMeta type verification passed");
console.log("  Slug:", testPostMeta.slug);
console.log("  Cover Image:", testPostMeta.coverImage);
console.log("  Description:", testPostMeta.description);
