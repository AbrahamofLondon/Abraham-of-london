"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

type Brand = {
  name: string;
  description: string;
  logo: string;          // prefer a /public path; absolute URLs also supported
  url: string;           // internal path or absolute URL
  metric?: string;
  secondaryHref?: string; // optional second CTA (e.g., Early Access)
  secondaryText?: string; // button text for secondaryHref
};

type VenturesProps = {
  brandsData?: Brand[];
  id?: string;
  className?: string;
};

/* -------------------------- URL helpers (robust) -------------------------- */

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  ""; // may be empty locally

const isExternal = (u?: string) => !!u && /^https?:\/\//i.test(u);

const pickUrl = (...candidates: Array<string | undefined | null>) =>
  candidates.find((u) => typeof u === "string" && u.trim().length) || "#";

const joinUrl = (base?: string, path?: string) => {
  try {
    if (!base || !path) return undefined;
    return new URL(path, base).toString();
  } catch {
    return undefined;
  }
};

const toAbsolute = (pathOrUrl?: string) => {
  if (!pathOrUrl) return undefined;
  if (isExternal(pathOrUrl)) return pathOrUrl;
  if (!SITE) return undefined; // can’t make absolute without a base
  const base = SITE.endsWith("/") ? SITE.slice(0, -1) : SITE;
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${p}`;
};

/* -------------------------- Brand defaults (env-first) -------------------- */

const INNOVATE_HUB_BASE = pickUrl(
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL,
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL,
  "https://innovatehub-abrahamoflondon.netlify.app"
);
const INNOVATE_HUB_EARLY_ACCESS =
  joinUrl(INNOVATE_HUB_BASE, "/forms/early-access.html") || INNOVATE_HUB_BASE;

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

/* -------------------------- Motion presets -------------------------------- */

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const item = {
  hidden: { y: 18, opacity: 0 },
  visible: { y: 0, opacity: 1 },
} as const;

/* -------------------------- Brand card ------------------------------------ */

function BrandCard({ brand }: { brand: Brand }) {
  const reduceMotion = useReducedMotion();
  const internal = !isExternal(brand.url);
  const secondaryInternal = brand.secondaryHref && !isExternal(brand.secondaryHref);

  const logoSrc = brand.logo || "/assets/images/default-brand.svg";

  return (
    <motion.article
      variants={item}
      className={clsx(
        "bg-white rounded-2xl shadow-md ring-1 ring-black/10 p-6 flex flex-col text-center transition-shadow duration-300",
        "hover:shadow-lg"
      )}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
    >
      <div className="relative w-[140px] h-[140px] mx-auto mb-5">
        <Image
          src={logoSrc}
          alt={`${brand.name} logo`}
          fill
          sizes="140px"
          className="object-contain"
          loading="lazy"
        />
      </div>

      <h3 className="text-2xl font-semibold mb-1 text-gray-900">{brand.name}</h3>
      <p className="text-deepCharcoal/80 mb-3 flex-1">{brand.description}</p>

      {brand.metric && (
        <p className="inline-flex items-center justify-center mx-auto mb-4 rounded-full bg-cream text-deepCharcoal/80 border border-black/10 px-3 py-1 text-xs">
          {brand.metric}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Link
          href={brand.url || "#"}
          prefetch={false}
          {...(internal
            ? {}
            : { target: "_blank", rel: "noopener noreferrer" })}
          className="inline-flex items-center justify-center text-forest font-medium hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-full px-4 py-2"
          aria-label={`Learn more about ${brand.name}`}
        >
          Learn More
          <svg className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12.97 4.28a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H4a.75.75 0 010-1.5h12.22l-3.22-3.22a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </Link>

        {brand.secondaryHref && brand.secondaryText && (
          <Link
            href={brand.secondaryHref}
            prefetch={false}
            {...(secondaryInternal
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            className="inline-flex items-center justify-center rounded-full bg-forest text-cream px-3 py-1.5 text-sm font-semibold hover:bg-forest/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
            aria-label={`${brand.secondaryText} — ${brand.name}`}
          >
            {brand.secondaryText}
          </Link>
        )}
      </div>
    </motion.article>
  );
}

/* -------------------------- Section --------------------------------------- */

export default function VenturesSection({
  brandsData = defaultBrands,
  id = "ventures",
  className,
}: VenturesProps) {
  const reduceMotion = useReducedMotion();
  const brands = brandsData.length ? brandsData : defaultBrands;

  // JSON-LD: ItemList of Organizations (absolute URLs when possible)
  const ldJson = React.useMemo(() => {
    const itemListElement = brands.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Organization",
        name: b.name,
        url: isExternal(b.url) ? b.url : toAbsolute(b.url),
        logo: isExternal(b.logo) ? b.logo : toAbsolute(b.logo),
        description: b.description,
      },
    }));
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement,
    };
  }, [brands]);

  return (
    <section
      id={id}
      className={clsx(
        "py-16 px-4 bg-gradient-to-br from-gray-50 to-white",
        className
      )}
      aria-labelledby={`${id}-title`}
    >
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="bg-white text-deepCharcoal rounded-3xl shadow-2xl ring-1 ring-black/5 p-8 md:p-12"
        >
          <motion.header
            variants={item}
            initial={reduceMotion ? undefined : "hidden"}
            whileInView={reduceMotion ? undefined : "visible"}
            viewport={{ once: true, amount: 0.2 }}
            className="mb-10"
          >
            <h2
              id={`${id}-title`}
              className="text-3xl md:text-5xl font-serif font-bold mb-4 text-gray-900"
            >
              Ventures &amp; Brands
            </h2>
            <p className="text-lg md:text-xl text-deepCharcoal/80 max-w-2xl">
              A portfolio at the intersection of strategy, sustainability, and impact.
            </p>
          </motion.header>

          {/* House brand banner */}
          <motion.div
            variants={item}
            initial={reduceMotion ? undefined : "hidden"}
            whileInView={reduceMotion ? undefined : "visible"}
            viewport={{ once: true, amount: 0.2 }}
            className="bg-white p-6 md:p-8 rounded
