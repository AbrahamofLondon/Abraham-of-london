"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BookOpen, User, Mail, Shield, LayoutGrid } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: BookOpen },
  { href: "/content", label: "Vault", icon: LayoutGrid },
  { href: "/canon", label: "The Canon", icon: Shield },
  { href: "/about", label: "About", icon: User },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on navigation
  React.useEffect(() => setIsOpen(false), [pathname]);

  return (
    <nav 
      className={`fixed top-0 z-[100] w-full transition-all duration-500 ${
        scrolled ? "bg-black/80 backdrop-blur-xl border-b border-gold/10 py-3" : "bg-transparent py-6"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="group flex flex-col">
            <span className="font-serif text-xl font-bold tracking-tight text-white sm:text-2xl">
              Abraham<span className="text-gold"> of London</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold/50 group-hover:text-gold/80 transition-colors">
              Without Fear
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                  pathname === item.href ? "text-gold" : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/canon/the-architecture-of-human-purpose"
              className="rounded-full border border-gold bg-gold/10 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all"
            >
              Read Canon Prelude
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 text-gold lg:hidden"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gold/10 bg-black lg:hidden"
          >
            <div className="space-y-1 px-6 py-8">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 py-4 text-sm font-bold uppercase tracking-widest text-gray-400 active:text-gold"
                >
                  <item.icon size={18} className="text-gold/40" />
                  {item.label}
                </Link>
              ))}
              <div className="pt-6">
                <Link
                  href="/inner-circle"
                  className="block w-full rounded-xl bg-gold py-4 text-center text-xs font-bold uppercase tracking-widest text-black"
                >
                  Join Inner Circle
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}