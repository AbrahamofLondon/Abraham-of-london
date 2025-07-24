// components/BlogCard.tsx
import React from 'react'; // Keep this import, it's necessary for React components
import Link from 'next/link';

interface BlogCardProps {
  title: string;
  date?: string; // Made optional
  excerpt: string;
  coverImage: string;
  category?: string; // Made optional
  author: string;
  readTime?: string; // Made optional
  slug: string;
}

const BlogCard: React.FC<BlogCardProps> = ({
  title,
  date,
  excerpt,
  coverImage,
  category,
  author,
  readTime,
  slug,
}) => {
  return (
    <article className="border rounded-lg shadow-sm overflow-hidden bg-warmWhite transition hover:shadow-md">
      {coverImage && (
        <img
          src={coverImage}
          alt={title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4 space-y-2">
        {/* Conditional rendering for category and date */}
        {category && date && (
          <p className="text-xs text-softGrey uppercase tracking-wide font-medium">
            {category} • {date}
          </p>
        )}
        <h3 className="text-xl font-display font-semibold text-primary leading-snug">
          {title}
        </h3>
        <p className="text-sm text-charcoal font-body">{excerpt}</p>
        <div className="flex justify-between items-center text-xs text-softGrey font-body pt-2 border-t border-softGrey/30">
          <span>By {author}</span>
          {/* Conditional rendering for readTime */}
          {readTime && <span>{readTime}</span>}
        </div>
        <Link
          href={`/blog/${slug}`}
          className="inline-block mt-3 text-sm text-primary underline font-body hover:text-gold"
        >
          Read Post
        </Link>
      </div>
    </article>
  );
};

export default BlogCard;