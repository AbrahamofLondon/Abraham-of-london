"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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

const INNOVATE_HUB_BASE = pickUrl(
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL,
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL,
  "https://innovatehub.abrahamoflondon.org"
);

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
    description: "Board-level advisory, operating systems, and market-entry strategy for founders, boards, and institutions who take Africa seriously.",
    logo: "/assets/images/alomarada-ltd.webp",
    url: ALOMARADA_URL,
    metric: "Strategic Advisory",
    color: "#059669", // Emerald
  },
  {
    name: "EndureLuxe",
    description: "Community-driven fitness and performance gear for people who train, build, and endure – designed to survive real life, not just product shoots.",
    logo: "/assets/images/endureluxe-ltd.webp",
    url: ENDURELUXE_URL,
    metric: "Performance Ecosystem",
    color: "#7C3AED", // Violet
  },
  {
    name: "InnovateHub",
    description: "Strategy, playbooks, and hands-on support to help founders test ideas, ship durable products, and build operating rhythms that actually hold.",
    logo: "/assets/images/innovatehub.svg",
    url: INNOVATE_HUB_BASE,
    secondaryText: "Early Access",
    metric: "Innovation Engine",
    color: "#0369A1", // Sky Blue
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  hover: {
    y: -8,
    transition: {
      duration: 0.3,
    },
  },
};

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http');
  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group/link"
    >
      {children}
    </Link>
  );
}

function VentureCard({ brand }: { brand: Brand }) {
  const brandColor = brand.color || LIBRARY_AESTHETICS.colors.primary.saffron;

  return (
    <motion.article
      variants={cardVariants}
      whileHover="hover"
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border p-6"
      style={{
        borderColor: `${brandColor}20`,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, ${brandColor}15, transparent 50%),
          linear-gradient(135deg, ${brandColor}08 0%, transparent 40%)
        `,
      }}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 h-4 w-4 border-l border-t" style={{ borderColor: `${brandColor}40` }} />
      <div className="absolute top-0 right-0 h-4 w-4 border-r border-t" style={{ borderColor: `${brandColor}40` }} />
      <div className="absolute bottom-0 left-0 h-4 w-4 border-l border-b" style={{ borderColor: `${brandColor}40` }} />
      <div className="absolute bottom-0 right-0 h-4 w-4 border-r border-b" style={{ borderColor: `${brandColor}40` }} />

      {/* Logo container */}
      <div className="relative mb-6">
        <div
          className="absolute -inset-2 rounded-xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500"
          style={{ backgroundColor: brandColor }}
        />
        <div className="relative h-20 w-32 mx-auto">
          <Image
            src={brand.logo || "/assets/images/default-brand.svg"}
            alt={`${brand.name} logo`}
            fill
            className="object-contain"
            sizes="128px"
          />
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3
            className="font-serif text-xl font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            {brand.name}
          </h3>
          <div
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ backgroundColor: brandColor }}
          />
        </div>

        {brand.metric && (
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
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

        <p
          className="text-sm leading-relaxed opacity-80"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          {brand.description}
        </p>
      </div>

      {/* CTA */}
      <div className="mt-auto pt-4 border-t" style={{ borderColor: `${brandColor}20` }}>
        <ExternalLink href={brand.url}>
          <div
            className="flex items-center justify-between rounded-lg px-4 py-2 transition-all hover:px-5"
            style={{
              backgroundColor: `${brandColor}15`,
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: brandColor }}
            >
              Visit Venture
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70" style={{ color: brandColor }}>
                ↗
              </span>
            </div>
          </div>
        </ExternalLink>
      </div>
    </motion.article>
  );
}

export default function VenturesSection({ brandsData = defaultBrands }: { brandsData?: Brand[] }) {
  return (
    <div className="py-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        {/* Section Header */}
        <motion.div variants={itemVariants} className="mb-12 text-center">
          <div className="mb-4">
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              Ventures
            </span>
          </div>
          <h2
            className="mb-4 font-serif text-3xl font-light sm:text-4xl"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            Where philosophy becomes operating system
          </h2>
          <p
            className="mx-auto max-w-2xl text-lg leading-relaxed opacity-80"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            Alomarada, EndureLuxe, and InnovateHub are execution arms of the
            Canon — testing grounds for strategy, governance, and multi-generational design.
          </p>
        </motion.div>

        {/* Ventures Grid */}
        <motion.div
          variants={containerVariants}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {brandsData.map((brand) => (
            <VentureCard key={brand.name} brand={brand} />
          ))}
        </motion.div>

        {/* Footer Link */}
        <motion.div variants={itemVariants} className="mt-12 text-center">
          <Link
            href="/ventures"
            className="group inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-all hover:gap-3"
            style={{
              borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
              color: LIBRARY_AESTHETICS.colors.primary.parchment,
            }}
          >
            <span>View All Ventures</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}