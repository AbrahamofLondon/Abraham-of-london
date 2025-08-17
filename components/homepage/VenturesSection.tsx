import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

type Brand = {
  name: string;
  description: string;
  logo: string;
  url: string;
  metric?: string;
  secondaryHref?: string;
  secondaryText?: string;
};

const pickUrl = (...candidates: (string | undefined)[]) =>
  candidates.find((u) => typeof u === "string" && u.trim().length) || "#";

/* ---------- Correct InnovateHub hosts (env-first) ---------- */
const INNOVATE_HUB_BASE = pickUrl(
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL,               // e.g. https://innovatehub.abrahamoflondon.org
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL,           // e.g. https://innovatehub-abrahamoflondon.netlify.app
  "https://innovatehub-abrahamoflondon.netlify.app"      // ← good fallback you actually own
);
const INNOVATE_HUB_EARLY_ACCESS = new URL(
  "/forms/early-access.html",
  INNOVATE_HUB_BASE
).toString();

/* ---------- Other brands ---------- */
const ALOMARADA_URL = pickUrl(
  process.env.NEXT_PUBLIC_ALOMARADA_URL,
  "https://alomarada.com"
);
const ENDURELUXE_URL = pickUrl(
  process.env.NEXT_PUBLIC_ENDURELUXE_URL,
  "https://endureluxe.com"
);

const defaultBrands: Brand[] = [
  {
    name: "Alomarada",
    description:
      "Business advisory guiding investors and mentoring African-diaspora entrepreneurs to develop African markets through ethical exploration of market gaps—with a practical commitment to unlocking the continent’s staggering human capital.",
    logo: "/assets/images/alomarada-ltd.webp",
    url: ALOMARADA_URL,
    metric: "Investor & founder mentorship",
  },
  {
    name: "Endureluxe",
    description:
      "Premium, sustainable fitness partnerships that promote wellbeing—powered by community and thoughtful technology, with writing that advances state-of-the-art knowledge and practical life wisdom.",
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
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;
const item = { hidden: { y: 18, opacity: 0 }, visible: { y: 0, opacity: 1 } } as const;

function BrandCard({ brand }: { brand: Brand }) {
  const isInternal = !/^https?:\/\//.test(brand.url);
  const isSecondaryInternal = brand.secondaryHref && !/^https?:\/\//.test(brand.secondaryHref);

  return (
    <motion.article
      variants={item}
      className="bg-white rounded-2xl shadow-md ring-1 ring-black/10 p-6 flex flex-col text-center hover:shadow-lg transition-shadow duration-300"
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative w-[140px] h-[140px] mx-auto mb-5">
        <Image
          src={brand.logo || "/assets/images/default-brand.svg"}
          alt={`${brand.name} logo`}
          fill
          sizes="(max-width: 768px) 140px, 140px"
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
<<<<<<< HEAD
        <Link
          href={brand.url}
          target="_blank"
          rel="noopener noreferrer"
          prefetch={false}
          className="inline-flex items-center justify-center text-forest font-medium hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-full"
          aria-label={`Visit ${brand.name} website (opens in a new tab)`}
        >
          Learn More
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.97 4.28a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H4a.75.75 0 010-1.5h12.22l-3.22-3.22a.75.75 0 010-1.06z" clipRule="evenodd"/></svg>
        </Link>

        {brand.secondaryHref && brand.secondaryText && (
=======
        {isInternal ? (
>>>>>>> 82c8062c9546313736490d73e0627b1d042539b7
          <Link
            href={brand.url}
            prefetch={false}
            className="inline-flex items-center justify-center text-forest font-medium hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-full px-4 py-2"
            aria-label={`Learn more about ${brand.name}`}
          >
            Learn More
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12.97 4.28a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H4a.75.75 0 010-1.5h12.22l-3.22-3.22a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        ) : (
          <Link
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
<<<<<<< HEAD
            className="inline-flex items-center justify-center rounded-full bg-forest text-cream px-3 py-1.5 text-sm font-semibold hover:bg-forest/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
=======
            className="inline-flex items-center justify-center text-forest font-medium hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-full px-4 py-2"
            aria-label={`Visit ${brand.name} website (opens in a new tab)`}
>>>>>>> 82c8062c9546313736490d73e0627b1d042539b7
          >
            Learn More
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12.97 4.28a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H4a.75.75 0 010-1.5h12.22l-3.22-3.22a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        )}

        {brand.secondaryHref && brand.secondaryText && (
          <>
            {isSecondaryInternal ? (
              <Link
                href={brand.secondaryHref}
                prefetch={false}
                className="inline-flex items-center justify-center rounded-full bg-forest text-cream px-3 py-1.5 text-sm font-semibold hover:bg-forest/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
                aria-label={`${brand.secondaryText} for ${brand.name}`}
              >
                {brand.secondaryText}
              </Link>
            ) : (
              <Link
                href={brand.secondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-full bg-forest text-cream px-3 py-1.5 text-sm font-semibold hover:bg-forest/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
                aria-label={`${brand.secondaryText} for ${brand.name} (opens in a new tab)`}
              >
                {brand.secondaryText}
              </Link>
            )}
          </>
        )}
      </div>
    </motion.article>
  );
}

export default function VenturesSection({ brandsData = defaultBrands }: VenturesProps) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://abraham-of-london.netlify.app";

  return (
    <section id="ventures" className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white" aria-labelledby="ventures-title">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="bg-white text-deepCharcoal rounded-3xl shadow-2xl ring-1 ring-black/5 p-8 md:p-12"
        >
          <motion.header variants={item} className="mb-10">
            <h2 id="ventures-title" className="text-3xl md:text-5xl font-serif font-bold mb-4 text-gray-900">
              Ventures & Brands
            </h2>
            <p className="text-lg md:text-xl text-deepCharcoal/80 max-w-2xl">
              A portfolio at the intersection of strategy, sustainability, and impact.
            </p>
          </motion.header>

          <motion.div
            variants={item}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-xl ring-1 ring-black/10 mb-12 flex flex-col md:flex-row items-center gap-6 md:gap-10"
            whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
          >
            <div className="relative w-[220px] h-[110px] flex-shrink-0">
              <Image
                src="/assets/images/logo/abraham-of-london-logo.svg"
                alt="Abraham of London brand logo"
                fill
                sizes="220px"
                className="object-contain transition-transform duration-300 hover:scale-105"
                priority
              />
            </div>

            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">Abraham of London</h3>
              <p className="text-deepCharcoal/80">
                Strategic stewardship, thought leadership, and the standards that hold the family together.
              </p>
              <div className="mt-4">
                <Link
                  href="/about"
                  className="inline-flex items-center px-4 py-2 rounded-full bg-forest text-cream text-sm font-medium hover:bg-forest/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {brandsData.map((brand) => (
              <BrandCard key={brand.name} brand={brand} />
            ))}
          </motion.div>

          <motion.div variants={item} className="mt-12 text-center">
            <Link
              href="/ventures"
              className="inline-flex items-center px-6 py-3 bg-forest text-cream rounded-full font-medium hover:bg-forest/90 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest/30"
            >
              View All Ventures
            </Link>
            <p className="mt-2 text-sm text-deepCharcoal/60">
              <Link href="/" className="underline hover:text-forest transition-colors">
                Back to Homepage
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
