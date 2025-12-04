"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { LIBRARY_AESTHETICS } from "@/lib/content";

export type Brand = {
  name: string;
  description: string;
  logo: string;
  url: string;
  metric?: string;
  secondaryHref?: string;
  secondaryText?: string;
  color?: string;
};

const pickUrl = (...candidates: (string | undefined | null)[]) =>
  candidates.find((u) => typeof u === "string" && u.trim().length) || "#";

// Prefer env overrides; fall back to branded InnovateHub domain
const INNOVATE_HUB_BASE = pickUrl(
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL,
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL,
  "https://innovatehub.abrahamoflondon.org"
);

const INNOVATE_HUB_EARLY_ACCESS = new URL(
  "/forms/early-access.html",
  INNOVATE_HUB_BASE
).toString();

const ALOMARADA_URL = pickUrl(
  process.env.NEXT_PUBLIC_ALOMARADA_URL,
  "https://alomarada.com"
);

const ENDURELUXE_URL = pickUrl(
  process.env.NEXT_PUBLIC_ENDURELUXE_URL,
  "https://endureluxe.com"
);

export const defaultBrands: Brand[] = [
  {
    name: "Alomarada",
    description:
      "Advisory, governance, and operating structures for investors and founders building Africa-facing ventures with integrity.",
    logo: "/assets/images/alomarada-ltd.webp",
    url: ALOMARADA_URL,
    metric: "Investor & founder stewardship",
    color: "#059669", // Emerald for growth/advisory
  },
  {
    name: "EndureLuxe",
    description:
      "Premium, sustainable fitness partnerships that promote wellbeing—powered by community and thoughtful technology.",
    logo: "/assets/images/endureluxe-ltd.webp",
    url: ENDURELUXE_URL,
    metric: "Performance & wellbeing ecosystems",
    color: "#7C3AED", // Violet for luxury/wellness
  },
  {
    name: "InnovateHub",
    description:
      "Strategy, playbooks, and hands-on product support to ship durable products—rooted in ethics, clarity, and excellent craft.",
    logo: "/assets/images/innovatehub.svg",
    url: INNOVATE_HUB_BASE,
    secondaryHref: INNOVATE_HUB_EARLY_ACCESS,
    secondaryText: "Early access",
    metric: "Founder operating system",
    color: "#0369A1", // Sky blue for innovation/technology
  },
];

type VenturesProps = { brandsData?: Brand[] };

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

const item = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

const cardItem = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  hover: {
    y: -8,
    transition: { duration: 0.3 },
  },
} as const;

