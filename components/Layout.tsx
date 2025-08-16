"use client";

import React, { ReactNode } from "react";
import Head from "next/head";
import { motion, useScroll, useSpring } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import SocialFollowStrip from "./SocialFollowStrip"; // New import

interface LayoutProps {
  children: ReactNode;
  /** Optional page title. Pages can still override with their own <Head>. */
  pageTitle?: string;
}

/** Global scroll progress indicator (mounted once in Layout). */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-1 bg-forest origin-left z-[100]"
      style={{ scaleX }}
    />
  );
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  const title = pageTitle ? `${pageTitle} | Abraham of London` : "Abraham of London";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Global UI */}
      <ScrollProgressBar />

      {/* Skip link available on every page */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110] focus:bg-cream focus:text-forest focus:px-4 focus:py-2 focus:rounded-md focus:shadow"
      >
        Skip to content
      </a>

      <div className="flex flex-col min-h-screen bg-cream text-deepCharcoal">
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SocialFollowStrip /> {/* Render here once for the entire app */}
        <Footer />
      </div>
    </>
  );
};

export default Layout;
