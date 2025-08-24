import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import AboutSection, { Achievement } from "@/components/homepage/AboutSection";
import { siteConfig, absUrl } from "@/lib/siteConfig";

export default function AboutPage() {
  const CANONICAL = absUrl("/about");

  const portrait = siteConfig.authorImage; // ✅ already absolute-from-root
  const portraitAbs = `${siteConfig.siteUrl}${portrait}`;

  const bio =
    "Strategy, fatherhood, and craftsmanship—brought together for enduring impact. I help founders and leaders build durable brands and products with clear thinking, principled execution, and a long-term view.";

  const achievements: Achievement[] = [
    {
      title: "Founded Abraham of London",
      description: "A practice for principled strategy, writing, and stewardship.",
      year: 2020,
    },
    {
      title: "Launched Alomarada",
      description: "Advisory for investors & entrepreneurs developing African markets.",
      year: 2018,
    },
  ];

  const sameAs = (siteConfig.socialLinks || [])
    .filter((l) => l.external && /^https?:\/\//i.test(l.href))
    .map((l) => l.href);

  return (
    <Layout pageTitle="About">
      <Head>
        <meta
          name="description"
          content="About Abraham of London — strategy, fatherhood, and craftsmanship."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content="About | Abraham of London" />
        <meta
          property="og:description"
          content="Strategy, fatherhood, and craftsmanship—brought together for enduring impact."
        />
        <meta property="og:url" content={CANONICAL} />
        <meta
          property="og:image"
          content={
            siteConfig.ogImage.startsWith("/")
              ? `${siteConfig.siteUrl}${siteConfig.ogImage}`
              : siteConfig.ogImage
          }
        />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "About",
              url: CANONICAL,
              description:
                "About Abraham of London — strategy, fatherhood, and craftsmanship.",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: siteConfig.author,
              url: siteConfig.siteUrl,
              image: portraitAbs,
              sameAs,
            }),
          }}
        />
      </Head>

      <AboutSection
        id="about"
        bio={bio}
        achievements={achievements}
        portraitSrc={portrait}
        portraitAlt="Abraham of London portrait"
        priority                                // ✅ now supported
      />

      <div className="container mx-auto max-w-6xl px-4 pb-20">
        <Link
          href="/contact"
          className="inline-flex items-center rounded-full bg-forest px-5 py-2 text-cream hover:brightness-95"
        >
          Work with me
        </Link>
      </div>
    </Layout>
  );
}
