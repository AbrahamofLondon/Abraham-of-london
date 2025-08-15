// pages/books.tsx
import Head from "next/head";
import Image from "next/image";
import type { GetStaticProps } from "next";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useState, useMemo, useRef } from "react";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import { getAllBooks, type BookMeta } from "@/lib/books";
import { siteConfig } from "@/lib/siteConfig";

// --- Config & Utils ---
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://abraham-of-london.netlify.app"
).replace(/\/$/, "");

const abs = (path: string): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, SITE_URL).toString();
};

const ASSETS = {
  heroBanner: "/assets/images/abraham-of-london-banner.webp",
  booksCollage: "/assets/images/writing-desk.webp",
  profilePortrait: "/assets/images/profile-portrait.webp",
  ogImage: "/assets/images/social/og-image.jpg",
  twitterImage: "/assets/images/social/twitter-image.webp",
  defaultBookCover: "/assets/images/default-book.jpg",
  fallbacks: {
    hero: [
      "/assets/images/abraham-of-london-banner.webp",
      "/assets/images/writing-desk.webp",
      "/assets/images/profile-portrait.webp",
    ],
    collection: [
      "/assets/images/writing-desk.webp",
      "/assets/images/profile-portrait.webp",
      "/assets/images/default-book.jpg",
    ],
  },
} as const;

type Book = Required<
  Pick<BookMeta, "slug" | "title" | "author" | "excerpt" | "coverImage" | "buyLink">
> & {
  genre: string; // keep for BookCard compatibility
  genresList: string[]; // normalized for filtering
  downloadPdf: string | null;
  downloadEpub: string | null;
};

interface BooksProps {
  books: Book[];
  featuredBooks: Book[];
  categories: string[];
}

