import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPostCardProps {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  date?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ slug, title, excerpt, coverImage, date }) => {
  const imageSrc = coverImage || '/assets/images/default-book.jpg';

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white flex flex-col">
      <Link href={`/blog/${slug}`} className="relative w-full h-52">
        <Image
          src={imageSrc}
          alt={title}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="transition-transform duration-200 hover:scale-105"
        />
      </Link>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          {date && <p className="text-sm text-gray-500 mb-2">{new Date(date).toLocaleDateString()}</p>}
          <p className="text-gray-700 text-sm">{excerpt}</p>
        </div>

        <div className="mt-4">
          <Link href={`/blog/${slug}`} className="text-blue-600 hover:underline font-medium">
            Read More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard;
