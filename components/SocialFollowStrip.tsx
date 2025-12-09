"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- Local utility: cn (no external deps) ---------- */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Types ---------- */
type Variant = "light" | "dark";

export type SocialItem = {
  href: string;
  label: string;
  kind?:
    | "tiktok"
    | "x"
    | "instagram"
    | "facebook"
    | "linkedin"
    | "youtube"
    | "mail"
    | "phone"
    | "whatsapp"
    | "github"
    | "medium";
};

type Props = {
  variant?: Variant;
  className?: string;
  itemsOverride?: SocialItem[];
  showHeader?: boolean;
  showFooter?: boolean;
};

/* ---------- Stunning Default Items ---------- */
const DEFAULT_ITEMS: SocialItem[] = [
  {
    href: "https://github.com/AbrahamofLondon",
    label: "GitHub",
    kind: "github",
  },
  {
    href: "https://medium.com/@seunadaramola",
    label: "Medium",
    kind: "medium",
  },
  {
    href: "https://tiktok.com/@abrahamoflondon",
    label: "TikTok",
    kind: "tiktok",
  },
  {
    href: "https://x.com/AbrahamAda48634",
    label: "X",
    kind: "x",
  },
  {
    href: "https://www.instagram.com/abraham_of_london_/",
    label: "Instagram",
    kind: "instagram",
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    label: "LinkedIn",
    kind: "linkedin",
  },
  {
    href: "https://www.youtube.com/@abrahamoflondon",
    label: "YouTube",
    kind: "youtube",
  },
  {
    href: "mailto:info@abrahamoflondon.org",
    label: "Email",
    kind: "mail",
  },
  {
    href: "tel:+442086225909",
    label: "Phone",
    kind: "phone",
  },
  {
    href: "https://wa.me/447496334022",
    label: "WhatsApp",
    kind: "whatsapp",
  },
  {
    href: "https://www.facebook.com/share/16tvsnTgRG/",
    label: "Facebook",
    kind: "facebook",
  },
];

/* ---------- Asset-based icons ---------- */

type IconKind = NonNullable<SocialItem["kind"]>;

function iconPathForKind(kind: IconKind): string {
  return `/assets/images/social/svg/${kind}.svg`;
}

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

/* ---------- Helpers ---------- */
const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) =>
  href.startsWith("mailto:") || href.startsWith("tel:");

/* ---------- Luxury Glass Morphic Icon Component ---------- */
function LuxurySocialIcon({
  kind,
  label,
  index,
}: {
  kind: IconKind;
  label: string;
  index: number;
}): JSX.Element {
  const [isHovered, setIsHovered] = React.useState(false);
  const brand = BRAND_COLORS[kind];

  return (
    <motion.div
      className="relative inline-flex h-24 w-24 items-center justify-center"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.2,
        y: -12,
        rotate: 5,
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 15,
          mass: 0.8 
        }
      }}
      whileTap={{ scale: 0.9 }}
      initial={{ 
        opacity: 0, 
        y: 40, 
        scale: 0.7,
        rotate: -10 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotate: 0,
        transition: { 
          delay: index * 0.08,
          type: "spring",
          stiffness: 200,
          damping: 20,
          mass: 1
        }
      }}
    >
      {/* Animated Orbital Rings */}
      <motion.div
        className="absolute inset-0"
        animate={{
          rotate: isHovered ? 360 : 0,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="absolute inset-0 rounded-full border border-gold/10" />
        <div className="absolute inset-4 rounded-full border border-gold/5" />
      </motion.div>

      {/* Pulsing Glow Effect */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-3xl blur-2xl opacity-20",
          `bg-gradient-to-br ${brand.gradient}`
        )}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: isHovered ? [0.2, 0.4, 0.2] : 0.1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />

      {/* Luxury Glass Morphic Card */}
      <motion.div
        className={cn(
          "relative z-20 flex h-20 w-20 items-center justify-center rounded-2xl",
          "backdrop-blur-xl border border-white/20",
          "bg-gradient-to-br from-white/15 via-white/10 to-white/5",
          "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          "hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
          "hover:border-white/40"
        )}
        animate={{
          boxShadow: isHovered 
            ? `0 0 40px ${brand.glow}40, 0 20px 60px rgba(0,0,0,0.5)` 
            : "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Brand Gradient Overlay */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-2xl opacity-0",
            `bg-gradient-to-br ${brand.gradient}`
          )}
          animate={{ opacity: isHovered ? 0.3 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Icon Container */}
        <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm shadow-inner">
          <Image
            src={iconPathForKind(kind)}
            alt={label}
            width={28}
            height={28}
            className={cn(
              "transition-all duration-500",
              isHovered && "scale-110 brightness-125"
            )}
          />
        </div>

        {/* Micro Particles */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-white"
                  initial={{
                    x: 10,
                    y: 10,
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: Math.cos((i / 8) * Math.PI * 2) * 30,
                    y: Math.sin((i / 8) * Math.PI * 2) * 30,
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Animated Label Ribbon */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute -bottom-10 left-1/2 z-30"
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 10, x: "-50%" }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 25 
            }}
          >
            <div className="relative">
              {/* Ribbon Tail */}
              <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-gradient-to-br from-gold/90 to-amber-200/90" />
              
              {/* Ribbon Body */}
              <div className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold tracking-wide",
                "bg-gradient-to-r from-gold/90 to-amber-200/90",
                "shadow-lg backdrop-blur-md",
                "border border-white/30"
              )}>
                <span className="bg-gradient-to-b from-charcoal to-black bg-clip-text text-transparent">
                  {label}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- Stunning Particle Background ---------- */
function LuxuryParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl">
      {/* Animated Gradient Mesh */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.3) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.4) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, rgba(212, 175, 55, 0.3) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      
      {/* Floating Particles */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px w-px bg-gradient-to-r from-gold to-amber-200"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            opacity: 0.1,
            scale: 0,
          }}
          animate={{
            y: [null, "-100%", "100%"],
            x: [null, `${Math.random() * 20 - 10}%`, `${Math.random() * 20 - 10}%`],
            opacity: [0.1, 0.8, 0.1],
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Stunning Main Component ---------- */
export default function SocialFollowStrip({
  variant = "dark",
  className,
  itemsOverride,
  showHeader = true,
  showFooter = true,
}: Props): JSX.Element {
  const items = (itemsOverride?.length ? itemsOverride : DEFAULT_ITEMS).filter(
    (it): it is SocialItem => Boolean(it)
  );

  // Luxury glass morphism panel
  const panelBase = cn(
    "relative rounded-4xl border shadow-2xl backdrop-blur-3xl overflow-hidden",
    "bg-gradient-to-br from-charcoal/95 via-black/95 to-charcoal/95",
    "border border-gold/20 border-b-gold/40 border-r-gold/40",
    "hover:border-gold/40 hover:shadow-4xl transition-all duration-1000",
    "before:absolute before:inset-0 before:rounded-4xl",
    "before:bg-gradient-to-br before:from-white/5 before:via-transparent before:to-white/5",
    "before:opacity-0 before:hover:opacity-100 before:transition-opacity before:duration-700"
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        mass: 0.8,
      },
    },
  };

  return (
    <motion.section
      className={cn("mx-auto my-32 max-w-6xl px-4 sm:px-6 lg:px-8", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-150px" }}
      variants={containerVariants}
    >
      <motion.div
        className={panelBase}
        whileHover={{ 
          y: -10,
          transition: { type: "spring", stiffness: 200, damping: 25 }
        }}
      >
        <LuxuryParticleBackground />
        
        <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20">
          {/* Premium Header */}
          {showHeader && (
            <motion.div 
              className="text-center mb-16"
              variants={containerVariants}
            >
              <motion.div
                className="mx-auto mb-8 flex justify-center"
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                transition={{ delay: 0.3, duration: 1 }}
              >
                <div className="h-1 w-12 bg-gradient-to-r from-transparent via-gold to-transparent" />
                <div className="mx-4 h-1 w-24 bg-gradient-to-r from-gold via-amber-200 to-gold" />
                <div className="h-1 w-12 bg-gradient-to-r from-transparent via-gold to-transparent" />
              </motion.div>
              
              <motion.h3
                className={cn(
                  "font-serif text-4xl sm:text-5xl font-bold mb-6",
                  "bg-gradient-to-r from-gold via-amber-200 to-gold bg-clip-text text-transparent",
                  "drop-shadow-2xl"
                )}
                variants={itemVariants}
              >
                Join The Inner Circle
              </motion.h3>
              
              <motion.p
                className={cn(
                  "text-xl leading-relaxed max-w-3xl mx-auto font-light",
                  "text-cream/90 tracking-wide"
                )}
                variants={itemVariants}
              >
                Connect across platforms for exclusive wisdom on faith, strategy, 
                and building legacies that echo through generations.
              </motion.p>

              {/* Animated Decorative Elements */}
              <motion.div
                className="mt-8 flex justify-center gap-4"
                variants={containerVariants}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1 rounded-full bg-gradient-to-r from-gold/30 to-amber-200/30"
                    initial={{ width: 0 }}
                    animate={{ width: 32 }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Stunning Social Grid */}
          <motion.div
            className="flex flex-wrap justify-center gap-8 sm:gap-12"
            variants={containerVariants}
          >
            {items.map(({ href, label, kind }, index) => {
              const iconKind = kind as IconKind | undefined;
              if (!iconKind) return null;

              const content = (
                <LuxurySocialIcon 
                  kind={iconKind} 
                  label={label} 
                  index={index}
                />
              );

              const external = isExternal(href);
              const utility = isUtility(href);

              if (external || utility) {
                return (
                  <motion.a
                    key={`${label}-${href}`}
                    href={href}
                    className="inline-flex items-center"
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {content}
                  </motion.a>
                );
              }

              return (
                <motion.div key={`${label}-${href}`} variants={itemVariants}>
                  <Link
                    href={href}
                    className="inline-flex items-center"
                    prefetch={false}
                  >
                    {content}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Premium Footer */}
          {showFooter && (
            <motion.div
              className="mt-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <motion.div
                className="inline-flex items-center gap-4"
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/50" />
                <motion.p
                  className={cn(
                    "text-sm font-light tracking-widest uppercase",
                    "text-gold/70"
                  )}
                  whileHover={{ scale: 1.05 }}
                >
                  Building Enduring Legacies
                </motion.p>
                <div className="h-px w-12 bg-gradient-to-r from-gold/50 to-transparent" />
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.section>
  );
}