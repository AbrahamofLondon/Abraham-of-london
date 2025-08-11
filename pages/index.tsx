import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import BlogPostCard from '../components/BlogPostCard';
import BookCard from '../components/BookCard';
import SocialLinks from '../components/SocialLinks';
import { getAllPosts, PostMeta } from '../lib/posts';
import { getAllBooks, BookMeta } from '../lib/books';

// Centralized configuration for assets and links
const siteConfig = {
  socialLinks: [
    { href: 'mailto:info@abrahamoflondon.org', label: 'Email', icon: '/assets/images/social/email.svg' },
    { href: 'tel:+442086225909', label: 'Phone', icon: '/assets/images/social/phone.svg' },
    {
      href: 'https://www.linkedin.com/in/abraham-adaramola-06630321/',
      label: 'LinkedIn',
      icon: '/assets/images/social/linkedin.svg',
      external: true,
    },
    {
      href: 'https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09',
      label: 'X',
      icon: '/assets/images/social/twitter.svg',
      external: true,
    },
    {
      href: 'https://www.facebook.com/share/1MRrKpUzMG/',
      label: 'Facebook',
      icon: '/assets/images/social/facebook.svg',
      external: true,
    },
    {
      href: 'https://wa.me/+447496334022',
      label: 'WhatsApp',
      icon: '/assets/images/social/whatsapp.svg',
      external: true,
    },
  ],
  assets: {
    heroBanner: '/assets/images/abraham-of-london-banner.webp',
    profilePortrait: '/assets/images/profile-portrait.webp',
    ogImage: '/assets/social/og-image.jpg',
  },
};

type Post = Required<
  Pick<PostMeta, 'slug' | 'title' | 'date' | 'excerpt' | 'coverImage' | 'author' | 'readTime' | 'category'>
>;

type Book = Required<Pick<BookMeta, 'slug' | 'title' | 'author' | 'excerpt' | 'coverImage' | 'buyLink'>> & {
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
};

interface HomeProps {
  posts: Post[];
  books: Book[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const postsData = getAllPosts([
    'slug',
    'title',
    'date',
    'publishedAt',
    'excerpt',
    'coverImage',
    'author',
    'readTime',
    'category',
  ]);

  const booksData = getAllBooks([
    'slug',
    'title',
    'author',
    'excerpt',
    'coverImage',
    'buyLink',
    'genre',
    'downloadPdf',
    'downloadEpub',
  ]);

  const posts: Post[] = postsData.map((p) => ({
    slug: p.slug || '',
    title: p.title || 'Untitled Post',
    date: (p.date || p.publishedAt || '') as string,
    excerpt: p.excerpt || 'Read more for full details.',
    coverImage:
      typeof p.coverImage === 'string' && p.coverImage.trim()
        ? p.coverImage
        : '/assets/images/blog/default-blog-cover.jpg',
    author: p.author || 'Abraham of London',
    readTime: p.readTime || '5 min read',
    category: p.category || 'General',
  }));

  const books: Book[] = booksData.map((b) => ({
    slug: b.slug || '',
    title: b.title || 'Untitled Book',
    author: b.author || 'Abraham of London',
    excerpt: b.excerpt || 'Read more for full details.',
    coverImage:
      typeof b.coverImage === 'string' && b.coverImage.trim() ? b.coverImage : '/assets/images/default-book.jpg',
    buyLink: b.buyLink || '#',
    genre: Array.isArray(b.genre) ? b.genre.filter(Boolean).join(', ') : b.genre || 'Uncategorized',
    downloadPdf: b.downloadPdf ?? null,
    downloadEpub: b.downloadEpub ?? null,
  }));

  return {
    props: {
      posts: posts.slice(0, 3),
      books: books.slice(0, 3),
    },
    revalidate: 60,
  };
};

export default function Home({ posts, books }: HomeProps) {
  const featured = books[0];

  const bookJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: books.map((book, index) => ({
      '@type': 'Book',
      position: index + 1,
      name: book.title,
      url: `/books/${book.slug}`,
      image: book.coverImage,
      author: {
        '@type': 'Person',
        name: book.author,
      },
    })),
  };

  const postJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((post, index) => ({
      '@type': 'BlogPosting',
      position: index + 1,
      headline: post.title,
      url: `/blog/${post.slug}`,
      image: post.coverImage,
      author: {
        '@type': 'Person',
        name: post.author,
      },
    })),
  };

  return (
    <Layout>
      <Head>
        <title>Abraham of London</title>
        <meta
          name="description"
          content="Official site of Abraham of London – author, strategist, and fatherhood advocate."
        />
        <meta property="og:title" content="Abraham of London" />
        <meta
          property="og:description"
          content="Official site of Abraham of London – author, strategist, and fatherhood advocate."
        />
        <meta property="og:image" content={siteConfig.assets.ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={siteConfig.assets.ogImage} />
        {books.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
        )}
        {posts.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }} />
        )}
      </Head>

      {/* Hero */}
      <header className="bg-forest text-cream">
        <div className="relative w-full h-64 sm:h-96">
          <Image
            src={siteConfig.assets.heroBanner}
            alt="Abraham of London — strategic leadership and fatherhood advocacy"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h1 className="font-serif tracking-brand text-3xl sm:text-5xl font-bold text-center">Abraham of London</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-12">
        {/* About + Social */}
        <section className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div>
            <h2 className="font-serif text-2xl tracking-brand text-forest mb-4">About Abraham</h2>
            <p className="mb-4 text-deepCharcoal">
              Abraham of London is an author, strategist, and fatherhood advocate passionate about family, leadership,
              and legacy.
            </p>
            <SocialLinks links={siteConfig.socialLinks} />
          </div>

          <div className="relative w-64 h-64 mx-auto">
            <Image
              src={siteConfig.assets.profilePortrait}
              alt="Portrait of Abraham of London"
              fill
              className="rounded-full shadow-card object-cover"
              sizes="256px"
              priority={false}
            />
          </div>
        </section>

        {/* Featured Book */}
        {featured && (
          <section className="mb-16">
            <div className="rounded-2xl border border-lightGrey bg-white p-6 shadow-card">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="relative w-full h-72 rounded-lg overflow-hidden">
                  <Image
                    src={featured.coverImage || '/assets/images/default-book.jpg'}
                    alt={featured.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-forest mb-1">Featured Book</h3>
                  <h4 className="text-xl font-semibold text-deepCharcoal mb-1">{featured.title}</h4>
                  <p className="text-sm text-deepCharcoal/70 mb-4">By {featured.author}</p>
                  <p className="text-deepCharcoal mb-6">{featured.excerpt}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/books/${featured.slug}`}
                      className="bg-forest text-cream px-4 py-2 rounded-[6px] hover:bg-midGreen transition-colors cursor-pointer"
                    >
                      Learn more
                    </Link>
                    {featured.downloadPdf && (
                      <a
                        href={featured.downloadPdf}
                        className="border border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream transition-colors cursor-pointer"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download PDF of ${featured.title}`}
                      >
                        Download PDF
                      </a>
                    )}
                    {featured.downloadEpub && (
                      <a
                        href={featured.downloadEpub}
                        className="border border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream transition-colors cursor-pointer"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download EPUB of ${featured.title}`}
                      >
                        Download EPUB
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <hr className="my-12 border-lightGrey" />

        {/* Books */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Books</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        </section>

        <hr className="my-12 border-lightGrey" />

        {/* Posts */}
        <section>
          <h2 className="font-serif text-2xl tracking-brand text-forest mb-6">Latest Posts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}