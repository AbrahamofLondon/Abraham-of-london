/* pages/purpose.tsx — PURPOSE LANDING PAGE (INTEGRITY MODE) */
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

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.com").replace(/\/+$/, "");
const CANONICAL_PATH = "/purpose";

const PurposeLandingPage: NextPage = () => {
  const canonicalUrl = `${SITE_URL}${CANONICAL_PATH}`;

  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [activeSection, setActiveSection] = React.useState('introduction');

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);

    const handleScroll = () => {
      const sections = ['introduction', 'architecture', 'principles', 'access'];
      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el && scrollPosition >= el.offsetTop && scrollPosition < el.offsetTop + el.offsetHeight) {
          setActiveSection(section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Layout
      title="The Architecture of Human Purpose"
      description="Volume Zero: The foundational scaffolding for purpose, civilisation, and human destiny."
      canonicalUrl={canonicalUrl}
      className="bg-[#0a0a0a]"
    >
      {/* BACKGROUND INTEGRITY */}
      <div className="fixed inset-0 -z-10 bg-[#0a0a0a]">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(212, 175, 55, 0.04) 0%, transparent 80%)` }} />
      </div>

      {/* STRATEGIC NAVIGATION */}
      <nav className="sticky top-6 z-50 mx-auto max-w-4xl px-4">
        <div className="bg-black/80 backdrop-blur-2xl border border-gold/10 rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Home</Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="hidden sm:flex gap-4">
              {['introduction', 'architecture', 'principles'].map((id) => (
                <a key={id} href={`#${id}`} className={`text-[10px] font-bold uppercase tracking-widest transition-all ${activeSection === id ? 'text-gold' : 'text-white/40 hover:text-white'}`}>
                  {id}
                </a>
              ))}
            </div>
          </div>
          <Link href="/books/the-architecture-of-human-purpose" className="bg-gold text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gold/80 transition-all">Read Volume Zero</Link>
        </div>
      </nav>

      <main className="relative pt-20">
        {/* HERO SECTION */}
        <section id="introduction" className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center pb-32">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gold border border-gold/20">
              <BookOpen size={12} /> Volume Zero • Prelude Edition
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight">
              The Architecture of <span className="italic text-gold/90">Human Purpose</span>
            </h1>
            <p className="text-xl text-white/60 leading-relaxed max-w-xl">
              Human flourishing is not accidental. It is architectural. This prelude sketches the load-bearing walls of destiny.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/books/the-architecture-of-human-purpose" className="bg-gold text-black px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gold/80 transition-all flex items-center justify-center gap-3">
                Begin Reading <ArrowRight size={16} />
              </Link>
              <Link href="/inner-circle" className="border border-gold/30 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gold/5 transition-all flex items-center justify-center gap-2">
                Inner Circle Access <ChevronRight size={14} />
              </Link>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gold/20 rounded-3xl blur-2xl group-hover:bg-gold/30 transition-all" />
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
              <Image 
                src="/assets/images/books/the-architecture-of-human-purpose.jpg" 
                alt="Volume Zero Cover" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                priority
              />
            </div>
          </div>
        </section>

        {/* ARCHITECTURE SECTION */}
        <section id="architecture" className="bg-zinc-950/50 py-32 border-y border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Layers className="mx-auto text-gold mb-6" size={40} />
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-8">Architectural Foundations</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-16">
              Just as buildings require blueprints, human purpose requires architectural rigor. This volume establishes the scaffolding for meaningful institutional build.
            </p>
            <div className="grid sm:grid-cols-2 gap-8 text-left">
              {[
                { icon: Compass, title: "Intentionality", desc: "Flourishing begins with design, not accident." },
                { icon: Globe, title: "Civilisation", desc: "Individual purpose must integrate with the collective." },
                { icon: Target, title: "Precision", desc: "Clear blueprints precede meaningful construction." },
                { icon: Sparkles, title: "Elegance", desc: "Profound truths are simple when properly architectural." }
              ].map((p, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-gold/20 transition-all">
                  <p.icon className="text-gold mb-4" size={24} />
                  <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-sm">{p.title}</h3>
                  <p className="text-gray-500 text-sm">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACCESS SECTION */}
        <section id="access" className="py-32">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-10 rounded-3xl bg-white/5 border border-white/10">
                <h3 className="text-2xl font-serif font-bold text-white mb-4">Public Reading</h3>
                <p className="text-gray-500 mb-8">Access the Prelude edition in its entirety. Open to all builders.</p>
                <Link href="/books/the-architecture-of-human-purpose" className="block w-full py-4 bg-white/10 text-white rounded-xl text-center font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Start Now</Link>
              </div>
              <div className="p-10 rounded-3xl bg-gold/5 border border-gold/20 relative overflow-hidden">
                <Sparkles className="absolute top-6 right-6 text-gold/20" size={40} />
                <h3 className="text-2xl font-serif font-bold text-white mb-4">Inner Circle</h3>
                <p className="text-gray-500 mb-8">Receive all future volumes and participate in strategic community dialogue.</p>
                <Link href="/inner-circle" className="block w-full py-4 bg-gold text-black rounded-xl text-center font-bold text-xs uppercase tracking-widest hover:bg-gold/80 transition-all">Join Circle</Link>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="pb-32 text-center px-6">
          <div className="max-w-2xl mx-auto">
             <h2 className="font-serif text-4xl text-white mb-6">The Build Begins Here</h2>
             <p className="text-gray-400 mb-10">Purpose is not found; it is constructed. Begin your journey with the foundations of Volume Zero.</p>
             <Link href="/books/the-architecture-of-human-purpose" className="inline-flex items-center gap-3 bg-gold text-black px-10 py-5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gold/80 transition-all">Begin The Architecture <ArrowRight size={18} /></Link>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default PurposeLandingPage;