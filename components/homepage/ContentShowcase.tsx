// components/homepage/ContentShowcase.tsx
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import BlogPostCard from '../BlogPostCard';
import BookCard from '../BookCard';
import { Post, Book } from '@/types';

interface ContentShowcaseProps {
  title: string;
  subtitle: string;
  items: Post[] | Book[];
  type: 'post' | 'book';
  link: string;
  linkText: string;
}

const containerVariants = {
  initial: { opacity: 0 },
  whileInView: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  whileInView: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

const ContentShowcase: React.FC<ContentShowcaseProps> = ({ title, subtitle, items, type, link, linkText }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="container mx-auto max-w-6xl px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl font-bold text-forest mb-2">{title}</h2>
        <p className="text-deepCharcoal text-lg">{subtitle}</p>
      </div>

      <motion.div
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, amount: 0.1 }}
      >
        {items.map((item, index) => (
          <motion.div key={index} variants={itemVariants}>
            {type === 'post' ? <BlogPostCard {...(item as Post)} /> : <BookCard {...(item as Book)} />}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="text-center mt-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Link
          href={link}
          className="text-lg font-semibold text-forest hover:text-emerald-700 transition-colors"
        >
          {linkText}{' '}
          <svg
            className="inline-block w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </motion.div>
    </section>
  );
};

export default ContentShowcase;