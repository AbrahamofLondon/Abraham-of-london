// components/BlogPostCard.tsx
import Link from 'next/link';
import Image from 'next/image';

interface BlogPostCardProps {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  date: string;
  author?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({
  slug,
  title,
  excerpt,
  coverImage,
  date,
  author,
}) => {
  const imageSrc = coverImage || '/assets/images/default-book.jpg';

  return (
    <article className="border rounded-xl shadow-md p-4 mb-6 bg-white dark:bg-zinc-900">
      <Link href={`/posts/${slug}`} className="block">
        <div className="relative w-full h-64 mb-4 rounded-md overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, 33vw"
            priority
          />
        </div>
        <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-1">{title}</h3>
      </Link>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{date}</p>
      {author && <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">By {author}</p>}
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{excerpt}</p>
    </article>
  );
};

export default BlogPostCard;
