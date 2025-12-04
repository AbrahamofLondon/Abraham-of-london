// components/homepage/VenturesSection.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export type Brand = {
  name: string;
  description: string;
  logo: string;
  url: string;
  metric?: string;
  secondaryHref?: string;
  secondaryText?: string;
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
  },
  {
    name: "EndureLuxe",
    description:
      "Premium, sustainable fitness partnerships that promote wellbeing—powered by community and thoughtful technology.",
    logo: "/assets/images/endureluxe-ltd.webp",
    url: ENDURELUXE_URL,
    metric: "Performance & wellbeing ecosystems",
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
  },
];

type VenturesProps = { brandsData?: Brand[] };

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const item = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: "easeOut" },
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

function BrandCard({ brand }: { brand: Brand }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      variants={item}
      className="group flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-cream shadow-xl backdrop-blur transition-all hover:-translate-y-1 hover:border-gold/60 hover:bg-slate-950/90"
      whileHover={reduce ? undefined : { scale: 1.01 }}
    >
      <div className="relative mx-auto mb-5 h-[130px] w-[160px]">
        <Image
          src={brand.logo || "/assets/images/default-brand.svg"}
          alt={`${brand.name} logo`}
          fill
          sizes="160px"
          className="object-contain"
          loading="lazy"
        />
      </div>

      <h3 className="mb-1 font-serif text-2xl font-semibold text-cream">
        {brand.name}
      </h3>

      <p className="mb-3 flex-1 text-sm text-gold/80">
        {brand.description}
      </p>

      {brand.metric && (
        <p className="mx-auto mb-4 inline-flex items-center justify-center rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold/90">
          {brand.metric}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <ExternalAwareLink
          href={brand.url}
          className="inline-flex items-center rounded-full bg-gold px-4 py-2 text-sm font-semibold text-black shadow-lg transition hover:bg-amber-200"
        >
          Learn more
          <span className="ml-1">↗</span>
        </ExternalAwareLink>

        {brand.secondaryHref && brand.secondaryText && (
          <ExternalAwareLink
            href={brand.secondaryHref}
            className="inline-flex items-center rounded-full border border-gold/60 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/10"
          >
            {brand.secondaryText}
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
      className="relative border-t border-b border-white/10 bg-gradient-to-b from-black via-slate-950 to-black py-16"
      aria-labelledby="ventures-title"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-gold/15 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={container}
          className="rounded-3xl border border-white/15 bg-slate-950/80 p-8 text-cream shadow-2xl backdrop-blur md:p-12"
        >
          <motion.header variants={item} className="mb-10 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
              Ventures
            </p>
            <h2
              id="ventures-title"
              className="mt-3 font-serif text-3xl font-light text-cream md:text-4xl"
            >
              The operating arms of the work.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-gold/80">
              Advisory, brands, and founder infrastructure that carry the
              philosophy into markets — from boards and policy tables to
              products and wellbeing.
            </p>
          </motion.header>

          {/* Abraham of London meta-card */}
          <motion.div
            variants={item}
            className="mb-12 flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-black/70 p-6 shadow-xl md:flex-row md:gap-10 md:p-8"
            {...(reduce ? {} : { whileHover: { translateY: -2 } })}
          >
            <div className="relative h-[110px] w-[220px] flex-shrink-0">
              <Image
                src="/assets/images/logo/abraham-of-london-logo.svg"
                alt="Abraham of London brand logo"
                fill
                sizes="220px"
                className="object-contain"
                priority
              />
            </div>
            <div className="text-center md:text-left">
              <h3 className="mb-2 text-3xl font-bold text-cream md:text-4xl">
                Abraham of London
              </h3>
              <p className="text-sm text-gold/80">
                The holding narrative — Canon, standards, and stewardship that
                tether all ventures back to purpose, responsibility, and legacy.
              </p>
              <div className="mt-4">
                <Link
                  href="/about"
                  prefetch={false}
                  className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-sm font-medium text-cream shadow-lg transition hover:brightness-95"
                >
                  About the work
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Brands grid */}
          <motion.div
            variants={container}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            {brandsData.map((b) => (
              <BrandCard key={b.name} brand={b} />
            ))}
          </motion.div>

          <motion.div variants={item} className="mt-12 text-center">
            <Link
              href="/ventures"
              prefetch={false}
              className="inline-flex items-center rounded-full border border-gold/70 bg-gold/10 px-6 py-3 text-sm font-medium text-gold hover:bg-gold/20"
            >
              View all ventures
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}