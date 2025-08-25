// pages/ventures.tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { absUrl, siteConfig } from "@/lib/siteConfig";

const brands = [
  {
    name: "Abraham of London",
    desc: "Strategic stewardship, thought leadership, and the standards that hold the family together.",
    logo: "/assets/images/abraham-logo.jpg",
    href: "/about",
  },
  {
    name: "Alomarada",
    desc: "Business advisory for investors & entrepreneurs developing African markets through ethical, practical playbooks.",
    logo: "/assets/images/alomarada-ltd.webp",
    href: "https://alomarada.com",
  },
  {
    name: "EndureLuxe",
    desc: "Premium, sustainable fitness partnerships that promote wellbeing through community and thoughtful tech.",
    logo: "/assets/images/endureluxe-ltd.webp",
    href: "https://endureluxe.com",
  },
  {
    name: "InnovateHub",
    desc: "Strategy, playbooks, and hands-on product support to ship durable products rooted in ethics and excellent craft.",
    logo: "/assets/images/innovatehub.svg",
    href:
      process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
      process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL ||
      "https://innovatehub-abrahamoflondon.netlify.app",
    badge: "Early access open",
  },
] as const;

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const item = { hidden: { y: 18, opacity: 0 }, visible: { y: 0, opacity: 1 } } as const;

export default function VenturesPage() {
  const CANONICAL = absUrl("/ventures");
  const pageTitle = `Ventures & Brands | ${siteConfig.author}`;
  const pageDesc = "A portfolio at the intersection of strategy, sustainability, and impact.";

  // JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
      { "@type": "ListItem", position: 2, name: "Ventures & Brands", item: CANONICAL },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: brands.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": /^https?:\/\//.test(b.href) ? "Organization" : "WebPage",
        name: b.name,
        url: /^https?:\/\//.test(b.href) ? b.href : absUrl(b.href),
        image: absUrl(b.logo),
        description: b.desc,
      },
    })),
  };

  const ogImageAbs = siteConfig.ogImage?.startsWith("/")
    ? absUrl(siteConfig.ogImage)
    : siteConfig.ogImage;
  const twitterImageAbs = siteConfig.twitterImage?.startsWith("/")
    ? absUrl(siteConfig.twitterImage)
    : siteConfig.twitterImage;

  return (
    <Layout pageTitle="Ventures">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={CANONICAL} />

        {/* Open Graph / X */}
        <meta property="og:site_name" content={siteConfig.title} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        {ogImageAbs ? (
          <>
            <meta property="og:image" content={ogImageAbs} />
            <meta property="og:image:alt" content="Abraham of London — ventures and brands" />
          </>
        ) : null}
        <meta name="twitter:card" content="summary_large_image" />
        {twitterImageAbs ? <meta name="twitter:image" content={twitterImageAbs} /> : null}

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      </Head>

      <section className="px-4 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center md:mb-10">
            <h1 className="font-serif text-3xl font-bold md:text-5xl">Ventures & Brands</h1>
            <p className="mt-3 text-deepCharcoal/80">{pageDesc}</p>
          </header>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={container}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {brands.map((b) => {
              const internal = !/^https?:\/\//.test(b.href);

              const Card = (
                <motion.article
                  variants={item}
                  className="flex flex-col rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/10 transition-shadow hover:shadow-lg"
                  aria-labelledby={`${b.name}-title`}
                >
                  <div className="relative mx-auto mb-5 h-[120px] w-[160px]">
                    <Image
                      src={b.logo}
                      alt={`${b.name} logo`}
                      fill
                      sizes="160px"
                      className="object-contain"
                    />
                  </div>
                  <h2 id={`${b.name}-title`} className="text-center text-xl font-semibold text-gray-900">
                    {b.name}
                  </h2>
                  {b.badge && (
                    <span className="mt-2 self-center rounded-full border border-black/10 bg-cream px-2.5 py-1 text-xs text-deepCharcoal/80">
                      {b.badge}
                    </span>
                  )}
                  <p className="mt-3 text-center text-deepCharcoal/80">{b.desc}</p>
                  <span className="mt-5 inline-flex justify-center">
                    <span className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream">
                      Learn more
                    </span>
                  </span>
                </motion.article>
              );

              return internal ? (
                <Link
                  key={b.name}
                  href={b.href}
                  prefetch={false}
                  className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
                  aria-label={`Open ${b.name}`}
                >
                  {Card}
                </Link>
              ) : (
                <a
                  key={b.name}
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
                  aria-label={`Open ${b.name} (new tab)`}
                >
                  {Card}
                </a>
              );
            })}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}

// Optional ISR (daily) so previews/meta stay fresh.
export async function getStaticProps() {
  return { props: {}, revalidate: 86400 };
}
