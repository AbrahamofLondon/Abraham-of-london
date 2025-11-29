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
];

/* ---------- Asset-based icons ---------- */

type IconKind = NonNullable<SocialItem["kind"]>;

function iconPathForKind(kind: IconKind): string {
  return `/assets/images/social/svg/${kind}.svg`;
}

const BRAND_HEX: Record<IconKind, string> = {
  tiktok: "#010101",
  x: "#000000",
  instagram: "#E4405F",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  mail: "#EA4335",
  phone: "#16A34A",
  whatsapp: "#25D366",
  github: "#181717",
  medium: "#000000",
};

/* ---------- Helpers ---------- */

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) =>
  href.startsWith("mailto:") || href.startsWith("tel:");

/* ---------- Stunning Floating Icon Component ---------- */
function FloatingSocialIcon({
  kind,
  label,
  index,
}: {
  kind: IconKind;
  label: string;
  index: number;
}): JSX.Element {
  const src = iconPathForKind(kind);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.span
      className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.15,
        y: -8,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
          delay: index * 0.1,
          type: "spring",
          stiffness: 300,
          damping: 24
        }
      }}
    >
      {/* Animated background glow */}
      <motion.span
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-200/20 opacity-0 blur-md"
        animate={{ 
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.2 : 1
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Main icon container */}
      <motion.span
        className={cn(
          "relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border-2 backdrop-blur-xl",
          "border-gold/40 bg-gradient-to-br from-white/90 to-cream/80 shadow-2xl",
          "hover:border-gold/80 hover:from-gold/20 hover:to-amber-200/30"
        )}
        animate={{
          rotate: isHovered ? 5 : 0,
        }}
      >
        <Image
          src={src}
          alt={label}
          width={24}
          height={24}
          className="transition-all duration-300"
          style={{
            filter: isHovered ? "brightness(1.2) contrast(1.1)" : "none"
          }}
        />
      </motion.span>

      {/* Floating label */}
      <AnimatePresence>
        {isHovered && (
          <motion.span
            className="absolute -bottom-8 left-1/2 z-20 whitespace-nowrap rounded-lg bg-charcoal/90 px-3 py-1 text-xs font-medium text-cream backdrop-blur-xl"
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 5, x: "-50%" }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
}

/* ---------- Stunning Main Component ---------- */
export default function SocialFollowStrip({
  variant = "dark",
  className,
  itemsOverride,
}: Props): JSX.Element {
  const items = (itemsOverride?.length ? itemsOverride : DEFAULT_ITEMS).filter(
    (it): it is SocialItem => Boolean(it)
  );

  // Luxury glass morphism panel
  const panelBase = cn(
    "relative rounded-3xl border shadow-2xl backdrop-blur-2xl overflow-hidden",
    "bg-gradient-to-br from-charcoal/80 to-black/90 border-gold/30",
    "hover:border-gold/60 hover:shadow-3xl transition-all duration-700"
  );

  // Animated background particles
  const ParticleBackground = () => (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-gold/20"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
          }}
          animate={{
            y: [null, -30, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.section
      className={cn("mx-auto my-20 max-w-4xl px-4 sm:px-6 lg:px-8", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      <motion.div
        className={panelBase}
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <ParticleBackground />
        
        <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16">
          {/* Premium header */}
          <motion.div 
            className="text-center mb-12"
            variants={itemVariants}
          >
            <motion.div
              className="mx-auto mb-6 h-1 w-24 bg-gradient-to-r from-gold to-amber-200 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
            
            <motion.h3
              className={cn(
                "font-serif text-3xl sm:text-4xl font-bold mb-4",
                "bg-gradient-to-r from-gold via-amber-200 to-gold bg-clip-text text-transparent"
              )}
              variants={itemVariants}
            >
              Join the Inner Circle
            </motion.h3>
            
            <motion.p
              className={cn(
                "text-lg leading-relaxed max-w-2xl mx-auto",
                variant === "dark" ? "text-cream/80" : "text-charcoal/80"
              )}
              variants={itemVariants}
            >
              Connect with Abraham across platforms for exclusive insights on faith, 
              strategy, and legacy building. No algorithms, just authentic conversation.
            </motion.p>
          </motion.div>

          {/* Stunning social grid */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 sm:gap-8"
            variants={containerVariants}
          >
            {items.map(({ href, label, kind }, index) => {
              const iconKind = kind as IconKind | undefined;

              const content = (
                <FloatingSocialIcon 
                  kind={iconKind!} 
                  label={label} 
                  index={index}
                />
              );

              const external = isExternal(href);

              if (external || isUtility(href)) {
                return (
                  <motion.a
                    key={`${label}-${href}`}
                    href={href}
                    className="inline-flex items-center"
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    variants={itemVariants}
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

          {/* Premium footer */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <motion.p
              className={cn(
                "text-sm font-light tracking-wide",
                variant === "dark" ? "text-gold/60" : "text-gold/70"
              )}
              whileHover={{ scale: 1.02 }}
            >
              Building legacies that outlive us
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
}