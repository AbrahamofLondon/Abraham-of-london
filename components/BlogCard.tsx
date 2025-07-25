// components/BlogCard.tsx (Example structure if needed)
import Image from 'next/image';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    coverImage: string; // This will hold the path from MDX
    excerpt: string;
    // ... other properties
  };
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {post.coverImage && (
        <Image
          src={post.coverImage} // This uses the path from your MDX
          alt={post.title}
          width={400} // Adjust these
          height={250} // Adjust these (e.g., for blog post card aspect ratio)
          layout="responsive"
          objectFit="cover"
        />
      )}
      {/* ... rest of BlogCard content ... */}
    </div>
  );
};
export default BlogCard;