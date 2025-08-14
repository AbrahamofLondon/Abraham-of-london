// components/ContactForm.tsx
import { useState, useMemo } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { siteConfig, absUrl } from '@/lib/siteConfig';

const SITE_URL = siteConfig.siteUrl;

const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: 'easeOut', when: 'beforeChildren' },
  },
};

const formVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function ContactForm() {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus('submitting');

    try {
      const formData = new FormData(event.currentTarget);
      const data = new URLSearchParams();
      data.append('form-name', 'contact-form');

      for (const [key, value] of Array.from(formData.entries())) {
        data.append(key, value.toString());
      }

      await fetch(event.currentTarget.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data.toString(),
      });

      setFormStatus('success');
      setTimeout(() => setFormStatus('idle'), 5000);
      event.currentTarget.reset();
    } catch (error) {
      console.error('Form submission failed:', error);
      setFormStatus('error');
    }
  };

  const isSubmitting = formStatus === 'submitting';

  const structuredData = useMemo(() => {
    const contactSchema = {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/contact`,
      },
      description: 'Contact form for Abraham of London inquiries.',
      url: `${SITE_URL}/contact`,
      potentialAction: {
        '@type': 'CommunicateAction',
        target: {
          '@type': 'EntryPoint',
          actionPlatform: ['https://schema.org/ContactPoint'],
          inLanguage: 'en',
          description: 'Contact form for inquiries',
        },
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer service',
        areaServed: 'Global',
        email: siteConfig.email,
      },
    };

    return [contactSchema];
  }, []);

  return (
    <>
      <Head>
        <title>Contact | {siteConfig.author}</title>
        <meta
          name="description"
          content="Get in touch with Abraham of London for inquiries and collaborations."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
        <meta property="og:title" content="Contact | Abraham of London" />
        <meta
          property="og:description"
          content="Reach out for collaborations, speaking engagements, and inquiries."
        />
        <meta property="og:url" content={`${SITE_URL}/contact`} />
        <meta property="og:image" content={absUrl(siteConfig.ogImage)} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={absUrl(siteConfig.twitterImage)} />
        {structuredData.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>
      <motion.section
        className="container mx-auto max-w-3xl px-4 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-4xl font-serif text-[var(--color-primary)] mb-6 text-center">
          Contact Us
        </h2>
        <p className="text-lg text-[var(--color-on-primary)]/80 mb-8 text-center">
          Reach out for inquiries, collaborations, or support.
        </p>
        <motion.form
          action="/contact"
          method="POST"
          name="contact-form"
          data-netlify="true"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="form-name" value="contact-form" />
          <motion.div variants={itemVariants}>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-on-primary)]">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 w-full px-4 py-2 border border-[var(--color-lightGrey)] rounded-[6px] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              disabled={isSubmitting}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-on-primary)]">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1 w-full px-4 py-2 border border-[var(--color-lightGrey)] rounded-[6px] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              disabled={isSubmitting}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <label htmlFor="message" className="block text-sm font-medium text-[var(--color-on-primary)]">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="mt-1 w-full px-4 py-2 border border-[var(--color-lightGrey)] rounded-[6px] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              disabled={isSubmitting}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="text-center">
            <button
              type="submit"
              className="inline-block px-6 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-[6px] hover:bg-[var(--color-primary)]/80 disabled:opacity-50"
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
    </>
  );
}