function ExternalAwareLink(
  props: React.ComponentProps<typeof Link> & { href: string }
) {
  const isExternal = /^https?:\/\//i.test(props.href);
  return (
    <Link
      {...props}
      target={isExternal ? "_blank" : props.target}
      rel={isExternal ? "noopener noreferrer" : props.rel}
      prefetch={false}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* LUXURY DESIGN COMPONENTS                                                   */
/* -------------------------------------------------------------------------- */

const GoldFoilCorner: React.FC<{ position: "tl" | "tr" | "bl" | "br" }> = ({
  position,
}) => {
  const positions = {
    tl: "left-0 top-0 border-l border-t",
    tr: "right-0 top-0 border-r border-t",
    bl: "left-0 bottom-0 border-l border-b",
    br: "right-0 bottom-0 border-r border-b",
  };

  return (
    <div className={`absolute h-4 w-4 ${positions[position]}`}>
      <div
        className={`absolute ${
          position.includes("t") ? "-top-px" : "-bottom-px"
        } ${position.includes("l") ? "-left-px" : "-right-px"} h-2 w-2`}
        style={{
          borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}80`,
        }}
      />
    </div>
  );
};

const VentureGlow: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0 overflow-hidden rounded-2xl">
    <div
      className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-20 blur-2xl"
      style={{ backgroundColor: color }}
    />
    <div
      className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-20 blur-2xl"
      style={{ backgroundColor: color }}
    />
  </div>
);

function BrandCard({ brand }: { brand: Brand }) {
  const reduce = useReducedMotion();
  const brandColor = brand.color || LIBRARY_AESTHETICS.colors.primary.saffron;

  return (
    <motion.article
      variants={cardItem}
      whileHover={reduce ? undefined : "hover"}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border p-8 backdrop-blur-xl"
      style={{
        borderColor: `${brandColor}30`,
        backgroundColor: "rgba(15,23,42,0.7)",
        backgroundImage: `
          radial-gradient(circle at 20% 80%, ${brandColor}15, transparent 50%),
          linear-gradient(135deg, ${brandColor}08 0%, transparent 40%)
        `,
      }}
    >
      {/* Gold foil corners */}
      <GoldFoilCorner position="tl" />
      <GoldFoilCorner position="tr" />
      <GoldFoilCorner position="bl" />
      <GoldFoilCorner position="br" />

      {/* Venture-specific glow */}
      <VentureGlow color={brandColor} />

      {/* Logo container with luxury border */}
      <div className="relative mb-6">
        <div
          className="absolute -inset-2 rounded-xl opacity-20 blur-lg"
          style={{ backgroundColor: brandColor }}
        />
        <div className="relative mx-auto h-32 w-48">
          <div
            className="absolute inset-0 rounded-lg border opacity-20"
            style={{ borderColor: brandColor }}
          />
          <Image
            src={brand.logo || "/assets/images/default-brand.svg"}
            alt={`${brand.name} logo`}
            fill
            sizes="192px"
            className="object-contain p-4"
            loading="lazy"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative mb-4 flex-1">
        <div className="mb-3 flex items-center justify-between">
          <h3
            className="font-serif text-2xl font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            {brand.name}
          </h3>
          <div
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ backgroundColor: brandColor }}
          />
        </div>

        <p
          className="mb-4 text-sm leading-relaxed opacity-80"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          {brand.description}
        </p>

        {brand.metric && (
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              backgroundColor: `${brandColor}15`,
              border: `1px solid ${brandColor}30`,
            }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: brandColor }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: brandColor }}
            >
              {brand.metric}
            </span>
          </div>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="relative mt-4 flex flex-wrap items-center justify-center gap-3">
        <ExternalAwareLink
          href={brand.url}
          className="group/link relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:shadow-xl"
          style={{
            backgroundColor: brandColor,
            color: "#0f172a",
          }}
        >
          <div
            className="absolute inset-0 translate-y-full bg-white/30 transition-transform duration-300 group-hover/link:translate-y-0"
          />
          <span className="relative flex items-center gap-2">
            Learn more
            <span className="transition-transform group-hover/link:translate-x-1">
              ↗
            </span>
          </span>
        </ExternalAwareLink>

        {brand.secondaryHref && brand.secondaryText && (
          <ExternalAwareLink
            href={brand.secondaryHref}
            className="group/link rounded-full border px-4 py-2 text-xs font-medium transition-all hover:gap-3"
            style={{
              borderColor: `${brandColor}50`,
              backgroundColor: `${brandColor}10`,
              color: brandColor,
            }}
          >
            <span className="flex items-center gap-2">
              {brand.secondaryText}
              <span className="transition-transform group-hover/link:translate-x-1">
                →
              </span>
            </span>
          </ExternalAwareLink>
        )}
      </div>
    </motion.article>
  );
}

export default function VenturesSection({
  brandsData = defaultBrands,
}: VenturesProps) {
  const reduce = useReducedMotion();

  return (
    <section
      id="ventures"
      className="relative overflow-hidden"
      aria-labelledby="ventures-title"
    >
      {/* Luxury background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 30% 70%, rgba(250,204,21,0.08) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(30,64,175,0.05) 0%, transparent 50%),
              linear-gradient(to bottom, rgba(15,23,42,0.95), rgba(15,23,42,0.8))
            `,
          }}
        />
        {/* Luxury grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(212,175,55,0.1) 1px, transparent 1px),
              linear-gradient(rgba(212,175,55,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="py-12"
        >
          {/* Header */}
          <motion.header
            variants={item}
            className="mb-12 text-center"
          >
            <div className="mb-6">
              <div
                className="inline-flex items-center gap-3 rounded-full px-4 py-2"
                style={{
                  backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}15`,
                  border: `1px solid ${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                }}
              >
                <div
                  className="text-lg"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
                >
                  ⚙
                </div>
                <span
                  className="text-xs font-medium uppercase tracking-widest"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
                >
                  Ventures
                </span>
              </div>
            </div>
            
            <h2
              id="ventures-title"
              className="mb-4 font-serif text-4xl font-light text-cream sm:text-5xl"
            >
              Where philosophy becomes operating system
            </h2>
            
            <p
              className="mx-auto max-w-3xl text-lg leading-relaxed opacity-80"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Alomarada, EndureLuxe, and InnovateHub are not side projects.
              They are execution arms of the Canon — testing grounds for
              strategy, governance, and multi-generational design.
            </p>
          </motion.header>

          {/* Abraham of London meta-card - Luxury Edition */}
          <motion.div
            variants={item}
            className="group relative mb-16 overflow-hidden rounded-3xl border p-8 backdrop-blur-xl"
            style={{
              borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
              backgroundColor: "rgba(15,23,42,0.7)",
              backgroundImage: `
                radial-gradient(circle at 20% 80%, ${LIBRARY_AESTHETICS.colors.primary.saffron}15, transparent 50%),
                radial-gradient(circle at 80% 20%, ${LIBRARY_AESTHETICS.colors.primary.lapis}10, transparent 50%)
              `,
            }}
            whileHover={reduce ? undefined : { y: -4 }}
          >
            {/* Gold foil borders */}
            <div className="absolute left-0 top-0 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <div className="absolute right-0 top-0 h-px w-24 bg-gradient-to-l from-transparent via-amber-400/60 to-transparent" />
            <div className="absolute bottom-0 left-0 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <div className="absolute bottom-0 right-0 h-px w-24 bg-gradient-to-l from-transparent via-amber-400/60 to-transparent" />

            <div className="relative flex flex-col items-center gap-8 md:flex-row md:gap-12">
              {/* Logo with luxury frame */}
              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-2xl opacity-20 blur-xl"
                  style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron }}
                />
                <div
                  className="relative rounded-xl border p-4"
                  style={{
                    borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <div className="relative h-24 w-48">
                    <Image
                      src="/assets/images/logo/abraham-of-london-logo.svg"
                      alt="Abraham of London brand logo"
                      fill
                      sizes="192px"
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-3">
                  <h3
                    className="font-serif text-3xl font-medium"
                    style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                  >
                    Abraham of London
                  </h3>
                  <div
                    className="mt-2 h-px w-16"
                    style={{ backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}50` }}
                  />
                </div>
                
                <p
                  className="mb-6 text-lg leading-relaxed opacity-80"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                >
                  The holding narrative — Canon, standards, and stewardship that
                  tether all ventures back to purpose, responsibility, and legacy.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 md:justify-start">
                  <Link
                    href="/about"
                    prefetch={false}
                    className="group/link inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-medium transition-all hover:gap-4"
                    style={{
                      borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}60`,
                      backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}15`,
                      color: LIBRARY_AESTHETICS.colors.primary.saffron,
                    }}
                  >
                    <span>About the work</span>
                    <span className="transition-transform group-hover/link:translate-x-1">
                      →
                    </span>
                  </Link>
                  
                  <Link
                    href="/context"
                    prefetch={false}
                    className="inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-medium transition-all hover:gap-4"
                    style={{
                      borderColor: `${LIBRARY_AESTHETICS.colors.primary.parchment}30`,
                      backgroundColor: "rgba(245, 245, 220, 0.05)",
                      color: LIBRARY_AESTHETICS.colors.primary.parchment,
                    }}
                  >
                    <span>Philosophy & Context</span>
                    <span className="transition-transform group-hover:translate-x-1">
                      ↗
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Brands grid */}
          <motion.div
            variants={container}
            className="grid gap-8 md:grid-cols-3"
          >
            {brandsData.map((b) => (
              <BrandCard key={b.name} brand={b} />
            ))}
          </motion.div>

          {/* Footer CTA */}
          <motion.div
            variants={item}
            className="mt-16 text-center"
          >
            <Link
              href="/ventures"
              prefetch={false}
              className="group/link inline-flex items-center gap-3 rounded-full border px-8 py-3 text-sm font-medium transition-all hover:gap-4 hover:shadow-xl"
              style={{
                borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
                backgroundColor: "rgba(15,23,42,0.5)",
                color: LIBRARY_AESTHETICS.colors.primary.parchment,
              }}
            >
              <span>View all ventures</span>
              <span className="transition-transform group-hover/link:translate-x-1">
                →
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}