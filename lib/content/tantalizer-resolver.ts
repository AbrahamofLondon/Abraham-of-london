// lib/content/tantalizer-resolver.ts — HARDENED (Intelligence Teaser Logic)
import { Post } from "contentlayer/generated";

export interface Tantalizer {
  content: string;
  isTruncated: boolean;
  wordCount: number;
}

export function resolveTantalizer(post: Post): Tantalizer {
  // 1. Check for explicit preview field in MDX frontmatter
  if (post.summary || (post as any).preview) {
    return {
      content: post.summary || (post as any).preview,
      isTruncated: true,
      wordCount: (post.summary || "").split(/\s+/).length,
    };
  }

  // 2. Fallback: Extract first 300 characters of raw body
  const rawBody = post.body.raw || "";
  const cleanBody = rawBody
    .replace(/[#*`_]/g, "") // Strip basic markdown symbols
    .replace(/\[.*\]\(.*\)/g, "") // Strip links
    .trim();

  const teaser = cleanBody.slice(0, 300);
  const isTruncated = cleanBody.length > 300;

  return {
    content: isTruncated ? `${teaser.trim()}...` : teaser,
    isTruncated,
    wordCount: teaser.split(/\s+/).length,
  };
}