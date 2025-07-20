import Link from 'next/link';

interface BookCardProps {
  slug: string;
  title: string;
  author?: string;
  coverImage?: string;
  excerpt?: string;
}

export const BookCard: React.FC<BookCardProps> = ({ slug, title, author, coverImage, excerpt }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {coverImage && (
        <img src={coverImage} alt={title} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-primary mb-2">{title}</h3>
        {author && <p className="text-sm text-gray-600 mb-2">by {author}</p>}
        {excerpt && <p className="text-gray-700 text-sm mb-4">{excerpt}</p>