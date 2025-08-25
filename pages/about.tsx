import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import AboutSection, { Achievement } from "@/components/homepage/AboutSection";
import { siteConfig, absUrl } from "@/lib/siteConfig";
import { sanitizeSocialLinks } from "@/lib/social";

export default function AboutPage() {
  const CANONICAL = absUrl("/about");

  const portrait = siteConfig.authorImage;              // local path
  const portraitAbs = absUrl(portrait);                 // absolute URL

  const bio =
    "Strategy, fatherhood, and craftsmanship—brought together for enduring impact. I help founders and leaders build durable brands and products with clear thinking, principled execution, and a long-term view.";

  // Prefer an environment-provided URL for InnovateHub; fall back to the site route
  const innovateHubUrl =
    process.env.NEXT_PUBLIC_INNOVATEHUB_URL || "/ventures?brand=innovatehub";

  const achievements: Achievement[] = [
    {
      title: "Launched InnovateHub",
      description: "Innovation studio for prototypes, research, and venture experiments.",
      year: 2025,
      href: innovateHubUrl,
    },
    {
      title: "Launched Endureluxe",
      description: "Premiun fitness equipments and curated community experiences—engineered to last, designed to build.",
      year: 2024,
      href: "/ventures?brand=endureluxe",
    },
    {
      title: "Founded Abraham of London",
      description: "A practice for principled strategy, writing, and stewardship.",
      year: 2020,
      // no href (already on-site)
    },
    {
      title: "Launched Alomarada",
      description: "Advisory for investors & entrepreneurs developing African markets.",
      year: 2018,
      href: "/ventures?brand=alomarada",
    },
  ];

  // Normalize, strip tracking, and keep only http(s) for sameAs
  const sameAsRaw = siteConfig.socialLinks || [];
  const sameAsSanitized = sanitizeSocialLinks(sameAsRaw)
    .map((l) => l.href)
    .filter((href) => /^https?:\/\//i.test(href));
  const sameAs = Array.from(new Set(sameAsSanitized)); // dedupe

  const ogImageAbs = siteConfig.ogImage?.startsWith("/")
    ? absUrl(siteConfig.ogImage)
    : siteConfig.ogImage;

  const twitterImageAbs = siteConfig.twitterImage?.startsWith("/")
    ? absUrl(siteConfig.twitterImage)
    : siteConfig.twitterImage;

  const pageTitle = `About | ${siteConfig.author}`;
  const pageDesc =
    "About Abraham of London — strategy, fatherhood, craftsmanship, and discreet counsel for leaders who prioritise signal over noise.";

  // JSON-LD
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "About",
    url: CANONICAL,
    inLanguage: "en-GB",
    description: pageDesc,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.siteUrl },
        { "@type": "ListItem", position: 2, name: "About", item: CANONICAL },
      ],
    },
  };

  const personSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author,
    url: siteConfig.siteUrl,
    image: portraitAbs,
  };
  if (sameAs.length > 0) personSchema.sameAs = sameAs;

  return (
    <Layout pageTitle="About">
      <Head>
        {/* Title + canonical */}
        <title>{pageTitle}</title>
        <link rel="canonical" href={CANONICAL} />

        {/* Meta */}
        <meta name="description" content={pageDesc} />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:site_name" content={siteConfig.title} />
        {ogImageAbs ? (
          <>
            <meta property="og:image" content={ogImageAbs} />
            <meta property="og:image:alt" content="Abraham of London — official site image" />
          </>
        ) : null}

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        {twitterImageAbs ? <meta name="twitter:image" content={twitterImageAbs} /> : null}

        {/* LCP hint */}
        <link rel="preload" as="image" href={portrait} />

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      </Head>

      <AboutSection
        id="about"
        bio={bio}
        achievements={achievements}
        portraitSrc={portrait}
        portraitAlt="Abraham of London portrait"
        priority
      />

      {/* House standards — soft, discreet signal (no explicit naming) */}
      <section className="container mx-auto max-w-6xl px-4">
        <aside
          className="mt-8 rounded-2xl border border-lightGrey bg-warmWhite p-5 text-sm text-deepCharcoal/80 shadow-card"
          aria-label="House standards"
        >
          <h2 className="mb-2 font-serif text-lg font-semibold text-deepCharcoal">House Standards</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use insights freely; attribution by permission.</li>
            <li>Devices silent. No photos. No recordings.</li>
            <li>Names and affiliations kept private.</li>
          </ul>
          <p className="mt-3 text-xs text-deepCharcoal/60">
            Private rooms available for sensitive work.
          </p>
        </aside>
      </section>

      <div className="container mx-auto max-w-6xl px-4 pb-20">
        <Link
          href="/contact"
          className="mt-8 inline-flex items-center rounded-full bg-forest px-5 py-2 text-cream hover:brightness-95"
          prefetch={false}
        >
          Work with me
        </Link>
      </div>
    </Layout>
  );
}
