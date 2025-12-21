// components/SocialFollowStrip.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Phone,
  Music2,
  Globe,
} from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type IconKind =
  | "tiktok"
  | "x"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "mail"
  | "phone"
  | "whatsapp";

export type SocialItem = {
  href: string;
  label: string;
  kind: IconKind;
};

// ✅ Your verified links (kept as-is, cleaned only where obviously broken)
const DEFAULT_ITEMS: SocialItem[] = [
  { href: "https://x.com/AbrahamAda48634", label: "X", kind: "x" },
  { href: "https://www.tiktok.com/@abrahamoflondon", label: "TikTok", kind: "tiktok" },
  { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram", kind: "instagram" },
  { href: "https://www.facebook.com/share/1Gvu4ZunTq/", label: "Facebook", kind: "facebook" },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321", label: "LinkedIn", kind: "linkedin" },
  { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", kind: "youtube" },
  { href: "mailto:info@abrahamoflondon.org", label: "Email", kind: "mail" },
];

const BRAND_COLORS: Record<IconKind, { gradient: string }> = {
  tiktok: { gradient: "from-[#010101] to-[#69C9D0]" },
  x: { gradient: "from-[#000000] to-[#71767B]" },
  instagram: { gradient: "from-[#E4405F] via-[#FFC837] to-[#405DE6]" },
  facebook: { gradient: "from-[#1877F2] to-[#0A7CFF]" },
  linkedin: { gradient: "from-[#0A66C2] to-[#0E76A8]" },
  youtube: { gradient: "from-[#FF0000] to-[#FF4747]" },
  mail: { gradient: "from-[#EA4335] via-[#FBBC05] to-[#34A853]" },
  phone: { gradient: "from-[#16A34A] to-[#22C55E]" },
  whatsapp: { gradient: "from-[#25D366] to-[#128C7E]" },
};

const FALLBACK_ICON: Record<IconKind, React.ComponentType<any>> = {
  x: Twitter,
  tiktok: Music2,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  mail: Mail,
  phone: Phone,
  whatsapp: Phone,
};

function LuxurySocialIcon({
  item,
  index,
}: {
  item: SocialItem;
  index: number;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [svgOk, setSvgOk] = React.useState(true);

  const brand = BRAND_COLORS[item.kind];
  const Fallback = FALLBACK_ICON[item.kind] ?? Globe;

  // If you actually have these SVGs locally, great:
  // public/assets/images/social/svg/x.svg, tiktok.svg, instagram.svg, etc.
  const svgPath = `/assets/images/social/svg/${item.kind}.svg`;

  return (
    <motion.div
      className="relative inline-flex h-24 w-24 items-center justify-center"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.14, y: -10, rotate: 4 }}
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
    >
      <motion.div
        className={cn(
          "absolute inset-0 rounded-[1.75rem] blur-2xl opacity-20",
          `bg-gradient-to-br ${brand.gradient}`
        )}
        animate={{ scale: isHovered ? 1.25 : 1, opacity: isHovered ? 0.42 : 0.2 }}
        transition={{ duration: 0.25 }}
      />

      <div className="relative z-20 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-xl">
        {svgOk ? (
          <Image
            src={svgPath}
            alt={item.label}
            width={28}
            height={28}
            onError={() => setSvgOk(false)}
          />
        ) : (
          <Fallback className="h-7 w-7 text-white/85" />
        )}
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SocialFollowStrip({
  items = DEFAULT_ITEMS,
  title = "Join The Inner Circle",
  subtitle = "Strategic wisdom across every platform.",
}: {
  items?: SocialItem[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="mx-auto my-24 max-w-6xl px-4">
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-400/20 bg-black/90 p-10 text-center sm:p-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />

        <h3 className="relative z-10 mb-3 font-serif text-3xl text-amber-300 sm:text-4xl">
          {title}
        </h3>
        <p className="relative z-10 mx-auto mb-10 max-w-2xl text-sm text-white/70 sm:text-base">
          {subtitle}
        </p>

        <div className="relative z-10 flex flex-wrap justify-center gap-8">
          {items.map((item, i) => (
            <a
              key={`${item.kind}-${item.href}`}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : "_self"}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={`Open ${item.label}`}
            >
              <LuxurySocialIcon item={item} index={i} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}