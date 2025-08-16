import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

type Brand = {
  name: string;
  description: string;
  logo: string;   // path under /public
  url: string;    // external site
  metric?: string;
};

const INNOVATE_HUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  "https://innovatehub.abrahamoflondon.org";

const defaultBrands: Brand[] = [
  {
    name: "Alomarada",
    description:
      "Redefining development through ethical market exploration and human capital growth.",
    logo: "/assets/images/alomarada-ltd.webp",
    url: "https://alomarada.com",
    metric: "10K+ Jobs Created",
  },
  {
    name: "Endureluxe",
    description:
      "High-performance luxury fitness equipment and interactive community.",
    logo: "/assets/images/endureluxe-ltd.webp",
    url: "https://endureluxe.com",
    metric: "5M+ Users",
  },
  {
    name: "InnovateHub",
    description:
      "A platform for tech startups to scale with sustainable solutions.",
    logo: "/assets/images/innovatehub.svg",
    url: INNOVATE_HUB_URL, // uses env var, falls back to subdomain
    metric: "20+ Startups Supported",
  },
];

type VenturesProps = {
  brandsData?: Brand[];
};

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { y: 18, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <motion.article
      variants={item}
      className="bg-white rounded-2xl shadow-md ring-1 ring-black/10 p-6 flex flex-col text-center hover:shadow-lg transition-shadow"
    >
      <div className="relative w-[140px] h-[140px] mx-auto mb-5">
        <Image
          src={brand.logo}
          alt={`${brand.name} logo`}
          fill
          sizes="(max-width: 768px) 140px, 140px"
          className="object-contain"
          loading="lazy"
        />
      </div>

      <h3 className="text-2xl font-semibold mb-1">{brand.name}</h3>

      <p className="text-deepCharcoal/80 mb-3 flex-1">{brand.description}</p>

      {brand.metric && (
        <p
          className="inline-flex items-center justify-center mx-auto mb-4 rounded-full bg-cream text-deepCharcoal/80 border border-black/10 px-3 py-1 text-xs"
          aria-label={`Key impact metric for ${brand.name}: ${brand.metric}`}
        >
          {brand.metric}
        </p>
      )}

      <Link
        href={brand.url}
        target="_blank"
        rel="noopener noreferrer"
        prefetch={false}
        className="inline-flex items-center justify-center text-forest font-medium hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-full"
        aria-label={`Visit ${brand.name} website (opens in a new tab)`}
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
    </motion.article>
  );
}

export default function VenturesSection({ brandsData = defaultBrands }: VenturesProps) {
  return (
    <section id="ventures" className="py-16 px-4" aria-labelledby="ventures-title">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="bg-white text-deepCharcoal rounded-3xl shadow-2xl ring-1 ring-black/5 p-8 md:p-12"
        >
          <motion.header variants={item} className="mb-10">
            <h2 id="ventures-title" className="text-3xl md:text-5xl font-serif font-bold mb-4">
              Ventures & Brands
            </h2>
            <p className="text-lg md:text-xl text-deepCharcoal/80 max-w-2xl">
              A portfolio at the intersection of innovation, sustainability, and impact.
            </p>
          </motion.header>

          {/* Parent brand */}
          <motion.div
            variants={item}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-xl ring-1 ring-black/10 mb-12 flex flex-col md:flex-row items-center gap-6 md:gap-10"
          >
            <div className="relative w-[220px] h-[110px] flex-shrink-0">
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
              <h3 className="text-3xl md:text-4xl font-bold mb-2">Abraham of London</h3>
              <p className="text-deepCharcoal/80">
                The cornerstone of my mission—driving thought leadership, strategic advisory,
                and creative ventures globally.
              </p>
              <div className="mt-4">
                <Link
                  href="/about"
                  className="inline-flex items-center px-4 py-2 rounded-full bg-forest text-cream text-sm font-medium hover:bg-forest/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
                  aria-label="Learn more about Abraham of London"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Brands grid */}
          <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {brandsData.map((brand) => (
              <BrandCard key={brand.name} brand={brand} />
            ))}
          </motion.div>

          <motion.div variants={item} className="mt-12 text-center">
            <Link
              href="/ventures"
              className="inline-flex items-center px-6 py-3 bg-forest text-cream rounded-full font-medium hover:bg-forest/90 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest/30"
              aria-label="View all ventures"
            >
              View All Ventures
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
