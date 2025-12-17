"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type IconKind = "tiktok" | "x" | "instagram" | "facebook" | "linkedin" | "youtube" | "mail" | "phone" | "whatsapp" | "github" | "medium";

export type SocialItem = {
  href: string;
  label: string;
  kind: IconKind;
};

/* Verified Data Strip */
const DEFAULT_ITEMS: SocialItem[] = [
  { href: "https://x.com/AbrahamAda48634", label: "X", kind: "x" },
  { href: "https://www.tiktok.com/@abrahamoflondon", label: "TikTok", kind: "tiktok" },
  { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram", kind: "instagram" },
  { href: "https://www.facebook.com/profile.php?id=61566373432457", label: "Facebook", kind: "facebook" },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321", label: "LinkedIn", kind: "linkedin" },
  { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", kind: "youtube" },
  { href: "https://wa.me/447496334022", label: "WhatsApp", kind: "whatsapp" },
  { href: "mailto:info@abrahamoflondon.org", label: "Email", kind: "mail" },
];

const BRAND_COLORS: Record<IconKind, { gradient: string; glow: string }> = {
  tiktok: { gradient: "from-[#010101] to-[#69C9D0]", glow: "#69C9D0" },
  x: { gradient: "from-[#000000] to-[#71767B]", glow: "#71767B" },
  instagram: { gradient: "from-[#E4405F] via-[#FFC837] to-[#405DE6]", glow: "#E4405F" },
  facebook: { gradient: "from-[#1877F2] to-[#0A7CFF]", glow: "#1877F2" },
  linkedin: { gradient: "from-[#0A66C2] to-[#0E76A8]", glow: "#0A66C2" },
  youtube: { gradient: "from-[#FF0000] to-[#FF4747]", glow: "#FF0000" },
  mail: { gradient: "from-[#EA4335] via-[#FBBC05] to-[#34A853]", glow: "#EA4335" },
  phone: { gradient: "from-[#16A34A] to-[#22C55E]", glow: "#16A34A" },
  whatsapp: { gradient: "from-[#25D366] to-[#128C7E]", glow: "#25D366" },
  github: { gradient: "from-[#181717] to-[#333333]", glow: "#333333" },
  medium: { gradient: "from-[#000000] to-[#292929]", glow: "#000000" },
};

function LuxurySocialIcon({ kind, label, index }: { kind: IconKind; label: string; index: number }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const brand = BRAND_COLORS[kind];

  return (
    <motion.div
      className="relative inline-flex h-24 w-24 items-center justify-center"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.2, y: -12, rotate: 5 }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <motion.div 
        className={cn("absolute inset-0 rounded-3xl blur-2xl opacity-20", `bg-gradient-to-br ${brand.gradient}`)}
        animate={{ scale: isHovered ? 1.3 : 1, opacity: isHovered ? 0.4 : 0.2 }}
      />
      <div className="relative z-20 flex h-20 w-20 items-center justify-center rounded-2xl backdrop-blur-xl border border-white/20 bg-white/10 shadow-xl">
        <Image src={`/assets/images/social/svg/${kind}.svg`} alt={label} width={28} height={28} />
      </div>
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-gold text-black text-xs font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SocialFollowStrip() {
  return (
    <section className="mx-auto my-32 max-w-6xl px-4">
      <div className="relative rounded-4xl bg-black/90 border border-gold/20 p-16 text-center overflow-hidden">
        <h3 className="font-serif text-4xl text-gold mb-4">Join The Inner Circle</h3>
        <p className="text-cream/70 mb-12 max-w-2xl mx-auto">Strategic wisdom across every platform.</p>
        <div className="flex flex-wrap justify-center gap-8">
          {DEFAULT_ITEMS.map((item, i) => (
            <a key={item.kind} href={item.href} target="_blank" rel="noopener noreferrer">
              <LuxurySocialIcon kind={item.kind} label={item.label} index={i} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}