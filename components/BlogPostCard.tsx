// components/BlogPostCard.tsx
import Link from 'next/link';
import Image from 'next/image';

interface BlogPostCardProps {
  slug: string;
  title: string;
  date: string;
  coverImage?: string; // <--- THIS IS THE CRITICAL LINE THAT MUST BE 'coverImage?: string;'
  excerpt: string;
  author: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  description?: string;
}

const BlogPostCard = ({
  slug,
  title,
  date,
  coverImage,
  excerpt,
  author,
  readTime,
  category,
  tags,
  description,
}: BlogPostCardProps) => {

  return (
    <Link href={`/blog/${slug}`} passHref>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
        {coverImage ? (
          <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium">
            No Cover Image
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{title}</h2>
          <p className="text-gray-600 text-sm mb-3">{date} {readTime && `• ${readTime}`}</p>
          <p className="text-gray-700 leading-relaxed mb-4 flex-grow">
            {description || excerpt}
          </p>
          <div className="flex flex-wrap gap-2 text-xs mt-auto">
            {category && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{category}</span>
            )}
            {tags && tags.map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{tag}</span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">By {author}</p>
        </div>
      </div>
    </Link>
  );
};

export default BlogPostCard;