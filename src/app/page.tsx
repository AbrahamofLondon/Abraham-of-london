// src/app/page.tsx
'use client'; // This directive indicates that this is a Client Component

import { motion } from 'framer-motion'; // For animations
import Image from 'next/image'; // Import Image component for optimized images
import { useState } from 'react'; // Import useState for form handling

export default function Home() {
  // State for email input (optional, but good practice for controlled components)
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically integrate with an email marketing service (e.g., Mailchimp, ConvertKit)
    // For now, let's just log the email.
    console.log('Subscribing email:', email);
    alert(`Thank you for subscribing, ${email}!`);
    setEmail(''); // Clear the input field
  };

  // Define placeholder blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "The Silent Strength: Redefining Fatherhood",
      excerpt: "Explore how embracing vulnerability can transform the father-child bond and build an unbreakable foundation of love and respect.",
      date: "July 1, 2025",
      image: "/placeholder-blog-1.jpg", // Placeholder image path
      link: "#" // Placeholder link
    },
    {
      id: 2,
      title: "Beyond Expectations: Navigating Parental Challenges",
      excerpt: "A deep dive into overcoming unforeseen obstacles in parenting and finding resilience when the path forward seems unclear.",
      date: "June 25, 2025",
      image: "/placeholder-blog-2.jpg", // Placeholder image path
      link: "#" // Placeholder link
    },
    {
      id: 3,
      title: "Legacy & Leadership: Raising Visionary Children",
      excerpt: "Discover principles for instilling strong values and leadership qualities in your children, preparing them for a future of impact.",
      date: "June 18, 2025",
      image: "/placeholder-blog-3.jpg", // Placeholder image path
      link: "#" // Placeholder link
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-dark text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-dark via-deep-navy to-neutral-dark overflow-hidden">
        {/* Optional: Grid background overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

        <div className="relative z-10 text-center container-custom"> {/* container-custom for max-width and padding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-tight">
              Fathering Without Fear:
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-deep-gold to-warm-gold">
                The Story They Thought They Knew
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-off-white max-w-3xl mx-auto leading-relaxed">
              Courage. Truth. Redemption.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <button className="btn-primary">
                Discover the Story →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="section-padding bg-soft-white text-neutral-dark">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <p className="text-lg md:text-xl font-sans leading-relaxed mb-8">
              This is where a brief, powerful introduction summarizing Abraham's personal story will go. It should captivate the reader, hinting at the journey of courage, truth, and redemption that led to "Fathering Without Fear." Aim for 50-80 words max to keep it concise and impactful.
            </p>
            <button className="btn-secondary !border-neutral-dark !text-neutral-dark hover:!bg-neutral-dark hover:!text-soft-white">
              About Abraham
            </button>
          </motion.div>
        </div>
      </section>

      {/* Book Showcase Section */}
      <section className="section-padding bg-neutral-dark text-white">
        <div className="container-custom">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-serif font-bold text-center mb-12 text-deep-gold"
          >
            Explore the Books
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8">
            {/* Memoir Book Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center text-center p-6 rounded-lg border border-deep-navy shadow-lg bg-neutral-dark/50"
            >
              <Image
                src="/fathering-without-fear-cover.jpg" // Confirmed actual book cover image path
                alt="Fathering Without Fear Book Cover"
                width={300}
                height={450}
                className="rounded-lg shadow-xl mb-6 transform hover:scale-105 transition-transform duration-300"
              />
              <h3 className="text-3xl font-serif font-bold mb-4 text-off-white">
                Fathering Without Fear
              </h3>
              <p className="text-lg font-sans leading-relaxed mb-6 text-gray-300">
                This is where the actual synopsis for "Fathering Without Fear" will go. It's a compelling narrative of personal triumph, resilience, and the profound lessons learned on the path to fearless fathering. This book explores the unseen battles and the power of truth, guiding men to embrace their roles with courage.
              </p>
              <button className="btn-primary">
                Learn More
              </button>
            </motion.div>

            {/* Fiction Book Column (Still using placeholder image and text) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center text-center p-6 rounded-lg border border-deep-navy shadow-lg bg-neutral-dark/50"
            >
              <Image
                src="/placeholder-fiction-book.jpg" // Placeholder image path
                alt="Fiction Book Cover"
                width={300}
                height={450}
                className="rounded-lg shadow-xl mb-6 transform hover:scale-105 transition-transform duration-300"
              />
              <h3 className="text-3xl font-serif font-bold mb-4 text-off-white">
                The Novel: A Fictional Odyssey
              </h3>
              <p className="text-lg font-sans leading-relaxed mb-6 text-gray-300">
                Dive into a gripping tale of self-discovery, intricate relationships, and the search for identity, woven with themes that resonate deeply with the challenges of modern fatherhood.
              </p>
              <button className="btn-primary">
                Explore Now
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Email Subscription CTA Section */}
      <section className="section-padding bg-warm-gold/10 text-white"> {/* Light accent background */}
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl mx-auto p-8 rounded-lg border border-warm-gold/20 shadow-xl"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-warm-gold">
              Join the Movement
            </h2>
            <p className="text-lg md:text-xl font-sans mb-8 text-off-white">
              Be the first to receive updates, exclusive content, and insights into fearless fatherhood.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-grow px-5 py-3 rounded-lg bg-white/10 border border-warm-gold/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-warm-gold focus:outline-none transition-all duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="section-padding bg-soft-white text-neutral-dark"> {/* Light background for contrast */}
        <div className="container-custom">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}