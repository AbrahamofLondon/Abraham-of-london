// components/BlogCard.tsx (Example structure)

// ... other imports ...

interface BlogCardProps {
  slug: string; 
  title: string;
  date: string;
  coverImage: string;
  excerpt: string;
  author: string; // Assuming these are also props
  readTime: string; // Assuming these are also props
  category: string; // Assuming these are also props
  tags: string[]; // Assuming these are also props
  // ... any other props your BlogCard component expects
}

const BlogCard: React.FC<BlogCardProps> = ({
  slug, // Make sure to destructure it here too
  title,
  date,
  coverImage,
  excerpt,
  author,
  readTime,
  category,
  tags,
  // ...
}) => {
  // ... component JSX, likely using `slug` in a Next.js <Link> component
  return (
    <a href={`/posts/${slug}`} className="block"> {/* Example usage with Link */}
      {/* ... rest of your BlogCard JSX */}
    </a>
  );
};

export default BlogCard;