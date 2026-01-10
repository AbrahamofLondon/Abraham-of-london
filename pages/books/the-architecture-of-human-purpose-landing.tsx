// pages/purpose.tsx - PURPOSE LANDING PAGE
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { 
  BookOpen, 
  ChevronRight, 
  Sparkles, 
  Target,
  Compass,
  Layers,
  Globe,
  Users,
  ArrowRight,
  Clock,
  Calendar,
  Tag
} from "lucide-react";

import Layout from "@/components/Layout";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.com").replace(/\/+$/, "");

const CANONICAL_PATH = "/purpose";

const PurposeLandingPage: NextPage = () => {
  const canonicalUrl = `${SITE_URL}${CANONICAL_PATH}`;

  const [isHeroVisible, setIsHeroVisible] = React.useState(false);
  const [isContentVisible, setIsContentVisible] = React.useState(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [activeSection, setActiveSection] = React.useState('introduction');

  React.useEffect(() => {
    const t1 = window.setTimeout(() => setIsHeroVisible(true), 100);
    const t2 = window.setTimeout(() => setIsContentVisible(true), 300);

    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);

    // Smooth scroll for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const id = href.replace('#', '');
      const el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    };

    document.addEventListener("click", handleAnchorClick);

    // Update active section on scroll
    const handleScroll = () => {
      const sections = ['introduction', 'architecture', 'principles', 'access'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const offsetTop = el.offsetTop;
          const offsetBottom = offsetTop + el.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleAnchorClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "The Architecture of Human Purpose",
    alternateName: "Volume Zero",
    author: { 
      "@type": "Person", 
      name: "Abraham of London"
    },
    datePublished: "2024",
    bookEdition: "Prelude Edition",
    bookFormat: "https://schema.org/DigitalDocument",
    description: "Volume Zero of the Canon. The foundational architecture for purpose, civilisation, governance, and human destiny.",
    publisher: "Abraham of London",
    image: `${SITE_URL}/assets/images/books/the-architecture-of-human-purpose.jpg`,
    offers: { 
      "@type": "Offer", 
      availability: "https://schema.org/InStock", 
      price: "0", 
      priceCurrency: "USD" 
    },
  };

  const navItems = [
    { id: 'introduction', label: 'Introduction', icon: BookOpen },
    { id: 'architecture', label: 'The Architecture', icon: Layers },
    { id: 'principles', label: 'Core Principles', icon: Target },
    { id: 'access', label: 'Access', icon: Users },
  ];

  const principles = [
    {
      icon: Compass,
      title: "Purpose as Foundation",
      description: "Human flourishing begins with intentional design, not accidental discovery."
    },
    {
      icon: Globe,
      title: "Civilisational Scale",
      description: "Individual purpose must integrate with collective civilisation to create lasting impact."
    },
    {
      icon: Target,
      title: "Architectural Precision",
      description: "Clear blueprints precede meaningful construction in both buildings and beliefs."
    },
    {
      icon: Sparkles,
      title: "Elegant Simplicity",
      description: "The most profound truths are often the simplest when properly understood."
    }
  ];

  return (
    <Layout
      title="The Architecture of Human Purpose — Volume Zero"
      description="Volume Zero: The foundational scaffolding for purpose, civilisation, and human destiny. A limited-release prelude."
      structuredData={structuredData}
      ogType="book"
      canonicalUrl={canonicalUrl}
      className="bg-[#0a0a0a]"
    >
      <Head>
        <title>The Architecture of Human Purpose — Volume Zero | Abraham of London</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="theme-color" content="#0a0a0a" />

        {/* Open Graph */}
        <meta property="og:title" content="The Architecture of Human Purpose — Volume Zero" />
        <meta
          property="og:description"
          content="Human flourishing is not accidental. It is architectural. This prelude sketches the scaffolding behind purpose, civilisation, and destiny."
        />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${SITE_URL}/assets/images/books/the-architecture-of-human-purpose-og.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@abrahamoflondon" />
        <meta name="twitter:title" content="The Architecture of Human Purpose — Volume Zero" />
        <meta name="twitter:description" content="Volume Zero of the Canon. Limited prelude release." />
        <meta name="twitter:image" content={`${SITE_URL}/assets/images/books/the-architecture-of-human-purpose-twitter.jpg`} />
      </Head>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(40, 40, 60, 0.05) 0%, transparent 50%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Mouse Glow Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(1000px at ${mousePosition.x}px ${mousePosition.y}px, rgba(212, 175, 55, 0.03) 0%, transparent 80%)`,
          transition: "background 0.2s ease-out",
        }}
      />

      {/* Sticky Navigation */}
      <nav className="sticky top-4 z-50 mx-auto max-w-5xl px-4">
        <div className="bg-black/80 backdrop-blur-xl border border-[#d4af37]/10 rounded-2xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                href="/" 
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                ← Home
              </Link>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        activeSection === item.id
                          ? 'bg-[#d4af37]/10 text-[#d4af37]'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>
            <Link
              href="/books/the-architecture-of-human-purpose"
              className="px-4 py-1.5 bg-[#d4af37] text-black text-sm font-medium rounded-lg hover:bg-[#d4af37]/90 transition-colors"
            >
              Read Now
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative">
        {/* Hero Section */}
        <section id="introduction" className="relative pt-20 pb-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/5 via-transparent to-transparent" />
          
          <div className={`relative mx-auto max-w-6xl px-4 transition-all duration-1000 ${
            isHeroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#d4af37]/10 rounded-full text-sm text-[#d4af37] mb-6">
                    <BookOpen className="w-4 h-4" />
                    <span>Volume Zero • Prelude Edition</span>
                  </div>
                  <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-white mb-6">
                    The Architecture of Human Purpose
                  </h1>
                  <p className="text-xl text-white/70 leading-relaxed mb-8">
                    Human flourishing is not accidental. It is architectural. 
                    Volume Zero sketches the foundational scaffolding behind purpose, 
                    civilisation, and human destiny.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#d4af37]/60" />
                    <span className="text-white/60">45 min read</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#d4af37]/60" />
                    <span className="text-white/60">Published 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#d4af37]/60" />
                    <span className="text-white/60">Foundational</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link
                    href="/books/the-architecture-of-human-purpose"
                    className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />
                    <span className="relative">Begin Reading</span>
                    <ArrowRight className="relative w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
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

              {/* Book Cover */}
              <div className="relative">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#d4af37]/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                  <div className="relative bg-gradient-to-br from-black to-[#1a1a1a] border border-[#d4af37]/10 rounded-2xl p-8 shadow-2xl">
                    <div className="relative w-full aspect-[3/4] rounded-xl border border-[#d4af37]/20 shadow-2xl overflow-hidden">
                      <Image
                        src="/assets/images/books/the-architecture-of-human-purpose.jpg"
                        alt="The Architecture of Human Purpose — Volume Zero"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]/30" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]/30" />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]/30" />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent" />
          
          <div className={`relative mx-auto max-w-4xl px-4 transition-all duration-1000 delay-200 ${
            isContentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm text-white/60 mb-6">
                <Layers className="w-4 h-4" />
                <span>The Framework</span>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-normal text-white mb-6">
                Architectural Foundations
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Just as buildings require blueprints, human purpose requires architectural thinking. 
                This volume establishes the load-bearing walls of meaningful existence.
              </p>
            </div>

            {/* Principles Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {principles.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-gradient-to-br from-white/5 to-white/0 border border-white/5 rounded-2xl p-8 hover:border-[#d4af37]/20 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/0 to-[#d4af37]/0 group-hover:from-[#d4af37]/5 group-hover:to-[#d4af37]/0 transition-all duration-500 rounded-2xl" />
                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#d4af37]/10 mb-6">
                        <Icon className="w-6 h-6 text-[#d4af37]" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        {principle.title}
                      </h3>
                      <p className="text-white/60">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Access Section */}
        <section id="access" className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
          
          <div className="relative mx-auto max-w-4xl px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm text-white/60 mb-6">
                <Users className="w-4 h-4" />
                <span>Access & Community</span>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-normal text-white mb-6">
                Join the Conversation
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Volume Zero is just the beginning. Continue the exploration with 
                fellow builders in the Inner Circle.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Access */}
              <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/5 rounded-2xl p-8">
                <div className="mb-6">
                  <div className="text-2xl font-semibold text-white mb-2">Public Reading</div>
                  <div className="text-sm text-white/40 mb-4">Free Access</div>
                  <p className="text-white/60 mb-6">
                    Read Volume Zero in its entirety. This prelude edition is available 
                    to everyone as an introduction to the canon.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {['Full digital edition', 'Permanent access', 'No registration required'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-white/70">
                        <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/books/the-architecture-of-human-purpose"
                  className="block w-full py-3 text-center bg-white/10 text-white rounded-xl hover:bg-white/15 transition-colors"
                >
                  Read Now
                </Link>
              </div>

              {/* Inner Circle */}
              <div className="bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/0 border border-[#d4af37]/20 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Sparkles className="w-6 h-6 text-[#d4af37]" />
                </div>
                <div className="mb-6">
                  <div className="text-2xl font-semibold text-white mb-2">Inner Circle</div>
                  <div className="text-sm text-[#d4af37] mb-4">Enhanced Access</div>
                  <p className="text-white/60 mb-6">
                    Join the community of builders, receive ongoing volumes, 
                    participate in discussions, and access exclusive materials.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {['All future volumes', 'Community discussions', 'Exclusive essays', 'Early access'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-white/70">
                        <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/inner-circle"
                  className="block w-full py-3 text-center bg-[#d4af37] text-black font-medium rounded-xl hover:bg-[#d4af37]/90 transition-colors"
                >
                  Join Inner Circle
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pb-32 relative">
          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-white/60 mb-8">
              <ChevronRight className="w-4 h-4" />
              <span>Begin Your Journey</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-normal text-white mb-6">
              Architecture Awaits
            </h2>
            <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
              Purpose is not found; it is built. Begin with the foundations in Volume Zero, 
              then continue building with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/books/the-architecture-of-human-purpose"
                className="px-8 py-4 bg-[#d4af37] text-black font-medium rounded-xl hover:bg-[#d4af37]/90 transition-colors inline-flex items-center gap-3"
              >
                <BookOpen className="w-5 h-5" />
                Start Reading Volume Zero
              </Link>
              <Link
                href="/books"
                className="px-8 py-4 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 transition-colors border border-white/10"
              >
                Explore All Volumes
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default PurposeLandingPage;