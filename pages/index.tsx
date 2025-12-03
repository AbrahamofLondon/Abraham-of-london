// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import type { GetStaticProps } from "next";

import Layout from "@/components/Layout";
import { HeroBanner } from "@/components/InteractiveElements";
import NewsletterForm from "@/components/NewsletterForm";
import MandateStatement from "@/components/MandateStatement";

type HomePageProps = {
  featuredPosts: any[];
  featuredBooks: any[];
  featuredEvents: any[];
  featuredDownloads: any[];
};

// ============================================================================
// ARCHITECTURAL COMPONENTS
// ============================================================================

interface PathwayPortalProps {
  title: string;
  description: string;
  stats: string;
  href: string;
  color: string;
  delay: number;
}

const PathwayPortal: React.FC<PathwayPortalProps> = ({ 
  title, 
  description, 
  stats, 
  href, 
  color,
  delay 
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <Link href={href}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative h-full rounded-2xl border transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
          isHovered ? 'shadow-2xl' : 'shadow-lg'
        }`}
        style={{
          borderColor: `${color}30`,
          backgroundColor: `${color}05`,
          transitionDelay: `${delay}ms`
        }}
      >
        {/* Background Architecture */}
        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, ${color} 0%, transparent 50%)`
          }}
        />
        
        {/* Content */}
        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
              <div className="text-sm tracking-widest uppercase" style={{ color }}>Pathway</div>
            </div>
            <div className="text-xs px-3 py-1 rounded-full border" style={{ borderColor: `${color}30`, color }}>
              {stats}
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-light mb-4 group-hover:text-white transition-colors">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-[#999] leading-relaxed mb-8">
            {description}
          </p>
          
          {/* CTA */}
          <div className="flex items-center justify-between border-t pt-6" style={{ borderColor: `${color}15` }}>
            <div className="text-sm" style={{ color }}>Enter Pathway</div>
            <div className="transform transition-transform group-hover:translate-x-2" style={{ color }}>
              →
            </div>
          </div>
        </div>
        
        {/* Hover Glow */}
        <div className={`absolute -inset-4 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`}
          style={{
            background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`
          }}
        />
      </div>
    </Link>
  );
};

interface StructuralCardProps {
  title: string;
  description: string;
  meta: string;
  href: string;
  type: 'post' | 'book' | 'event' | 'download';
  featured?: boolean;
  delay?: number;
}

const StructuralCard: React.FC<StructuralCardProps> = ({
  title,
  description,
  meta,
  href,
  type,
  featured = false,
  delay = 0
}) => {
  const typeConfig = {
    post: { color: '#d4af37', icon: '✍', label: 'Structural Essay' },
    book: { color: '#b8941f', icon: '📚', label: 'Bound Volume' },
    event: { color: '#9c7c1a', icon: '𓇯', label: 'Gathering' },
    download: { color: '#806515', icon: '⚙', label: 'Tool' }
  };
  
  const config = typeConfig[type];
  
  return (
    <Link href={href}>
      <div 
        className="group relative rounded-xl border overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
        style={{
          borderColor: `${config.color}30`,
          backgroundColor: `${config.color}05`,
          transitionDelay: `${delay}ms`
        }}
      >
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-4 left-4 z-10">
            <div className="text-xs px-3 py-1 rounded-full flex items-center gap-1"
              style={{ 
                backgroundColor: `${config.color}20`,
                color: config.color
              }}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Featured
            </div>
          </div>
        )}
        
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="text-xl opacity-70">{config.icon}</div>
              <div className="text-xs tracking-widest uppercase" style={{ color: config.color }}>
                {config.label}
              </div>
            </div>
            <div className="text-xs opacity-50">{meta}</div>
          </div>
          
          {/* Title */}
          <h4 className="text-lg font-medium mb-3 group-hover:text-white transition-colors">
            {title}
          </h4>
          
          {/* Description */}
          <p className="text-sm text-[#999] line-clamp-2 mb-6">
            {description}
          </p>
          
          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: `${config.color}15` }}>
            <div className="text-xs opacity-70">Continue Reading</div>
            <div className="transform transition-transform group-hover:translate-x-1" style={{ color: config.color }}>
              →
            </div>
          </div>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </Link>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const HomePage: React.FC<HomePageProps> = () => {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.org";
  const siteTitle = "Abraham of London";
  const siteTagline = "Structural thinking for fathers, founders, and builders of legacy.";

  const pathways = [
    {
      title: "For Fathers",
      description: "Architectural principles for building homes that withstand time, culture, and crisis.",
      stats: "12 Structures",
      href: "/content?category=fatherhood",
      color: "#d4af37"
    },
    {
      title: "For Founders",
      description: "Board-level thinking and operating systems for building ventures that endure.",
      stats: "18 Structures",
      href: "/content?category=founders",
      color: "#b8941f"
    },
    {
      title: "For Leaders",
      description: "Strategic frameworks for leading organizations through complexity and change.",
      stats: "24 Structures",
      href: "/content?category=leadership",
      color: "#9c7c1a"
    }
  ];

  const featuredContent = {
    posts: [
      {
        title: "The Architecture of Crisis",
        description: "How to build structures that don't just survive storms, but leverage them for growth.",
        meta: "12 min read",
        href: "/when-the-storm-finds-you",
        type: 'post' as const,
        featured: true
      },
      {
        title: "Fathering Without Fear",
        description: "A structural approach to fatherhood in an age of confusion and crisis.",
        meta: "18 min read",
        href: "/fathering-without-fear",
        type: 'post' as const
      }
    ],
    books: [
      {
        title: "Volume Zero: The Architecture of Human Purpose",
        description: "The foundational framework for understanding purpose, civilisation, and destiny.",
        meta: "Prelude Release",
        href: "/books/the-architecture-of-human-purpose-landing",
        type: 'book' as const,
        featured: true
      }
    ],
    events: [
      {
        title: "Strategic Leadership Workshop",
        description: "A masterclass on structural thinking for leaders building lasting organizations.",
        meta: "London · 2025",
        href: "/events/strategic-leadership-workshop",
        type: 'event' as const
      }
    ],
    downloads: [
      {
        title: "Entrepreneur Survival Framework",
        description: "A structural checklist for founders navigating market shifts and personal crises.",
        meta: "PDF · 12 pages",
        href: "/downloads/entrepreneur-survival-checklist",
        type: 'download' as const
      }
    ]
  };

  const handleHeroCTA = () => {
    router.push('/content');
  };

  return (
    <Layout 
      title={siteTitle}
      description={siteTagline}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteTitle,
        "description": siteTagline,
        "url": siteUrl,
        "publisher": {
          "@type": "Organization",
          "name": siteTitle,
          "logo": `${siteUrl}/logo.png`
        }
      }}
    >
      <Head>
        <title>{siteTitle} | Structural Thinking for Builders of Legacy</title>
        <meta name="description" content={siteTagline} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteTagline} />
        <meta property="og:image" content={`${siteUrl}/og-home.jpg`} />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteTagline} />
        <meta name="twitter:image" content={`${siteUrl}/og-home.jpg`} />
        <meta name="theme-color" content="#0a0a0a" />
      </Head>

      {/* Background Architecture */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(212, 175, 55, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(212, 175, 55, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Hero: The Gateway */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Architectural Lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#3a3a3a]/20 to-transparent" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a]/20 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-[#d4af37]/10 rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-[#d4af37]/10 rounded-full" />
        </div>

        <div className={`relative mx-auto max-w-7xl px-4 pt-32 transition-all duration-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="text-center">
            {/* Gateway Badge */}
            <div className="inline-flex items-center gap-4 mb-8">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4af37]/30" />
              <span className="text-sm tracking-[0.3em] uppercase text-[#d4af37]/70">
                The Structural Gateway
              </span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4af37]/30" />
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[0.95] mb-8">
              Architectural Thinking
              <span className="block mt-4 text-[#d4af37] font-medium">for Builders of Legacy</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-[#999] leading-relaxed max-w-3xl mx-auto mb-12">
              Structural frameworks for fathers, founders, and leaders building 
              homes, ventures, and organizations that withstand time, crisis, and culture.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={handleHeroCTA}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-medium transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                <span className="relative">Enter the Structure</span>
                <span className="relative transition-transform duration-300 group-hover:translate-x-2">↠</span>
              </button>
              
              <Link
                href="/content?category=strategic-essays"
                className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-medium border border-[#3a3a3a] hover:border-[#d4af37]/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative">Explore Essays</span>
                <span className="relative text-[#d4af37] transition-transform duration-300 group-hover:translate-x-2">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-px bg-gradient-to-b from-[#d4af37]/50 to-transparent" />
            <span className="text-xs tracking-widest text-[#666] uppercase">Continue</span>
          </div>
        </div>
      </section>

      {/* Pathways Section */}
      <section className={`relative py-32 transition-all duration-1000 delay-300 ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-transparent" />
        
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light mb-6">
              Three Architectural
              <span className="block text-[#d4af37]">Pathways</span>
            </h2>
            <p className="text-[#999] max-w-2xl mx-auto">
              Enter through the structural pathway that matches your current building project — 
              whether home, venture, or organization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pathways.map((pathway, index) => (
              <PathwayPortal
                key={pathway.title}
                {...pathway}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mandate Statement */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4">
          <MandateStatement />
        </div>
      </section>

      {/* Featured Content Grid */}
      <section className="relative py-32">
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column: Essays & Books */}
            <div className="space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-px bg-gradient-to-r from-[#d4af37] to-transparent" />
                  <h3 className="text-2xl font-light">Structural Essays</h3>
                </div>
                
                <div className="grid gap-6">
                  {featuredContent.posts.map((post, index) => (
                    <StructuralCard
                      key={post.title}
                      {...post}
                      delay={index * 100}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-px bg-gradient-to-r from-[#b8941f] to-transparent" />
                  <h3 className="text-2xl font-light">Bound Volumes</h3>
                </div>
                
                <div className="grid gap-6">
                  {featuredContent.books.map((book, index) => (
                    <StructuralCard
                      key={book.title}
                      {...book}
                      delay={index * 100}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Tools & Events */}
            <div className="space-y-12">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-px bg-gradient-to-r from-[#806515] to-transparent" />
                  <h3 className="text-2xl font-light">Structural Tools</h3>
                </div>
                
                <div className="grid gap-6">
                  {featuredContent.downloads.map((tool, index) => (
                    <StructuralCard
                      key={tool.title}
                      {...tool}
                      delay={index * 100}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-px bg-gradient-to-r from-[#9c7c1a] to-transparent" />
                  <h3 className="text-2xl font-light">Architectural Gatherings</h3>
                </div>
                
                <div className="grid gap-6">
                  {featuredContent.events.map((event, index) => (
                    <StructuralCard
                      key={event.title}
                      {...event}
                      delay={index * 100}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* All Content CTA */}
          <div className="mt-16 pt-16 border-t border-[#2a2a2a]">
            <div className="text-center">
              <Link
                href="/content"
                className="group relative inline-flex items-center justify-center gap-3 px-12 py-6 text-xl font-medium border border-[#2a2a2a] hover:border-[#d4af37]/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative">Enter the Complete Structure</span>
                <span className="relative text-[#d4af37] transition-transform duration-300 group-hover:translate-x-2">→</span>
              </Link>
              <p className="mt-4 text-sm text-[#666]">
                82 architectural structures across 6 categories
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter: Inner Circle */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]" />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(45deg, transparent 48%, #1a1a1a 48%, #1a1a1a 52%, transparent 52%)
              `,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="relative border rounded-2xl overflow-hidden" style={{ borderColor: '#2a2a2a' }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4af37' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: '100px 100px'
              }}
            />
            
            <div className="relative p-12 text-center">
              <div className="inline-block mb-8">
                <div className="text-6xl opacity-30">∞</div>
              </div>
              
              <h3 className="text-3xl font-light mb-6">
                Join the Inner Circle
              </h3>
              
              <p className="text-[#999] leading-relaxed max-w-2xl mx-auto mb-8">
                Receive structural frameworks, architectural insights, and 
                private access to the deepest layers of the Canon.
              </p>
              
              <div className="max-w-md mx-auto">
                <NewsletterForm
                  variant="premium"
                  placeholder="Enter your architectural email"
                  buttonText="Enter the Inner Circle"
                />
              </div>
              
              <p className="mt-6 text-sm text-[#666]">
                No fluff. No spam. Only structural thinking that builds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer: Architectural Stats */}
      <footer className="relative border-t py-16" style={{ borderColor: '#2a2a2a' }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '82', label: 'Structural Essays' },
              { value: '24', label: 'Architectural Volumes' },
              { value: '18', label: 'Strategic Tools' },
              { value: '12', label: 'Years Building' }
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl font-light text-[#d4af37]">{stat.value}</div>
                <div className="text-sm text-[#666]">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-sm text-[#666]" style={{ borderColor: '#2a2a2a' }}>
            <p>An architectural approach to purpose, civilisation, and human destiny.</p>
          </div>
        </div>
      </footer>

      {/* Interactive Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-[#d4af37]/5 to-transparent blur-3xl"
          style={{
            transform: 'translate(var(--mouse-x), var(--mouse-y))',
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>

      {/* Mouse Tracking Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('mousemove', (e) => {
              document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
              document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
            });
          `
        }}
      />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // In production, you would fetch real data here
  return {
    props: {
      featuredPosts: [],
      featuredBooks: [],
      featuredEvents: [],
      featuredDownloads: []
    },
    revalidate: 3600
  };
};

export default HomePage;