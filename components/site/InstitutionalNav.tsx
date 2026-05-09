"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  ChevronRight, 
  Command, 
  Terminal, 
  Shield, 
  Activity 
} from "lucide-react";

const navLinks = [
  { name: "Intel Briefings", href: "/shorts", tag: "DB-01" },
  { name: "Ventures", href: "/ventures", tag: "PTRN-02" },
  { name: "The Vault", href: "/vault", tag: "SEC-03" },
  { name: "Counsel Review", href: "/counsel", tag: "ADV-04" },
];

export default function InstitutionalNav(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav 
        className={`fixed top-0 z-50 w-full transition-all duration-500 border-b ${
          scrolled 
            ? "bg-black/80 backdrop-blur-xl border-white/10 py-4" 
            : "bg-transparent border-transparent py-8"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12 flex items-center justify-between">
          
          {/* Brand/System ID */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-8 w-8 bg-white flex items-center justify-center group-hover:bg-amber-500 transition-colors">
              <Command size={18} className="text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
                Abraham of London
              </span>
              <span className="text-[8px] font-mono font-bold text-white/30 uppercase tracking-widest">
                Operating System v.2026
              </span>
            </div>
          </Link>

          {/* Desktop Links: Minimal & Data-Driven */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={`group relative flex flex-col py-1 ${
                  pathname === link.href ? "text-white" : "text-white/40"
                } hover:text-white transition-colors`}
              >
                <span className="text-[8px] font-mono font-bold text-amber-500/50 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {link.tag}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {link.name}
                </span>
                {pathname === link.href && (
                  <div className="absolute -bottom-2 left-0 h-[1px] w-full bg-amber-500" />
                )}
              </Link>
            ))}
            
            {/* Terminal Toggle / CTA */}
            <Link 
              href="/contact"
              className="ml-4 px-5 py-2 border border-white/20 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all"
            >
              Initialize Contact
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setIsOpen(true)}
            className="md:hidden text-white p-2 border border-white/10 bg-white/5"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Command Overlay */}
      <div 
        className={`fixed inset-0 z-[60] bg-black transition-transform duration-700 ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <Terminal size={16} className="text-amber-500" />
              <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em]">
                System_Menu
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-4 border border-white/10 text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col gap-8">
            {navLinks.map((link, idx) => (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="group flex items-end justify-between border-b border-white/10 pb-6"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-amber-500/60 font-bold">0{idx + 1} // {link.tag}</span>
                  <h2 className="text-4xl font-serif italic text-white group-hover:text-amber-500 transition-colors">
                    {link.name}
                  </h2>
                </div>
                <ChevronRight size={24} className="text-white/10 group-hover:text-amber-500 transition-all" />
              </Link>
            ))}
          </div>

          <div className="mt-auto space-y-8">
             <Link 
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="block w-full py-6 bg-white text-black text-center text-xs font-black uppercase tracking-[0.4em]"
              >
                Initialize Engagement
              </Link>

              <div className="flex items-center justify-between border-t border-white/5 pt-8">
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-emerald-500" />
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Network: Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={12} className="text-white/20" />
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Auth: Guest_L1</span>
                </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}