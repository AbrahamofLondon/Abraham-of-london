// components/BookCard.tsx (Example structure)

import Image from 'next/image';
import Link from 'next/link'; // Assuming you use Link for navigation

// ... other imports ...

interface BookCardProps {
  slug: string; // <--- ADD THIS LINE
  title: string;
  coverImage: string;
  excerpt: string;
  // Add other props that your BookCard component needs,
  // such as buyLink, author, genre, etc.
}

const BookCard: React.FC<BookCardProps> = ({
  slug, // Make sure to destructure it here too
  title,
  coverImage,
  excerpt,
  // ... other destructured props
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105">
      {/* Assuming your BookCard has an image */}
      {coverImage && (
        <Image
          src={coverImage}
          alt={title}
          width={400} // Adjust based on your design
          height={600} // Adjust based on your design
          layout="responsive" // Or 'fill', 'intrinsic' based on your needs
          objectFit="cover"
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-700 text-base mb-4">{excerpt}</p>
        <Link href={`/books/${slug}`} passHref> {/* Using Link for navigation */}
          <span className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 cursor-pointer">
            Read More
          </span>
        </Link>
        {/* You might also have a buy button here */}
        {/* {buyLink && (
          <a href={buyLink} target="_blank" rel="noopener noreferrer" className="ml-4 inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-200">
            Buy Now
          </a>
        )} */}
      </div>
    </div>
  );
};

export default BookCard;