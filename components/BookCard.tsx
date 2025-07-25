// components/BookCard.tsx
import Link from 'next/link';
import Image from 'next/image';

interface BookCardProps {
  slug: string;
  title: string;
  coverImage: string;
  excerpt: string;
  buyLink: string; // <--- ADD THIS LINE
  // Add any other props you pass to BookCard
}

const BookCard: React.FC<BookCardProps> = ({
  slug,
  title,
  coverImage,
  excerpt,
  buyLink, // <--- Destructure buyLink here
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out">
      {coverImage && (
        <Image
          src={coverImage}
          alt={`Cover image for ${title}`}
          width={400} // Adjust based on your design needs
          height={300} // Adjust based on your design needs
          layout="responsive" // Make image responsive
          objectFit="cover"
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{excerpt}</p>
        <div className="flex justify-between items-center">
          <Link href={`/books/${slug}`} className="text-blue-600 hover:underline font-medium">
            Read More
          </Link>
          {buyLink && (
            <a
              href={buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-4 py-2 rounded-full text-sm hover:bg-green-600 transition duration-300"
            >
              Buy Now
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;