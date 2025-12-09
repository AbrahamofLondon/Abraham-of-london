// pages/books/the-architecture-of-human-purpose-landing.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";

const PurposeLandingPage: NextPage = () => {
  const router = useRouter();
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";
  const canonicalUrl = `${SITE_URL}${router.pathname}`;

  // Animation states
  const [isHeroVisible, setIsHeroVisible] = React.useState(false);
  const [isContentVisible, setIsContentVisible] = React.useState(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const timer1 = setTimeout(() => setIsHeroVisible(true), 100);
    const timer2 = setTimeout(() => setIsContentVisible(true), 300);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Smooth scroll for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (anchor) {
        e.preventDefault();
        const href = anchor.getAttribute('href');
        if (href) {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": "The Architecture of Human Purpose",
    "alternateName": "Volume Zero",
    "author": {
      "@type": "Organization",
      "name": "Abraham of London"
    },
    "datePublished": "2024",
    "bookEdition": "Prelude Edition",
    "bookFormat": "https://schema.org/DigitalDocument",
    "description": "Volume Zero of the Canon. The foundational architecture for purpose, civilisation, governance, and human destiny.",
    "publisher": "Abraham of London",
    "image": `${SITE_URL}/assets/images/books/the-architecture-of-human-purpose.jpg`,
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <Layout 
      title="The Architecture of Human Purpose — Prelude" 
      description="Volume Zero: The foundational scaffolding for purpose, civilisation, and human destiny. A limited-release prelude."
      structuredData={structuredData}
      ogType="book"
    >
      <Head>
        <title>The Architecture of Human Purpose — Prelude | Volume Zero</title>
        <meta
          name="description"
          content="Volume Zero of the Canon. The foundational architecture for purpose, civilisation, governance, and human destiny. Limited prelude release."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="theme-color" content="#1a1a1a" />

        {/* Open Graph */}
        <meta property="og:title" content="The Architecture of Human Purpose — Volume Zero" />
        <meta property="og:description" content="Human flourishing is not accidental. It is architectural. This prelude sketches the scaffolding behind purpose, civilisation, and destiny." />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${SITE_URL}/api/og/books/the-architecture-of-human-purpose`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@abrahamoflondon" />
        <meta name="twitter:title" content="The Architecture of Human Purpose — Volume Zero" />
        <meta name="twitter:description" content="Volume Zero of the Canon. Limited prelude release." />
        <meta name="twitter:image" content={`${SITE_URL}/api/og/books/the-architecture-of-human-purpose`} />
      </Head>

      <main className="min-h-screen">
        {/* Background Canvas */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[#0a0a0a]" />
          <div className="absolute inset-0" 
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 90, 40, 0.03) 0%, transparent 50%), 
                                radial-gradient(circle at 80% 20%, rgba(40, 40, 60, 0.05) 0%, transparent 50%)`
            }}
          />
          {/* Subtle Grid */}
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Mouse trail effect */}
        <div 
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(212, 175, 55, 0.05) 0%, transparent 80%)`,
            transition: 'background 0.1s ease-out'
          }}
        />

        {/* Hero Section - Volume Zero */}
        <section className="relative min-h-[90vh] overflow-hidden">
          {/* Architectural Lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#3a3a3a]/30 to-transparent" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a]/20 to-transparent" />
          </div>

          <div className={`relative mx-auto max-w-7xl px-4 pt-24 transition-all duration-1000 ${isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text */}
              <div className="space-y-8">
                {/* Volume Badge */}
                <div className="inline-flex items-center gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4af37]/40" />
                  <div className="text-sm tracking-[0.3em] uppercase font-medium text-[#d4af37]/70">
                    Volume Zero · Prelude
                  </div>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4af37]/40" />
                </div>

                {/* Title */}
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[0.95]">
                    The Architecture
                    <span className="block mt-4 text-[#d4af37] font-medium">of Human Purpose</span>
                  </h1>
                  
                  <div className="h-px w-24 bg-gradient-to-r from-[#d4af37]/50 via-[#d4af37]/30 to-transparent" />
                  
                  <p className="text-lg text-[#999] leading-relaxed max-w-xl">
                    A limited-release prelude to the Canon. Not motivation, but scaffolding — 
                    the structural principles behind purpose, civilisation, governance, and destiny.
                  </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link
                    href="/books/the-architecture-of-human-purpose"
                    className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                    <span className="relative">Begin Reading</span>
                    <span className="relative transition-transform duration-300 group-hover:translate-x-1">→</span>
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

                {/* Stats */}
                <div className="pt-8 border-t border-[#2a2a2a]">
                  <div className="flex gap-8 text-sm">
                    <div>
                      <div className="text-[#d4af37] font-medium">Volume 0</div>
                      <div className="text-[#666] mt-1">Canon Foundation</div>
                    </div>
                    <div>
                      <div className="text-[#d4af37] font-medium">Limited</div>
                      <div className="text-[#666] mt-1">Prelude Release</div>
                    </div>
                    <div>
                      <div className="text-[#d4af37] font-medium">Architectural</div>
                      <div className="text-[#666] mt-1">Framework</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Book Presentation */}
              <div className="relative">
                {/* Floating Container */}
                <div className="relative group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-8 bg-gradient-to-r from-[#d4af37]/10 via-transparent to-[#d4af37]/5 blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700" />
                  
                  {/* Book Container */}
                  <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl transform transition-all duration-500 group-hover:scale-[1.01] group-hover:shadow-[0_40px_80px_rgba(212,175,55,0.1)]">
                    {/* Book Cover */}
                    <div className="relative">
                      {/* Embossed Effect */}
                      <div className="absolute -inset-4 bg-gradient-to-br from-[#d4af37]/5 via-transparent to-transparent rounded-xl blur-xl" />
                      
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
                      
                      {/* Overlay Glint */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-transparent to-[#d4af37]/5 pointer-events-none" />
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#d4af37] animate-pulse" />
                        <span className="text-sm text-[#d4af37]/80">Active Prelude</span>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
                      <div className="text-xs text-[#666]">Canon Shelf</div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 border-t border-r border-[#d4af37]/20 rounded-tr-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b border-l border-[#d4af37]/20 rounded-bl-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-px bg-gradient-to-b from-[#d4af37]/50 to-transparent" />
              <span className="text-xs tracking-widest text-[#666] uppercase">Explore</span>
            </div>
          </div>
        </section>

        {/* Content Architecture Section */}
        <section className={`relative py-24 transition-all duration-1000 delay-300 ${isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-transparent" />
          
          <div className="relative mx-auto max-w-6xl px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left - Core Proposition */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-light mb-6">
                    The Foundation Before<br />
                    <span className="text-[#d4af37]">The Structure</span>
                  </h2>
                  
                  <div className="space-y-6">
                    <p className="text-[#999] leading-relaxed">
                      This prelude doesn't present another layer of thinking — it reveals the bedrock 
                      beneath all meaningful thought. The architectural principles that govern purpose, 
                      civilisation, and human destiny.
                    </p>
                    
                    <div className="relative pl-6 border-l border-[#d4af37]/20">
                      <p className="text-[#ccc] italic">
                        "Human flourishing is not accidental. It follows a design — 
                        an architecture that can be understood, applied, and built upon."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Principles */}
                <div className="pt-8 border-t border-[#2a2a2a]">
                  <h3 className="text-sm tracking-widest uppercase text-[#d4af37]/70 mb-6">Core Distinctions</h3>
                  <div className="space-y-4">
                    {[
                      { title: "Calling", desc: "Beyond occupation into destiny" },
                      { title: "Authority", desc: "The architecture of legitimate power" },
                      { title: "Covenant", desc: "Structural bonds over contractual" },
                      { title: "Time", desc: "Not just chronology but kairos" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-4 group">
                        <div className="w-8 h-8 rounded-full border border-[#d4af37]/30 flex items-center justify-center flex-shrink-0 group-hover:border-[#d4af37]/60 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-[#d4af37] transition-colors">
                            {item.title}
                          </div>
                          <div className="text-sm text-[#666] mt-1">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right - Detail Panel */}
              <div className="space-y-8">
                {/* Insight Panel */}
                <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-8">
                  <div className="absolute -top-3 left-8 px-4 py-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                    <span className="text-xs tracking-widest text-[#d4af37]/70">Inside Volume Zero</span>
                  </div>
                  
                  <div className="pt-4 space-y-6">
                    {[
                      "Why purpose cannot exist in isolation from civilisation and covenant structures",
                      "The critical difference between calling, assignment, and occupation",
                      "How time, authority, and responsibility architect destiny more than talent alone",
                      "Why fatherhood and stewardship form the load-bearing walls of culture"
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-4 group cursor-pointer">
                        <div className="w-6 h-6 rounded-full border border-[#3a3a3a] flex items-center justify-center flex-shrink-0 group-hover:border-[#d4af37]/50 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#666] group-hover:bg-[#d4af37] transition-colors" />
                        </div>
                        <p className="text-[#ccc] leading-relaxed group-hover:text-white transition-colors">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-[#2a2a2a]">
                    <p className="text-sm text-[#666]">
                      Written for those who build — fathers, founders, stewards — 
                      who require not inspiration, but an architectural framework for a fragmenting world.
                    </p>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="relative">
                  <div className="flex items-center justify-between text-sm text-[#666] mb-2">
                    <span>Prelude Status</span>
                    <span>Volume Zero</span>
                  </div>
                  <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-full"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#666] mt-2">
                    <span>Architecture</span>
                    <span>Complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA - Immersive */}
        <section className="relative py-32 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,#1a1a1a_48%,#1a1a1a_52%,transparent_52%)] bg-[length:40px_40px] opacity-5" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>
          
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <div className="inline-block mb-8">
              <div className="text-6xl opacity-10">∞</div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-light mb-6 text-white">
              The Prelude Awaits
            </h2>
            
            <p className="text-[#999] leading-relaxed max-w-2xl mx-auto mb-12">
              Volume Zero of the Canon. Begin with the architectural principles, 
              then track the unfolding structure as subsequent volumes are released.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/books/the-architecture-of-human-purpose"
                className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-medium text-white transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                <span className="relative">Enter Volume Zero</span>
                <span className="relative transition-transform duration-300 group-hover:translate-x-2">↠</span>
              </Link>
              
              <Link
                href="/content"
                className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-medium text-white border border-[#3a3a3a] hover:border-[#d4af37]/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative">Explore the Canon</span>
                <span className="relative text-[#d4af37] transition-transform duration-300 group-hover:translate-x-2">→</span>
              </Link>
            </div>
            
            {/* Microcopy */}
            <p className="mt-8 text-sm text-[#666]">
              This is where structural thinking begins — before application, before execution, 
              before legacy. The foundation.
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default PurposeLandingPage;