// components/FeaturedBook.tsx
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  ctaHref: string; // usually /books/[slug]
};

const FeaturedBook: React.FC<Props> = ({ slug, title, author, excerpt, coverImage, ctaHref }) => {
  return (
    <Link
      href={ctaHref}
      className="group block rounded-2xl overflow-hidden bg-deepCharcoal text-cream shadow-card hover:shadow-cardHover transition-shadow"
    >
      <div className="relative h-64 sm:h-80">
        <Image
          src={coverImage || '/assets/images/default-book.jpg'}
          alt={title}
          fill
          sizes="100vw"
          className="object-cover opacity-80 group-hover:opacity-90 transition-opacity"
          priority
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-softGold mb-1 group-hover:translate-x-0.5 transition-transform">
          {title}
        </h3>
        <p className="text-sm opacity-90 mb-2">{author}</p>
        <p className="text-sm opacity-80">{excerpt}</p>
        <span className="inline-block mt-4 bg-forest text-cream px-4 py-2 rounded-md">
          Explore
        </span>
      </div>
    </Link>
  );
};

export default FeaturedBook;
