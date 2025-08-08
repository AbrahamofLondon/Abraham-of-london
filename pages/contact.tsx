// pages/contact.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function ContactPage() {
  const siteUrl = 'https://abraham-of-london.netlify.app';

  return (
    <Layout>
      <Head>
        <title>Contact | Abraham of London</title>
        <meta
          name="description"
          content="Get in touch with Abraham of London for speaking engagements, partnerships, or general inquiries."
        />
        <meta property="og:title" content="Contact | Abraham of London" />
        <meta property="og:description" content="Reach out to connect, collaborate, or inquire about working together." />
        <meta property="og:image" content={`${siteUrl}/assets/images/social/og-image.jpg`} />
        <meta property="og:url" content={`${siteUrl}/contact`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <motion.div
        className="bg-gray-50 py-20 px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className="max-w-4xl mx-auto text-center" variants={itemVariants}>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-gray-900">
            Let&apos;s Connect
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            I&apos;m always open to new conversations. Feel free to reach out for speaking opportunities, partnerships, or just to say hello.
          </p>
        </motion.div>
      </motion.div>

      <div className="max-w-4xl mx-auto py-20 px-4">
        {/* Contact Form Section */}
        <motion.section
          className="bg-white p-8 md:p-12 rounded-2xl shadow-xl mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">Send Me a Message</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-lg font-medium text-gray-700">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-lg font-medium text-gray-700">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              ></textarea>
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-lg font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105"
              >
                Send Message
              </button>
            </div>
          </form>
        </motion.section>

        {/* Other Ways to Connect */}
        <motion.section
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Find Me Elsewhere</h2>
          <p className="text-lg text-gray-600 mb-8">
            You can also connect with me directly or follow my work on social media.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {/* Email link */}
            <Link
              href="mailto:info@abrahamoflondon.org"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-800 rounded-full hover:bg-gray-100 transition-colors group"
            >
              <svg className="w-5 h-5 mr-2 text-gray-500 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              Email
            </Link>

            {/* LinkedIn link */}
            <Link
              href="https://www.linkedin.com/in/abraham-adaramola-06630321/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-800 rounded-full hover:bg-gray-100 transition-colors group"
            >
              <svg className="w-5 h-5 mr-2 text-gray-500 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38-.9-2.5 2.48-2.5s2.48 1.12 2.48 2.5zM.31 21.5h4.96V6.9H.31V21.5zM9.54 6.9h4.76V9.67h.07c.66-1.2 2.27-2.46 4.69-2.46 5.02 0 5.95 3.32 5.95 7.64V21.5h-4.97v-6.94c0-1.66-.27-3.66-2.67-3.66-2.7 0-3.1 1.9-3.1 3.76V21.5H9.54V6.9z"></path>
              </svg>
              LinkedIn
            </Link>

            {/* Phone Number link */}
            <Link
              href="tel:+4420806225909"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-800 rounded-full hover:bg-gray-100 transition-colors group"
            >
              <svg className="w-5 h-5 mr-2 text-gray-500 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.774a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-11a1 1 0 01-1-1v-14a1 1 0 011-1z"></path>
              </svg>
              Phone
            </Link>

            {/* Twitter link */}
            <Link
              href="https://x.com/AbrahamofLondon48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-800 rounded-full hover:bg-gray-100 transition-colors group"
            >
              <svg className="w-5 h-5 mr-2 text-gray-500 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.95-.56-2.003-.966-3.124-1.196a4.992 4.992 0 00-8.49 4.57 14.12 14.12 0 01-10.28-5.203 4.998 4.998 0 00-.672 2.507 4.993 4.993 0 002.215 4.133 4.98 4.98 0 01-2.253-.623v.064a5.002 5.002 0 004.017 4.908 4.992 4.992 0 01-2.253.085 5.001 5.001 0 004.664 3.442A9.992 9.992 0 01.5 19.336a14.075 14.075 0 007.663 2.247c9.195 0 14.215-7.618 14.215-14.215 0-.217-.005-.434-.012-.65a10.126 10.126 0 002.505-2.607z"></path>
              </svg>
              Twitter
            </Link>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}