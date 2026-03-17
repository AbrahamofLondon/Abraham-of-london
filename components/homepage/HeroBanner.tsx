"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import { Terminal, Shield, ArrowRight } from "lucide-react";

// Local reference for the rail links
const RAIL_LINKS = [
  { href: "/canon", label: "Canon", tag: "DOC-01", desc: "Doctrine & Method" },
  { href: "/blog", label: "Essays", tag: "INT-02", desc: "Literary Intelligence" },
  { href: "/vault/briefs", label: "Briefs", tag: "SEC-03", desc: "Vault Intelligence" },
  { href: "/ventures", label: "Ventures", tag: "PTR-04", desc: "Execution Arms" },
  { href: "/shorts", label: "Shorts", tag: "SIG-05", desc: "Short-form Signal" },
];

export const HeroBanner = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -50]);
  const y2 = useTransform(scrollY, [0, 500], [0, 50]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-screen z-0 flex items-center overflow-hidden bg-black pt-32 lg:pt-40">
      {/* Institutional Texture Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <motion.div style={{ opacity }} className="container relative z-10 mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Functional Registry Rail (LEFT SIDE) */}
          <div className="hidden lg:flex lg:col-span-2 flex-col gap-10 border-r border-white/5 pr-8">
            {RAIL_LINKS.map((item, idx) => (
              <Link key={item.tag} href={item.href} className="group flex flex-col items-start transition-all hover:translate-x-1">
                <span className="text-[9px] font-mono text-amber-500/50 group-hover:text-amber-500 transition-colors">INDEX_{idx + 1} // {item.tag}</span>
                <h3 className="text-2xl font-serif italic text-white group-hover:text-amber-200">{item.label}</h3>
                <span className="text-[8px] uppercase tracking-widest text-white/20 group-hover:text-white/40">{item.desc}</span>
              </Link>
            ))}
          </div>

          {/* Main Command Column (CENTER/RIGHT) */}
          <motion.div style={{ y: y1 }} className="lg:col-span-6 space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Terminal size={14} className="text-amber-500" />
                <p className="text-[10px] uppercase tracking-[0.6em] text-white/40 font-mono font-bold">Institutional OS // 2026</p>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium leading-[0.95] tracking-tighter text-white">
                {title.split(' ').map((word, i) => (
                  <span key={i} className={word.toLowerCase() === 'london' ? "italic font-light text-amber-500" : ""}>{word} </span>
                ))}
              </h1>
            </div>
            {subtitle && (
              <p className="max-w-xl text-lg lg:text-xl text-white/50 leading-relaxed font-light italic border-l border-amber-500/40 pl-8">{subtitle}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button href="/canon" className="bg-white text-black px-10 py-5 rounded-none uppercase tracking-[0.3em] text-[11px] font-black hover:bg-amber-500 transition-all flex items-center justify-center gap-3">
                Explore Doctrine <ArrowRight size={14} />
              </Button>
              <Button href="/vault" className="px-10 py-5 rounded-none border border-white/10 bg-white/5 text-white uppercase tracking-[0.3em] text-[11px] font-black hover:border-amber-500/50 transition-all flex items-center justify-center gap-3">
                <Shield size={14} /> Open Vault
              </Button>
            </div>
          </motion.div>

          {/* Cinematic Image/Status Column (RIGHT) */}
          <motion.div style={{ y: y2 }} className="lg:col-span-4 hidden lg:block relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
              <Image src="/assets/images/abraham-of-london-banner.webp" alt="Institutional" fill priority className="object-cover opacity-80" />
              <div className="absolute inset-0 border-[20px] border-black/40" />
              <div className="absolute bottom-8 right-8 bg-black/80 backdrop-blur-md border border-white/10 p-4">
                <div className="text-[8px] font-mono text-amber-500 font-bold tracking-[0.3em]">SECURE_FILE // AOFL-09</div>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
};

export default HeroBanner;