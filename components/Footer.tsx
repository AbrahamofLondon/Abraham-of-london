"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Mail, MapPin, Twitter, Linkedin, Instagram, 
  Youtube, Phone, ArrowUp, Globe, FileText, 
  BookOpen, MessageCircle, ShieldCheck
} from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const footerSections = [
  {
    title: "The Vault",
    icon: BookOpen,
    links: [
      { label: "Kingdom Vault", href: "/content" },
      { label: "The Canon", href: "/canon" },
      { label: "Library of Books", href: "/books" },
      { label: "Downloads & Tools", href: "/downloads" },
    ],
  },
  {
    title: "Strategy",
    icon: FileText,
    links: [
      { label: "Advisory Services", href: "/strategy" },
      { label: "Chatham Rooms", href: "/strategy/chatham-rooms" },
      { label: "Ventures", href: "/ventures" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    title: "Connection",
    icon: MessageCircle,
    links: [
      { label: "Contact Abraham", href: "/contact" },
      { label: "Inner Circle", href: "/inner-circle" },
      { label: "Insights (Blog)", href: "/blog" },
      { label: "About", href: "/about" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-gold/10 bg-black pt-16 pb-8 text-cream overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
          
          {/* Brand Identity */}
          <div className="space-y-6 lg:col-span-1">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">
                Abraham<span className="text-gold"> of London</span>
              </h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60">
                Faith · Strategy · Fatherhood
              </p>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              {siteConfig.description}
            </p>
            
            <div className="space-y-3 pt-2">
              <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-3 text-sm text-gray-300 hover:text-gold transition-colors">
                <Mail className="h-4 w-4 text-gold/50" />
                {siteConfig.contact.email}
              </a>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <MapPin className="h-4 w-4 text-gold/50" />
                London, United Kingdom
              </div>
            </div>
          </div>

          {/* Nav Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-6">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                <section.icon className="h-4 w-4 text-gold" />
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-gold transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social & Legal */}
        <div className="mt-20 border-t border-white/5 pt-8">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            
            <div className="flex flex-wrap justify-center gap-6 text-[11px] font-medium uppercase tracking-tighter text-gray-500">
              <span>© {currentYear} Abraham of London</span>
              <Link href="/privacy" className="hover:text-gold">Privacy</Link>
              <Link href="/terms" className="hover:text-gold">Terms</Link>
              <Link href="/security" className="hover:text-gold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Security
              </Link>
            </div>

            <motion.button
              onClick={scrollToTop}
              whileHover={{ y: -3 }}
              className="flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-5 py-2 text-xs font-bold text-gold transition-all hover:bg-gold hover:text-black"
            >
              Back to Top
              <ArrowUp className="h-3 w-3" />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}