// --- Parallax Hook ---
const useParallax = (ref: React.RefObject<HTMLElement>) => {
  const { scrollYProgress } = useScroll({ target: ref });
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const yHero = useTransform(smooth, [0, 1], ["0%", "30%"]);
  const yBackground = useTransform(smooth, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(smooth, [0, 0.3], [1, 0]);
  return { yHero, yBackground, opacity };
};

// --- Animations ---
const microAnimations = {
  shimmer: {
    initial: { backgroundPosition: "200% 0" },
    animate: {
      backgroundPosition: ["-200% 0", "200% 0"],
      transition: { duration: 2, repeat: Infinity, ease: "linear" },
    },
  },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

// --- Enhanced Image with Fallbacks ---
interface EnhancedImageProps extends React.ComponentProps<typeof Image> {
  fallbacks?: readonly string[];
}
const EnhancedImage: React.FC<EnhancedImageProps> = ({
  src,
  fallbacks = [],
  alt,
  className = "",
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    const nextFallback = fallbacks.find((fb) => fb !== currentSrc);
    if (nextFallback) setCurrentSrc(nextFallback);
    else setHasError(true);
  };
  const handleLoad = () => setIsLoading(false);

  if (hasError && !fallbacks.length) {
    return (
      <div className={`bg-lightGrey/20 flex items-center justify-center ${className}`}>
        <span className="text-deepCharcoal/50 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r from-lightGrey/20 via-lightGrey/40 to-lightGrey/20 ${className}`}
          variants={microAnimations.shimmer}
          initial="initial"
          animate="animate"
        />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        className={`transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"} ${className}`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
};

// --- Filter ---
interface BookFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}
const BookFilter: React.FC<BookFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => (
  <motion.div
    className="flex flex-wrap gap-3 justify-center mb-12"
    variants={staggerContainer}
    initial="initial"
    whileInView="animate"
    viewport={{ once: true }}
  >
    {["All", ...categories].map((category) => (
      <motion.button
        key={category}
        onClick={() => onCategoryChange(category === "All" ? "" : category)}
        className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
          (category === "All" && selectedCategory === "") ||
          selectedCategory === category
            ? "bg-forest text-cream shadow-lg scale-105"
            : "bg-lightGrey/30 text-deepCharcoal hover:bg-lightGrey/50 hover:scale-105"
        }`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {category}
      </motion.button>
    ))}
  </motion.div>
);

// --- Page ---
export default function Books({ books, featuredBooks, categories }: BooksProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const containerRef = useRef<HTMLElement>(null);
  const { yHero, yBackground, opacity } = useParallax(containerRef);

  const filteredBooks = useMemo(() => {
    if (!selectedCategory) return books;
    return books.filter((book) => book.genresList.includes(selectedCategory));
  }, [books, selectedCategory]);

  const structuredData = useMemo(() => {
    const page = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Books by Abraham of London",
      url: `${SITE_URL}/books`,
      hasPart: books.slice(0, 12).map((b) => ({
        "@type": "Book",
        name: b.title,
        author: b.author,
        url: `${SITE_URL}/books/${b.slug}`,
        image: abs(typeof b.coverImage === "string" ? b.coverImage : ASSETS.defaultBookCover),
        genre: b.genresList,
      })),
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Books", item: `${SITE_URL}/books` },
      ],
    };
    return [page, breadcrumb];
  }, [books]);

  return (
    <Layout>
      <Head>
        <title>Books | {siteConfig.title}</title>
        <meta name="description" content="Explore books and writings by Abraham of London." />
        <meta name="author" content={siteConfig.author} />
        <meta property="og:title" content={`Books | ${siteConfig.title}`} />
        <meta property="og:description" content="Explore the writings and collections." />
        <meta property="og:image" content={abs(ASSETS.ogImage)} />
        <meta property="og:url" content={`${SITE_URL}/books`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={abs(ASSETS.twitterImage)} />
        <link rel="canonical" href={`${SITE_URL}/books`} />
        {structuredData.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      <div ref={containerRef as any} className="relative overflow-hidden">
        {/* Hero */}
        <motion.section
          className="relative h-[60vh] flex items-center justify-center text-center overflow-hidden"
          style={{ y: yHero }}
        >
          <motion.div style={{ y: yBackground, opacity }} className="absolute inset-0 z-0">
            <EnhancedImage
              src={ASSETS.booksCollage}
              fallbacks={ASSETS.fallbacks.hero}
              alt="A writing desk with books and a quill"
              className="object-cover w-full h-full"
              priority
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>
          <div className="relative z-10 p-6 bg-black/30 rounded-lg backdrop-blur-sm">
            <h1 className="text-4xl md:text-6xl font-serif text-cream">The Collection</h1>
            <p className="text-xl md:text-2xl mt-2 font-sans text-lightGrey">
              Explore the writings of Abraham of London
            </p>
          </div>
        </motion.section>

        <main className="container mx-auto px-4 py-16">
          {/* Featured */}
          <section className="mb-20">
            <h2 className="text-3xl md:text-5xl font-serif text-center mb-10 text-deepCharcoal">
              Featured Books
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredBooks.map((book) => (
                <BookCard key={book.slug} {...book} />
              ))}
            </div>
          </section>

          {/* All */}
          <section>
            <h2 className="text-3xl md:text-5xl font-serif text-center mb-10 text-deepCharcoal">
              All Books
            </h2>
            <BookFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.2 }}
            >
              {filteredBooks.map((book) => (
                <motion.div key={book.slug} variants={staggerItem}>
                  <BookCard {...book} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </main>
      </div>
    </Layout>
  );
}

// --- Data Fetching ---
export const getStaticProps: GetStaticProps<BooksProps> = async () => {
  try {
    const booksData = getAllBooks([
      "slug",
      "title",
      "author",
      "excerpt",
      "coverImage",
      "buyLink",
      "genre",
      "downloadPdf",
      "downloadEpub",
    ]);

    const books: Book[] = booksData
      .filter((b) => b && b.slug)
      .map((b, i) => {
        const cover =
          typeof b.coverImage === "string" && b.coverImage.trim()
            ? b.coverImage
            : ASSETS.defaultBookCover;

        const genresList = Array.isArray(b.genre)
          ? b.genre.filter(Boolean).map((g) => String(g).trim())
          : typeof b.genre === "string"
          ? b.genre
              .split(",")
              .map((g) => g.trim())
              .filter(Boolean)
          : ["Personal Development"];

        return {
          slug: b.slug || `book-${i}`,
          title: b.title || "Untitled Book",
          author: b.author || siteConfig.author,
          excerpt: b.excerpt || "A compelling read that will transform your perspective.",
          coverImage: cover,
          buyLink: b.buyLink || "#",
          genre: genresList.join(", "),
          genresList,
          downloadPdf: b.downloadPdf ?? null,
          downloadEpub: b.downloadEpub ?? null,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    const categories = Array.from(
      new Set(books.flatMap((b) => b.genresList)).values()
    ).sort();

    const featuredBooks = books.slice(0, 3);

    return {
      props: { books, featuredBooks, categories },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error fetching books data:", error);
    return {
      props: { books: [], featuredBooks: [], categories: [] },
      revalidate: 300,
    };
  }
};
