"use client";

import React, { ReactNode } from "react";
import Head from "next/head";
import { motion, useScroll, useSpring } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
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
      </Head>

      {/* Global UI */}
      <ScrollProgressBar />

      <div className="flex flex-col min-h-screen bg-cream text-deepCharcoal">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
