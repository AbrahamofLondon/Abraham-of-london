// pages/contact.tsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Image from 'next/image';
import { siteConfig } from '@/lib/siteConfig';

// ---------- Config & Helpers ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://abraham-of-london.netlify.app'
).replace(/\/$/, '');

const abs = (path: string): string => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL ? new URL(path, SITE_URL).toString() : path;
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
      when: 'beforeChildren',
    },
  },
};

const formVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// ---------- Page Component ----------
export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus('submitting');

    try {
      const formData = new FormData(event.currentTarget);
      const data = new URLSearchParams();

      data.append('form-name', 'contact');

      for (const [key, value] of Array.from(formData.entries())) {
        data.append(key, value.toString());
      }

      await fetch(event.currentTarget.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
      });

      setFormStatus('success');
      setTimeout(() => setFormStatus('idle'), 5000); // Clear success message after 5 seconds
      event.currentTarget.reset();
    } catch (error) {
      console.error('Form submission failed:', error);
      setFormStatus('error');
    }
  };

  const isSubmitting = formStatus === 'submitting';

  // JSON-LD Structured Data for SEO
  const structuredData = useMemo(() => {
    const contactPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/contact`,
      },
      description: 'Get in touch with Abraham of London for speaking engagements, media inquiries, or collaborations.',
      url: `${SITE_URL}/contact`,
      potentialAction: {
        '@type': 'CommunicateAction',
        target: {
          '@type': 'EntryPoint',
          actionPlatform: ['https://schema.org/ContactPoint'],
          inLanguage: 'en',
          description: 'Contact form for Abraham of London',
        },
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer service',
        areaServed: 'Global',
        email: siteConfig.email,
      },
    };

    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Contact',
          item: `${SITE_URL}/contact`,
        },
      ],
    };

    return [contactPageSchema, breadcrumb];
  }, []);

  return (
    <Layout>
      <Head>
        <title>Contact | {siteConfig.author}</title>
        <meta
          name="description"
          content="Get in touch with Abraham of London for speaking engagements, book signings, media inquiries, and collaborations."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
        <meta property="og:title" content="Contact | Abraham of London" />
        <meta
          property="og:description"
          content="Reach out for collaborations, speaking engagements, and media opportunities."
        />
        <meta property="og:url" content={`${SITE_URL}/contact`} />
        <meta property="og:image" content={abs(siteConfig.ogImage)} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={abs(siteConfig.twitterImage)} />

        {structuredData.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      <motion.main
        className="relative min-h-screen py-20 bg-gray-50 flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background pattern and decorative element */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="pattern-bg" />
        </div>
        <div className="absolute top-10 right-10 w-48 h-48 md:w-64 md:h-64 opacity-50 z-0">
          <Image
            src="/assets/images/contact-element.svg"
            alt=""
            fill
            className="object-contain"
            loading="lazy"
          />
        </div>

        <motion.section
          className="w-full max-w-3xl mx-auto px-4 z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-4xl md:text-5xl font-serif text-forest mb-6 text-center">
            Get in Touch
          </h1>
          <p className="text-lg text-deepCharcoal/80 mb-8 text-center">
            Reach out for speaking engagements, book signings, media inquiries, or collaborations.
          </p>

          <motion.form
            action="/contact"
            method="POST"
            name="contact"
            data-netlify="true"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="form-name" value="contact" />
            <motion.div variants={itemVariants}>
              <label htmlFor="name" className="block text-sm font-medium text-deepCharcoal">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 w-full px-4 py-2 border border-lightGrey rounded-[6px] focus:ring-forest focus:border-forest"
                disabled={isSubmitting}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-deepCharcoal">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-1 w-full px-4 py-2 border border-lightGrey rounded-[6px] focus:ring-forest focus:border-forest"
                disabled={isSubmitting}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <label htmlFor="message" className="block text-sm font-medium text-deepCharcoal">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="mt-1 w-full px-4 py-2 border border-lightGrey rounded-[6px] focus:ring-forest focus:border-forest"
                disabled={isSubmitting}
              />
            </motion.div>
            <motion.div variants={itemVariants} className="text-center">
              <button
                type="submit"
                className="inline-block px-6 py-3 bg-forest text-cream rounded-[6px] hover:bg-forest/80 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Send Message'}
              </button>
            </motion.div>
            {formStatus === 'success' && (
              <motion.p
                variants={itemVariants}
                className="text-green-600 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Message sent successfully!
              </motion.p>
            )}
            {formStatus === 'error' && (
              <motion.p
                variants={itemVariants}
                className="text-red-600 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Failed to send message. Please try again.
              </motion.p>
            )}
          </motion.form>
        </motion.section>
      </motion.main>
    </Layout>
  );
}