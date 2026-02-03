"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  MapPin,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  Phone,
  ArrowUp,
  Globe,
  Users,
  MessageCircle,
  Briefcase,
  ArrowRight,
  Vault,
  Layers,
  Sparkles,
  ShieldCheck,
  Fingerprint,
} from "lucide-react";

import { siteConfig } from "@/config/site";

/* -----------------------------------------------------------------------------
  TYPES & CONFIG
----------------------------------------------------------------------------- */
type SocialPlatform =
  | "twitter" | "x" | "linkedin" | "instagram" | "youtube"
  | "tiktok" | "facebook" | "email" | "phone" | "website" | "whatsapp";

const iconMap: Record<SocialPlatform, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: MessageCircle,
  whatsapp: MessageCircle,
  facebook: Facebook,
  email: Mail,
  phone: Phone,
  website: Globe,
};

const footerSections = [
  {
    title: "Intelligence Registry",
    icon: Globe,
    links: [
      { label: "Full Canon", href: "/canon" },
      { label: "Strategic Shorts", href: "/shorts" },
      { label: "Intelligence Briefs", href: "/registry/dispatches" },
      { label: "The Vault", href: "/downloads/vault" },
    ],
  },
  {
    title: "Systems & Advisory",
    icon: Layers,
    links: [
      { label: "Strategic Frameworks", href: "/resources/strategic-frameworks" },
      { label: "Advisory Services", href: "/consulting" },
      { label: "Founder Tools", href: "/resources#founder-tools" },
      { label: "Venture Partners", href: "/ventures" },
    ],
  },
  {
    title: "The Institution",
    icon: Users,
    links: [
      { label: "Inner Circle Access", href: "/inner-circle" },
      { label: "Institutional Security", href: "/security" },
      { label: "Contact Terminal", href: "/contact" },
      { label: "Global Presence", href: "/strategy" },
    ],
  },
];

/* -----------------------------------------------------------------------------
  SUB-COMPONENTS
----------------------------------------------------------------------------- */
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, delay, ease: "easeOut" }}
    viewport={{ once: true, margin: "-40px" }}
  >
    {children}
  </motion.div>
);

function FooterLink({ href, label }: { href: string; label: string }) {
  const isExternal = /^https?:\/\//i.test(href);
  const cls = "group flex items-center gap-2.5 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors duration-200";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        <span className="w-1 h-1 rounded-full bg-amber-500/20 group-hover:bg-amber-500 transition-colors" />
        <span className="relative">{label}</span>
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      <span className="w-1 h-1 rounded-full bg-amber-500/20 group-hover:bg-amber-500 transition-colors" />
      <span className="relative">{label}</span>
    </Link>
  );
}

/* -----------------------------------------------------------------------------
  MAIN COMPONENT
----------------------------------------------------------------------------- */
export default function Footer(): JSX.Element {
  const year = new Date().getFullYear();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative bg-black border-t border-white/5 overflow-hidden">
      {/* INSTITUTIONAL BACKGROUND LAYER */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.03),transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        
        {/* ACCESS RAIL */}
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
            <CTACard 
              href="/consulting" 
              title="Engage Advisory" 
              label="GOVERNANCE"
              icon={<Briefcase className="w-5 h-5 text-amber-500" />} 
            />
            <CTACard 
              href="/inner-circle" 
              title="Secure Clearance" 
              label="MEMBERSHIP"
              icon={<Fingerprint className="w-5 h-5 text-amber-500" />} 
            />
            <CTACard 
              href="/downloads/vault" 
              title="Open the Vault" 
              label="RESOURCES"
              icon={<Vault className="w-5 h-5 text-amber-500" />} 
            />
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          {/* BRAND BLOCK */}
          <div className="lg:col-span-4">
            <FadeIn delay={0.1}>
              <Link href="/" className="group block mb-8">
                <h2 className="font-serif text-3xl italic text-white mb-2 tracking-tight group-hover:text-amber-500 transition-colors">
                  Abraham of London
                </h2>
                <div className="font-mono text-[9px] uppercase tracking-[0.5em] text-amber-500/60">
                  Faith · Strategy · Fatherhood
                </div>
              </Link>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mb-8 font-light">
                Faith-rooted strategy for institutions that refuse to outsource responsibility. 
                Architecting legacy through sovereign leadership and biblical governance.
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-zinc-400">
                  <ShieldCheck size={14} className="text-amber-500/50" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Registry ID: AOL-75-163</span>
                </div>
                <div className="flex gap-3">
                  {siteConfig.socials.map((s: any) => {
                    const Icon = iconMap[s.kind as SocialPlatform] || Globe;
                    return (
                      <a key={s.label} href={s.href} className="p-2 border border-white/5 bg-white/[0.02] hover:bg-amber-500 hover:text-black transition-all rounded-sm">
                        <Icon size={14} />
                      </a>
                    );
                  })}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* LINK SECTIONS */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {footerSections.map((section, idx) => (
              <div key={section.title}>
                <FadeIn delay={0.2 + idx * 0.05}>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white mb-6">
                    {section.title}
                  </h4>
                  <ul className="space-y-1">
                    {section.links.map(link => (
                      <li key={link.label}>
                        <FooterLink href={link.href} label={link.label} />
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM LEGAL TERMINAL */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
              © {year} Abraham of London — All Rights Reserved
            </div>
            <div className="text-[9px] font-mono text-zinc-800 uppercase tracking-tighter">
              Classified Intelligence Portfolio // Node: London_Central
            </div>
          </div>

          <div className="flex gap-6">
            {['Privacy', 'Security', 'Terms'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors">
                {item}
              </Link>
            ))}
          </div>

          <motion.button
            onClick={scrollToTop}
            whileHover={{ y: -2 }}
            className="flex items-center gap-3 px-6 py-3 border border-white/10 font-mono text-[9px] uppercase tracking-[0.3em] text-white hover:bg-white/5 transition-all"
          >
            Ascend <ArrowUp size={12} />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}

function CTACard({ href, title, label, icon }: { href: string; title: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="group relative p-6 bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all overflow-hidden">
      <div className="relative z-10">
        <div className="font-mono text-[8px] uppercase tracking-[0.5em] text-zinc-600 group-hover:text-amber-500 transition-colors mb-4">
          {label}
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif italic text-white group-hover:translate-x-1 transition-transform">{title}</h3>
          {icon}
        </div>
      </div>
      <div className="absolute bottom-0 right-0 p-1 opacity-0 group-hover:opacity-10 transition-opacity">
        <Sparkles size={40} className="text-amber-500" />
      </div>
    </Link>
  );
}