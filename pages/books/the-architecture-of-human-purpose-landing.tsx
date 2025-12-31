// pages/purpose.tsx  (or whatever route this file actually is)
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

// ✅ set this to the actual route of THIS landing page
const CANONICAL_PATH = "/purpose";

const PurposeLandingPage: NextPage = () => {
  const canonicalUrl = `${SITE_URL}${CANONICAL_PATH}`;

  const [isHeroVisible, setIsHeroVisible] = React.useState(false);
  const [isContentVisible, setIsContentVisible] = React.useState(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const t1 = window.setTimeout(() => setIsHeroVisible(true), 100);
    const t2 = window.setTimeout(() => setIsContentVisible(true), 300);

    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const el = document.querySelector(href);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "The Architecture of Human Purpose",
    alternateName: "Volume Zero",
    author: { "@type": "Organization", name: "Abraham of London" },
    datePublished: "2024",
    bookEdition: "Prelude Edition",
    bookFormat: "https://schema.org/DigitalDocument",
    description:
      "Volume Zero of the Canon. The foundational architecture for purpose, civilisation, governance, and human destiny.",
    publisher: "Abraham of London",
    image: `${SITE_URL}/assets/images/books/the-architecture-of-human-purpose.jpg`,
    offers: { "@type": "Offer", availability: "https://schema.org/InStock", price: "0", priceCurrency: "USD" },
  };

  return (
    <Layout
      title="The Architecture of Human Purpose — Prelude"
      description="Volume Zero: The foundational scaffolding for purpose, civilisation, and human destiny. A limited-release prelude."
      structuredData={structuredData}
      ogType="book"
      canonicalUrl={canonicalUrl}
    >
      <Head>
        <title>The Architecture of Human Purpose — Prelude | Volume Zero</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="theme-color" content="#1a1a1a" />

        <meta property="og:title" content="The Architecture of Human Purpose — Volume Zero" />
        <meta
          property="og:description"
          content="Human flourishing is not accidental. It is architectural. This prelude sketches the scaffolding behind purpose, civilisation, and destiny."
        />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${SITE_URL}/api/og/books/the-architecture-of-human-purpose`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@abrahamoflondon" />
        <meta name="twitter:title" content="The Architecture of Human Purpose — Volume Zero" />
        <meta name="twitter:description" content="Volume Zero of the Canon. Limited prelude release." />
        <meta name="twitter:image" content={`${SITE_URL}/api/og/books/the-architecture-of-human-purpose`} />
      </Head>

      {/* Your existing JSX continues unchanged from here down.
         I’m not re-pasting the entire 400+ lines again — paste your existing body below,
         it will now be stable because canonical/hydration risk is removed. */}

      <main className="min-h-screen">
        {/* Background Canvas */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[#0a0a0a]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 90, 40, 0.03) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, rgba(40, 40, 60, 0.05) 0%, transparent 50%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(212, 175, 55, 0.05) 0%, transparent 80%)`,
            transition: "background 0.1s ease-out",
          }}
        />

        {/* ✅ Keep the rest of your existing sections exactly as you wrote them */}
        {/* ... */}
        <section className="relative min-h-[90vh] overflow-hidden">
          {/* (snip) */}
          <div
            className={`relative mx-auto max-w-7xl px-4 pt-24 transition-all duration-1000 ${
              isHeroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* (snip) */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                {/* (snip) */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link
                    href="/books/the-architecture-of-human-purpose"
                    className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                    <span className="relative">Begin Reading</span>
                    <span className="relative transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>

                  <Link
                    href="/inner-circle"
                    className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-medium text-white border border-[#d4af37]/30 hover:border-[#d4af37]/60 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative">Inner Circle Access</span>
                    <span className="relative text-[#d4af37]">↗</span>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="relative group">
                  <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
                    <div className="relative w-full aspect-[3/4] rounded-xl border border-[#d4af37]/20 shadow-2xl overflow-hidden">
                      <Image
                        src="/assets/images/books/the-architecture-of-human-purpose.jpg"
                        alt="The Architecture of Human Purpose — Volume Zero"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Keep your other sections below */}
      </main>
    </Layout>
  );
};

export default PurposeLandingPage;
