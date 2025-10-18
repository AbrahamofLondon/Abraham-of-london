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

// Prefer env overrides; fall back to stable public URLs
const INNOVATE_HUB_BASE = pickUrl(
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL,
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL,
  "https://innovatehub-abrahamoflondon.netlify.app"
);
const INNOVATE_HUB_EARLY_ACCESS = new URL("/forms/early-access.html", INNOVATE_HUB_BASE).toString();

const ALOMARADA_URL = pickUrl(process.env.NEXT_PUBLIC_ALOMARADA_URL, "https://alomarada.com");
const ENDURELUXE_URL = pickUrl(process.env.NEXT_PUBLIC_ENDURELUXE_URL, "https://endureluxe.com");

export const defaultBrands: Brand[] = [
  {
    name: "Alomarada",
    description:
      "Business advisory guiding investors and mentoring African-diaspora entrepreneurs to develop African markets through ethical exploration of market gaps.",
    logo: "/assets/images/alomarada-ltd.webp",
    url: ALOMARADA_URL,
    metric: "Investor & founder mentorship",
  },
  {
    name: "EndureLuxe",
    description:
      "Premium, sustainable fitness partnerships that promote wellbeing—powered by community and thoughtful technology.",
    logo: "/assets/images/endureluxe-ltd.webp",
    url: ENDURELUXE_URL,
    metric: "Performance & wellbeing",
  },
  {
    name: "InnovateHub",
    description:
      "Strategy, playbooks, and hands-on product support to ship durable products—rooted in ethics, clarity, and excellent craft.",
    logo: "/assets/images/innovatehub.svg",
    url: INNOVATE_HUB_BASE,
    secondaryHref: INNOVATE_HUB_EARLY_ACCESS,
    secondaryText: "Early Access",
    metric: "Early access open",
  },
];

type VenturesProps = { brandsData?: Brand[] };

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const item = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
} as const;

function ExternalAwareLink(props: React.ComponentProps<typeof Link> & { href: string }) {
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
  const primaryCta = (
    <span className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-forest hover:text-[color:var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]">
      Learn more
      <svg className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12.97 4.28a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H4a.75.75 0 010-1.5h12.22l-3.22-3.22a.75.75 0 010-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );

  return (
    <motion.article
      variants={item}
      className="group flex flex-col rounded-2xl border border-lightGrey bg-white p-6 text-center shadow-card transition hover:shadow-cardHover"
      whileHover={reduce ? undefined : { scale: 1.01 }}
    >
      <div className="relative mx-auto mb-5 h-[140px] w-[140px]">
        <Image
          src={brand.logo || "/assets/images/default-brand.svg"}
          alt={`${brand.name} logo`}
          fill
          sizes="140px"
          className="object-contain"
          loading="lazy"
        />
      </div>

      <h3 className="mb-1 font-serif text-2xl font-semibold text-deepCharcoal">{brand.name}</h3>
      <p className="mb-3 flex-1 text-[color:var(--color-on-secondary)/0.8]">{brand.description}</p>

      {brand.metric && (
        <p className="mx-auto mb-4 inline-flex items-center justify-center rounded-full border border-lightGrey bg-warmWhite px-3 py-1 text-xs text-[color:var(--color-on-secondary)/0.8]">
          {brand.metric}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <ExternalAwareLink href={brand.url} className="group">
          {primaryCta}
        </ExternalAwareLink>

        {brand.secondaryHref && brand.secondaryText && (
          <ExternalAwareLink
            href={brand.secondaryHref}
            className="inline-flex items-center justify-center rounded-full bg-forest px-3 py-1.5 text-sm font-semibold text-cream transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
          >
            {brand.secondaryText}
          </ExternalAwareLink>
        )}
      </div>
    </motion.article>
  );
}

export default function VenturesSection({ brandsData = defaultBrands }: VenturesProps) {
  const reduce = useReducedMotion();

  return (
    <section
      id="ventures"
      className="bg-gradient-to-br from-gray-50 to-white px-4 py-16"
      aria-labelledby="ventures-title"
    >
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="rounded-3xl bg-white p-8 text-deepCharcoal shadow-2xl ring-1 ring-black/5 md:p-12"
        >
          <motion.header variants={item} className="mb-10">
            <h2 id="ventures-title" className="font-serif text-3xl font-bold text-gray-900 md:text-5xl">
              Ventures & Brands
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-[color:var(--color-on-secondary)/0.8] md:text-xl">
              A portfolio at the intersection of strategy, sustainability, and impact.
            </p>
          </motion.header>

          <motion.div
            variants={item}
            className="mb-12 flex flex-col items-center gap-6 rounded-2xl border border-lightGrey bg-white p-6 shadow-xl md:flex-row md:gap-10 md:p-8"
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
              <h3 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">Abraham of London</h3>
              <p className="text-[color:var(--color-on-secondary)/0.8]">
                Strategic stewardship, thought leadership, and the standards that hold the family together.
              </p>
              <div className="mt-4">
                <Link
                  href="/about"
                  prefetch={false}
                  className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:brightness-95"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div variants={container} className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {brandsData.map((b) => (
              <BrandCard key={b.name} brand={b} />
            ))}
          </motion.div>

          <motion.div variants={item} className="mt-12 text-center">
            <Link
              href="/ventures"
              prefetch={false}
              className="inline-flex items-center rounded-full bg-forest px-6 py-3 font-medium text-cream shadow-lg transition-colors hover:brightness-95"
            >
              View All Ventures
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
