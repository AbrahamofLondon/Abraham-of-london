// components/BlogPostCard.tsx (Previously BlogCard.tsx)
import Link from 'next/link';
import Image from 'next/image';

// Rename the interface as well for clarity and consistency
interface BlogPostCardProps {
  slug: string;
  title: string;
  date: string;
  coverImage: string;
  excerpt: string;
  author: string;
  readTime: string;
  category: string;
  tags: string[];
  // Add other props if your design uses them
}

// Rename the component
const BlogPostCard: React.FC<BlogPostCardProps> = ({
  slug,
  title,
  date,
  coverImage,
  excerpt,
  author,
  readTime,
  category,
  tags,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out">
      {coverImage && (
        <div className="relative w-full h-48">
          <Image
            src={coverImage}
            alt={`Cover image for ${title}`}
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      <div className="p-6">
        <Link href={`/blog/${slug}`}>
          <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 transition duration-300 cursor-pointer mb-2">
            {title}
          </h3>
        </Link>
        <p className="text-gray-500 text-sm mb-2">
          {new Date(date).toLocaleDateString()} | {readTime} read
        </p>
        <p className="text-gray-700 text-base mb-4">{excerpt}</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{category}</span>
          {tags.map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{tag}</span>
          ))}
        </div>
        <div className="mt-4 text-right">
          <Link href={`/blog/${slug}`} className="text-blue-600 hover:underline font-medium">
            Read Post &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard; // Export the new name