// pages/contact.tsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Image from 'next/image';
import { siteConfig } from '../lib/siteConfig';

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
      ease: "easeOut",
      when: "beforeChildren"
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
      ease: "easeOut",
      staggerChildren: 0.1
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
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${SITE_URL}/contact`
      },
      "description": "Get in touch with Abraham of London for speaking engagements, media inquiries, or collaborations.",
      "url": `${SITE_URL}/contact`,
      "potentialAction": {
        "@type": "CommunicateAction",
        "target": {
          "@type": "EntryPoint",
          "actionPlatform": [
            "https://schema.org/ContactPoint"
          ],
          "inLanguage": "en",
          "description": "Contact form for Abraham of London"
        }
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer service",
        "areaServed": "Global",
        "email": siteConfig.email
      }
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
        <meta property="og:description" content="Reach out for collaborations, speaking engagements, and media opportunities." />
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
          <motion.div
            className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            whileHover={{ scale: 1.01, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <motion.div variants={itemVariants}>
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-gray-800 mb-4">
                Let's Connect
              </h1>
              <p className="text-lg text-gray-700 max-w-prose mb-8">
                I'm always open to new ideas and opportunities. Whether you have a speaking engagement, a media inquiry, or a potential collaboration, I look forward to hearing from you.
              </p>
            </motion.div>
          
            <motion.div variants={formVariants}>
              {/* Status messages */}
              {formStatus === 'success' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 flex items-center space-x-2"
                >
                  🎉 Your message has been sent successfully! I'll be in touch soon.
                </motion.div>
              )}
              {formStatus === 'error' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-100 text-red-800 p-4 rounded-lg mb-6 flex items-center space-x-2"
                >
                  ⚠️ There was an error sending your message. Please try again later.
                </motion.div>
              )}
          
              <form
                name="contact"
                method="POST"
                data-netlify="true"
                onSubmit={handleSubmit}
                action="/contact"
                className="space-y-6"
              >
                <input type="hidden" name="form-name" value="contact" />
          
                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </motion.div>
          
                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </motion.div>
          
                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  ></textarea>
                </motion.div>
          
                <motion.button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  disabled={isSubmitting}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Message'
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        </motion.section>
      </motion