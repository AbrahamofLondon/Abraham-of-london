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
    | "whatsapp";
};

type Props = {
  variant?: Variant;
  className?: string;
  itemsOverride?: SocialItem[];
};

/* ---------- Defaults (your real accounts) ---------- */
const DEFAULT_ITEMS: SocialItem[] = [
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
    href: "https://www.facebook.com/share/16tvsnTgRG/",
    label: "Facebook",
    kind: "facebook",
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
    label: "Landline",
    kind: "phone",
  },
  {
    href: "https://wa.me/447496334022",
    label: "WhatsApp",
    kind: "whatsapp",
  },
];

/* ---------- Asset-based icons ---------- */

type IconKind = NonNullable<SocialItem["kind"]>;

/**
 * Convention: each kind maps to /assets/images/social/svg/{kind}.svg
 */
function iconPathForKind(kind: IconKind): string {
  return `/assets/images/social/svg/${kind}.svg`;
}

/**
 * Brand colour accent per platform.
 */
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
};

/* ---------- Helpers ---------- */

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) =>
  href.startsWith("mailto:") || href.startsWith("tel:");

/**
 * Premium icon renderer with hover animations
 */
function SocialIcon({
  kind,
  label,
}: {
  kind: IconKind;
  label: string;
}): JSX.Element {
  const src = iconPathForKind(kind);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.span 
      className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <Image
        src={src}
        alt={label}
        fill
        sizes="24px"
        className="object-contain transition-all duration-300"
      />
      
      {/* Hover glow effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.span
            className="absolute inset-0 rounded-full bg-current opacity-20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.2 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.span>
  );
}

/**
 * Premium fallback icon
 */
function DefaultLinkIcon({ label }: { label: string }): JSX.Element {
  return (
    <motion.span
      aria-hidden="true"
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gold to-amber-200 text-[10px] font-bold text-charcoal shadow-sm"
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {label.charAt(0).toUpperCase()}
    </motion.span>
  );
}

/* ---------- Component ---------- */
export default function SocialFollowStrip({
  variant = "dark",
  className,
  itemsOverride,
}: Props): JSX.Element {
  const items = (itemsOverride?.length ? itemsOverride : DEFAULT_ITEMS).filter(
    (it): it is SocialItem => Boolean(it),
  );

  // Luxury panel styling
  const panelBase = cn(
    "rounded-3xl border-2 shadow-2xl backdrop-blur-xl transition-all duration-500",
    "bg-gradient-to-br from-charcoal/95 to-black/95 border-gold/20",
    "hover:border-gold/40 hover:shadow-3xl"
  );

  // Premium pill styling
  const pillBase = cn(
    "group relative inline-flex items-center gap-3 rounded-2xl border-2 px-4 py-3",
    "text-sm font-medium transition-all duration-300 overflow-hidden",
    "border-gold/30 bg-gradient-to-r from-gold/5 to-gold/10",
    "hover:border-gold/60 hover:from-gold/10 hover:to-gold/20 hover:shadow-lg"
  );

  const textColor = variant === "dark" ? "text-cream" : "text-charcoal";
  const subColor = variant === "dark" ? "text-gold/70" : "text-gold/80";

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.section
      className={cn(
        "mx-auto my-16 max-w-6xl px-4 sm:px-6 lg:px-8",
        className,
      )}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
    >
      <motion.div 
        className={panelBase}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex flex-col gap-8 px-8 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-12 sm:py-10">
          {/* Premium text block */}
          <motion.div 
            className="max-w-xl space-y-3"
            variants={itemVariants}
          >
            <motion.p 
              className="text-xs font-bold uppercase tracking-[0.3em] text-gold"
              variants={itemVariants}
            >
              Join The Inner Circle
            </motion.p>
            <motion.h3
              className={cn(
                "font-serif text-2xl sm:text-3xl leading-tight",
                textColor,
              )}
              variants={itemVariants}
            >
              Connect with{" "}
              <span className="bg-gradient-to-r from-gold to-amber-200 bg-clip-text text-transparent font-bold">
                Abraham of London
              </span>
            </motion.h3>
            <motion.p 
              className={cn("text-sm leading-relaxed", subColor)}
              variants={itemVariants}
            >
              Exclusive insights, strategic frameworks, and real conversations 
              across platforms that matter. No fluff, just signal.
            </motion.p>
          </motion.div>

          {/* Animated social pills */}
          <motion.nav
            aria-label="Social links"
            className="flex flex-wrap justify-center gap-3 sm:justify-end"
            variants={containerVariants}
          >
            {items.map(({ href, label, kind }) => {
              const iconKind = kind as IconKind | undefined;
              const accentColor = iconKind ? BRAND_HEX[iconKind] : undefined;

              const IconNode = iconKind ? (
                <SocialIcon kind={iconKind} label={label} />
              ) : (
                <DefaultLinkIcon label={label} />
              );

              const content = (
                <motion.span
                  className={pillBase}
                  style={accentColor ? { color: accentColor } : undefined}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    transition: { type: "spring", stiffness: 400 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Animated background */}
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-gold/20 to-amber-200/20 opacity-0 group-hover:opacity-100"
                    initial={false}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Border glow */}
                  <motion.span
                    className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-gold to-amber-200 opacity-0 group-hover:opacity-20"
                    initial={false}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {IconNode}
                  <span className="font-medium text-current relative z-10">
                    {label}
                  </span>
                </motion.span>
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
                    whileHover="hover"
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
          </motion.nav>
        </div>

        {/* Premium footer note */}
        <motion.div 
          className="border-t border-gold/20 px-8 py-4 sm:px-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className={cn("text-center text-xs", subColor)}>
            Real conversations about faith, strategy, and legacy building
          </p>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}