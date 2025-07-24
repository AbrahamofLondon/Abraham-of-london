// components/Header.tsx
import Link from 'next/link';

interface HeaderProps {
  title?: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  author?: string;
  readTime?: string;
  slug?: string;
}

const Header: React.FC<HeaderProps> = ({
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
    <header className="bg-warmWhite p-4">
      <nav>
        <Link href="/" className="text-primary hover:text-gold">
          Home
        </Link>
        {slug && (
          <Link href={`/blog/${slug}`} className="text-primary hover:text-gold ml-4">
            {title || 'Blog Post'}
          </Link>
        )}
      </nav>
      {title && (
        <div>
          <h1 className="text-2xl font-display font-semibold">{title}</h1>
          {category && date && (
            <p className="text-sm text-softGrey">{category} • {date}</p>
          )}
          {author && readTime && (
            <p className="text-sm text-softGrey">By {author} • {readTime}</p>
          )}
          {coverImage && (
            <img src={coverImage} alt={title} className="w-full h-48 object-cover" />
          )}
          {excerpt && <p className="text-charcoal">{excerpt}</p>}
        </div>
      )}
    </header>
  );
};

export default Header;