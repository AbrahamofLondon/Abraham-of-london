// components/blog/BlogCard.migrated.tsx
// Migrated version using UnifiedCard

'use client';

import { UnifiedCard } from '@/components/primitives/UnifiedCard';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    date: string;
    excerpt?: string;
    tags?: string[];
  };
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <UnifiedCard
      title={post.title}
      href={`/blog/${post.slug}`}
      excerpt={post.excerpt}
      date={post.date}
      tags={post.tags}
      variant="default"
      layout="vertical"
      showMeta={true}
      showTags={true}
      showCta={true}
    />
  );
}