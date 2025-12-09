// lib/verify-types.ts
import type { Post } from '@/types/post';

// Test that the Post type now accepts all properties
const testPost: Post = {
  slug: 'test',
  title: 'Test Post',
  date: '2024-01-01',
  excerpt: 'Test excerpt',
  content: 'Test content',
  published: true,
  featured: false,
  category: 'test',
  tags: ['test'],
  author: 'Test Author',
  readTime: '5 min',
  description: 'Test description',
  coverImage: '/images/test.jpg',
  subtitle: 'Test Subtitle'
};

console.log('✅ Post type verification passed');
console.log('  Slug:', testPost.slug);
console.log('  Cover Image:', testPost.coverImage);
console.log('  Description:', testPost.description);
