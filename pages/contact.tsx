﻿// pages/contact.tsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Image from 'next/image';
import { siteConfig } from '@/lib/siteConfig';

// ---------- Config & Helpers ----------
const SITE_URL = (
Â  process.env.NEXT_PUBLIC_SITE_URL ||
Â  process.env.URL ||
Â  process.env.DEPLOY_PRIME_URL ||
Â  'https://abraham-of-london.netlify.app'
).replace(/\/$/, '');

const abs = (path: string): string => {
Â  if (!path) return '';
Â  if (/^https?:\/\//i.test(path)) return path;
Â  return SITE_URL ? new URL(path, SITE_URL).toString() : path;
};

// Animation Variants
const containerVariants = {
Â  hidden: { opacity: 0, scale: 0.98 },
Â  visible: {
Â  Â  opacity: 1,
Â  Â  scale: 1,
Â  Â  transition: {
Â  Â  Â  duration: 0.7,
Â  Â  Â  ease: "easeOut",
Â  Â  Â  when: "beforeChildren"
Â  Â  },
Â  },
};

const formVariants = {
Â  hidden: { y: 20, opacity: 0 },
Â  visible: {
Â  Â  y: 0,
Â  Â  opacity: 1,
Â  Â  transition: {
Â  Â  Â  duration: 0.6,
Â  Â  Â  ease: "easeOut",
Â  Â  Â  staggerChildren: 0.1
Â  Â  },
Â  },
};

const itemVariants = {
Â  hidden: { y: 20, opacity: 0 },
Â  visible: { y: 0, opacity: 1 },
};

// ---------- Page Component ----------
export default function ContactPage() {
Â  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

Â  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
Â  Â  event.preventDefault();
Â  Â  setFormStatus('submitting');

Â  Â  try {
Â  Â  Â  const formData = new FormData(event.currentTarget);
Â  Â  Â  const data = new URLSearchParams();
Â  Â  Â Â 
Â  Â  Â  data.append('form-name', 'contact');
Â  Â  Â Â 
Â  Â  Â  for (const [key, value] of Array.from(formData.entries())) {
Â  Â  Â  Â  data.append(key, value.toString());
Â  Â  Â  }
Â  Â  Â Â 
Â  Â  Â  await fetch(event.currentTarget.action, {
Â  Â  Â  Â  method: 'POST',
Â  Â  Â  Â  headers: {
Â  Â  Â  Â  Â  'Content-Type': 'application/x-www-form-urlencoded',
Â  Â  Â  Â  },
Â  Â  Â  Â  body: data.toString(),
Â  Â  Â  });

Â  Â  Â  setFormStatus('success');
Â  Â  Â  setTimeout(() => setFormStatus('idle'), 5000); // Clear success message after 5 seconds
Â  Â  Â  event.currentTarget.reset();
Â  Â  } catch (error) {
Â  Â  Â  console.error('Form submission failed:', error);
Â  Â  Â  setFormStatus('error');
Â  Â  }
Â  };

Â  const isSubmitting = formStatus === 'submitting';

Â  // JSON-LD Structured Data for SEO
Â  const structuredData = useMemo(() => {
Â  Â  const contactPageSchema = {
Â  Â  Â  "@context": "https://schema.org",
Â  Â  Â  "@type": "ContactPage",
Â  Â  Â  "mainEntityOfPage": {
Â  Â  Â  Â  "@type": "WebPage",
Â  Â  Â  Â  "@id": `${SITE_URL}/contact`
Â  Â  Â  },
Â  Â  Â  "description": "Get in touch with Abraham of London for speaking engagements, media inquiries, or collaborations.",
Â  Â  Â  "url": `${SITE_URL}/contact`,
Â  Â  Â  "potentialAction": {
Â  Â  Â  Â  "@type": "CommunicateAction",
Â  Â  Â  Â  "target": {
Â  Â  Â  Â  Â  "@type": "EntryPoint",
Â  Â  Â  Â  Â  "actionPlatform": [
Â  Â  Â  Â  Â  Â  "https://schema.org/ContactPoint"
Â  Â  Â  Â  Â  ],
Â  Â  Â  Â  Â  "inLanguage": "en",
Â  Â  Â  Â  Â  "description": "Contact form for Abraham of London"
Â  Â  Â  Â  }
Â  Â  Â  },
Â  Â  Â  "contactPoint": {
Â  Â  Â  Â  "@type": "ContactPoint",
Â  Â  Â  Â  "contactType": "Customer service",
Â  Â  Â  Â  "areaServed": "Global",
Â  Â  Â  Â  "email": siteConfig.email
Â  Â  Â  }
Â  Â  };
Â  Â Â 
Â  Â  const breadcrumb = {
Â  Â  Â  '@context': 'https://schema.org',
Â  Â  Â  '@type': 'BreadcrumbList',
Â  Â  Â  itemListElement: [
Â  Â  Â  Â  {
Â  Â  Â  Â  Â  '@type': 'ListItem',
Â  Â  Â  Â  Â  position: 1,
Â  Â  Â  Â  Â  name: 'Home',
Â  Â  Â  Â  Â  item: SITE_URL,
Â  Â  Â  Â  },
Â  Â  Â  Â  {
Â  Â  Â  Â  Â  '@type': 'ListItem',
Â  Â  Â  Â  Â  position: 2,
Â  Â  Â  Â  Â  name: 'Contact',
Â  Â  Â  Â  Â  item: `${SITE_URL}/contact`,
Â  Â  Â  Â  },
Â  Â  Â  ],
Â  Â  };
Â  Â Â 
Â  Â  return [contactPageSchema, breadcrumb];
Â  }, []);


Â  return (
Â  Â  <Layout>
Â  Â  Â  <Head>
Â  Â  Â  Â  <title>Contact | {siteConfig.author}</title>
Â  Â  Â  Â  <metaÂ 
Â  Â  Â  Â  Â  name="description"Â 
Â  Â  Â  Â  Â  content="Get in touch with Abraham of London for speaking engagements, book signings, media inquiries, and collaborations."Â 
Â  Â  Â  Â  />
Â  Â  Â  Â  <meta name="robots" content="index, follow" />
Â  Â  Â  Â  <link rel="canonical" href={`${SITE_URL}/contact`} />
Â  Â  Â  Â  <meta property="og:title" content="Contact | Abraham of London" />
Â  Â  Â  Â  <meta property="og:description" content="Reach out for collaborations, speaking engagements, and media opportunities." />
Â  Â  Â  Â  <meta property="og:url" content={`${SITE_URL}/contact`} />
Â  Â  Â  Â  <meta property="og:image" content={abs(siteConfig.ogImage)} />
Â  Â  Â  Â  <meta property="og:type" content="website" />
Â  Â  Â  Â  <meta name="twitter:card" content="summary_large_image" />
Â  Â  Â  Â  <meta name="twitter:image" content={abs(siteConfig.twitterImage)} />

Â  Â  Â  Â  {structuredData.map((schema, index) => (
Â  Â  Â  Â  Â  <script
Â  Â  Â  Â  Â  Â  key={index}
Â  Â  Â  Â  Â  Â  type="application/ld+json"
Â  Â  Â  Â  Â  Â  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
Â  Â  Â  Â  Â  />
Â  Â  Â  Â  ))}
Â  Â  Â  </Head>

Â  Â  Â  <motion.main
Â  Â  Â  Â  className="relative min-h-screen py-20 bg-gray-50 flex items-center justify-center overflow-hidden"
Â  Â  Â  Â  initial={{ opacity: 0 }}
Â  Â  Â  Â  animate={{ opacity: 1 }}
Â  Â  Â  Â  transition={{ duration: 0.8 }}
Â  Â  Â  >
Â  Â  Â  Â  {/* Background pattern and decorative element */}
Â  Â  Â  Â  <div className="absolute inset-0 z-0 opacity-10">
Â  Â  Â  Â  Â  <div className="pattern-bg" />
Â  Â  Â  Â  </div>
Â  Â  Â  Â  <div className="absolute top-10 right-10 w-48 h-48 md:w-64 md:h-64 opacity-50 z-0">
Â  Â  Â  Â  Â  <Image
Â  Â  Â  Â  Â  Â  src="/assets/images/contact-element.svg"
Â  Â  Â  Â  Â  Â  alt=""
Â  Â  Â  Â  Â  Â  fill
Â  Â  Â  Â  Â  Â  className="object-contain"
Â  Â  Â  Â  Â  Â  loading="lazy"
Â  Â  Â  Â  Â  />
Â  Â  Â  Â  </div>
Â  Â  Â  Â Â 
Â  Â  Â  Â  <motion.section
Â  Â  Â  Â  Â  className="w-full max-w-3xl mx-auto px-4 z-10"
Â  Â  Â  Â  Â  variants={containerVariants}
Â  Â  Â  Â  Â  initial="hidden"
Â  Â  Â  Â  Â  animate="visible"
Â  Â  Â  Â  >
Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
Â  Â  Â  Â  Â  Â  whileHover={{ scale: 1.01, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
Â  Â  Â  Â  Â  Â  transition={{ type: "spring", stiffness: 300, damping: 25 }}
Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  <motion.div variants={itemVariants}>
Â  Â  Â  Â  Â  Â  Â  <h1 className="text-4xl md:text-5xl font-bold font-serif text-gray-800 mb-4">
Â  Â  Â  Â  Â  Â  Â  Â  Let's Connect
Â  Â  Â  Â  Â  Â  Â  </h1>
Â  Â  Â  Â  Â  Â  Â  <p className="text-lg text-gray-700 max-w-prose mb-8">
Â  Â  Â  Â  Â  Â  Â  Â  I'm always open to new ideas and opportunities. Whether you have a speaking engagement, a media inquiry, or a potential collaboration, I look forward to hearing from you.
Â  Â  Â  Â  Â  Â  Â  </p>
Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  Â  <motion.div variants={formVariants}>
Â  Â  Â  Â  Â  Â  Â  {/* Status messages */}
Â  Â  Â  Â  Â  Â  Â  {formStatus === 'success' && (
Â  Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  Â  initial={{ scale: 0.8, opacity: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  animate={{ scale: 1, opacity: 1 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 flex items-center space-x-2"
Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  ðŸŽ‰ Your message has been sent successfully! I'll be in touch soon.
Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  )}
Â  Â  Â  Â  Â  Â  Â  {formStatus === 'error' && (
Â  Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  Â  initial={{ scale: 0.8, opacity: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  animate={{ scale: 1, opacity: 1 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  className="bg-red-100 text-red-800 p-4 rounded-lg mb-6 flex items-center space-x-2"
Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  âš ï¸ There was an error sending your message. Please try again later.
Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  )}
Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  Â  Â  <form
Â  Â  Â  Â  Â  Â  Â  Â  name="contact"
Â  Â  Â  Â  Â  Â  Â  Â  method="POST"
Â  Â  Â  Â  Â  Â  Â  Â  data-netlify="true"
Â  Â  Â  Â  Â  Â  Â  Â  onSubmit={handleSubmit}
Â  Â  Â  Â  Â  Â  Â  Â  action="/contact"
Â  Â  Â  Â  Â  Â  Â  Â  className="space-y-6"
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  <input type="hidden" name="form-name" value="contact" />
Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  Â  Â  Â  <motion.div variants={itemVariants}>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <label
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  htmlFor="name"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="block text-sm font-semibold text-gray-800 mb-2"
Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Your Name
Â  Â  Â  Â  Â  Â  Â  Â  Â  </label>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <input
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  type="text"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  id="name"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  name="name"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  required
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
Â  Â  Â  Â  Â  Â  Â  Â  Â  />
Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  Â  Â  Â  <motion.div variants={itemVariants}>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <label
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  htmlFor="email"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="block text-sm font-semibold text-gray-800 mb-2"
Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Email Address
Â  Â  Â  Â  Â  Â  Â  Â  Â  </label>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <input
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  type="email"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  id="email"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  name="email"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  required
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
Â  Â  Â  Â  Â  Â  Â  Â  Â  />
Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  Â  Â  Â  <motion.div variants={itemVariants}>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <label
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  htmlFor="message"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="block text-sm font-semibold text-gray-800 mb-2"
Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Message
Â  Â  Â  Â  Â  Â  Â  Â  Â  </label>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <textarea
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  id="message"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  name="message"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  rows={5}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  required
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
Â  Â  Â  Â  Â  Â  Â  Â  Â  ></textarea>
Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â Â 
Â  Â  Â  Â  Â  Â  Â  Â  <motion.button
Â  Â  Â  Â  Â  Â  Â  Â  Â  type="submit"
Â  Â  Â  Â  Â  Â  Â  Â  Â  className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
Â  Â  Â  Â  Â  Â  Â  Â  Â  disabled={isSubmitting}
Â  Â  Â  Â  Â  Â  Â  Â  Â  variants={itemVariants}
Â  Â  Â  Â  Â  Â  Â  Â  Â  whileHover={{ scale: 1.02 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  whileTap={{ scale: 0.98 }}
Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  {isSubmitting ? (
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  <span className="flex items-center justify-center">
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  <svg
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  xmlns="http://www.w3.org/2000/svg"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  fill="none"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  viewBox="0 0 24 24"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  <circle
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="opacity-25"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  cx="12"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  cy="12"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  r="10"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  stroke="currentColor"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  strokeWidth="4"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  />
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  <path
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="opacity-75"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  fill="currentColor"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  />
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  </svg>
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Sending...
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  </span>
Â  Â  Â  Â  Â  Â  Â  Â  Â  ) : (
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  'Send Message'
Â  Â  Â  Â  Â  Â  Â  Â  Â  )}
Â  Â  Â  Â  Â  Â  Â  Â  </motion.button>
Â  Â  Â  Â  Â  Â  Â  </form>
Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  </motion.section>
Â  Â  Â  </motion

