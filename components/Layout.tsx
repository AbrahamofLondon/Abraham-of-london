// components/Layout.tsx
import React, { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  const defaultTitle = "Abraham of London";
  const title = pageTitle ? `${pageTitle} | ${defaultTitle}` : defaultTitle;
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || "https://abraham-of-london.netlify.app";

  const logoVariants = {
    initial: { opacity: 0, rotate: -15 },
    animate: { opacity: 1, rotate: 0, transition: { duration: 0.6, ease: "easeOut" } },
    hover: { scale: 1.1, transition: { duration: 0.3 } },
  };

  const socials = {
    twitter: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09",
    linkedin: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    instagram: "https://www.instagram.com/abraham_of_london",
    youtube: "https://youtube.com", // update if you have one
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 transition-colors duration-300">
      <Head>
        <title>{title}</title>
        <meta name="description" content={`${title} – Leadership, Fatherhood & Resilience`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/assets/logo/Abraham-of-London-logo.svg" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={`${title} – Leadership, Fatherhood & Resilience`} />
        <meta property="og:image" content={`${origin}/assets/images/social/og-image.jpg`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={origin} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={`${title} – Leadership, Fatherhood & Resilience`} />
        <meta name="twitter:image" content={`${origin}/assets/images/social/twitter-image.webp`} />
        <meta name="theme-color" content="#0B3D2E" />
      </Head>

      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md"
        initial="initial"
        animate="animate"
      >
        <div className="container mx-auto flex items-center justify-between p-4">
          <motion.div className="flex items-center space-x-2">
            <motion.div variants={logoVariants} whileHover="hover">
              <Link href="/" aria-label="Home">
                <Image
                  src="/assets/logo/Abraham-of-London-logo.svg"
                  alt="Abraham of London Logo"
                  width={40}
                  height={40}
                  priority
                />
              </Link>
            </motion.div>
            <Link href="/" className="font-bold text-lg text-gray-900 hover:text-forest transition-colors">
              Abraham of London
            </Link>
          </motion.div>

          <nav className="flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link href="/blog" className="hover:text-forest transition-colors">Blog</Link>
            <Link href="/books" className="hover:text-forest transition-colors">Books</Link>
            <Link href="/about" className="hover:text-forest transition-colors">About</Link>
            <Link href="/contact" className="hover:text-forest transition-colors">Contact</Link>
            <Link href="/ventures" className="hover:text-forest transition-colors">Ventures</Link>
          </nav>
        </div>
      </motion.header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row">
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href={socials.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
              <Image src="/assets/images/social/twitter.svg" alt="Twitter / X" width={24} height={24} />
            </a>
            <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Image src="/assets/images/social/linkedin.svg" alt="LinkedIn" width={24} height={24} />
            </a>
            <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Image src="/assets/images/social/instagram.svg" alt="Instagram" width={24} height={24} />
            </a>
            <a href={socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <Image src="/assets/images/social/youtube.svg" alt="YouTube" width={24} height={24} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
