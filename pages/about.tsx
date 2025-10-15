// pages/about.tsx
import Link from "next/link";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import AboutSection, { type Achievement } from "@/components/homepage/AboutSection";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import { CTA_PRESETS } from "@/components/mdx/ctas";
import { siteConfig, absUrl } from "@/lib/siteConfig";
import { sanitizeSocialLinks } from "@/lib/social";

/** Simple card for featured links */
function FeatureCard({
  href,
  title,
  sub,
}: {
  href: string;
  title: string;
  sub?: string;
}) {
  return (
    <li className="group rounded-xl border border-lightGrey bg-warmWhite p-4 shadow-card transition hover:shadow-cardHover">
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        prefetch={false}
        aria-label={sub ? `${title} — ${sub}` : title}
      >
        <h3 className="font-serif text-xl text-forest group-hover:underline underline-offset-4">
          {title}
        </h3>
        {sub && <p className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.8]">{sub}</p>}
        <span className="mt-3 inline-block text-sm text-[color:var(--color-primary)/0.8] group-hover:text-forest">
          Read →
        </span>
      </Link>
    </li>
  );
}

export default function AboutPage() {
  const CANONICAL = absUrl("/about");

  const portrait = siteConfig.authorImage;
  const portraitAbs = absUrl(portrait?.startsWith("/") ? portrait : siteConfig.authorImage);

  const bio =
    "Strategy, fatherhood, and craftsmanship—brought together for enduring impact. I help fathers, young founders, and enterprise leaders build durable brands and products with clear thinking, principled execution, and a long view.";

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
      description:
        "Premium fitness equipment and curated community—engineered to last, designed to build.",
      year: 2024,
      href: "/ventures?brand=endureluxe",
    },
    {
      title: "Founded Abraham of London",
      description: "A practice for principled strategy, writing, and stewardship.",
      year: 2020,
    },
    {
      title: "Launched Alomarada",
      description: "Advisory for investors & entrepreneurs developing African markets.",
      year: 2018,
      href: "/ventures?brand=alomarada",
    },
  ];

  // Social sameAs (JSON-LD)
  const sameAs = Array.from(
    new Set(
      (sanitizeSocialLinks(siteConfig.socialLinks || []) || [])
        .map((l) => l.href)
        .filter((href) => /^https?:\/\//i.test(href))
    )
  );

  const ogImageAbs = siteConfig.ogImage?.startsWith("/")
    ? absUrl(siteConfig.ogImage)
    : siteConfig.ogImage;

  const twitterImageAbs = siteConfig.twitterImage?.startsWith("/")
    ? absUrl(siteConfig.twitterImage)
    : siteConfig.twitterImage;

  const pageTitle = "About";
  const pageDesc =
    "About Abraham of London — quiet counsel and durable execution for fathers, young founders, and enterprise teams.";

  // JSON-LD (web page + person)
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
    ...(sameAs.length ? { sameAs } : {}),
  };

  // Pull leadership CTA preset
  const leadershipCTA = CTA_PRESETS.leadership;

  return (
    <Layout pageTitle={pageTitle}>
      <SEOHead
        title={pageTitle}
        type="website"
        description={pageDesc}
        slug="/about"
        coverImage={ogImageAbs || undefined}
      >
        {/* Twitter / X override */}
        {twitterImageAbs ? <meta name="twitter:image" content={twitterImageAbs} /> : null}
        {/* LCP hint for local portrait */}
        {portrait?.startsWith("/") ? <link rel="preload" as="image" href={portrait} /> : null}
        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      </SEOHead>

      {/* Hero/About */}
      <AboutSection
        id="about"
        bio={bio}
        achievements={achievements}
        portraitSrc={portrait}
        portraitAlt="Abraham of London portrait"
        priority
      />

      {/* Featured Writing – feels like the blog CTAs */}
      <section aria-labelledby="featured-writing" className="container mx-auto max-w-6xl px-4 py-10 md:py-12">
        <h2 id="featured-writing" className="mb-4 font-serif text-2xl sm:text-3xl font-semibold text-deepCharcoal">
          Featured Writing
        </h2>
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            href="/blog/leadership-begins-at-home"
            title="Leadership Begins at Home"
            sub="Govern self, then household."
          />
          <FeatureCard
            href="/blog/reclaiming-the-narrative"
            title="Reclaiming the Narrative"
            sub="Court-season clarity under pressure."
          />
          <FeatureCard
            href="/blog/the-brotherhood-code"
            title="The Brotherhood Code"
            sub="Covenant of presence, not performance."
          />
        </ul>
      </section>

      {/* Quick Downloads */}
      <section aria-labelledby="quick-downloads" className="container mx-auto max-w-6xl px-4 py-8">
        <h2 id="quick-downloads" className="mb-3 font-serif text-2xl font-semibold text-deepCharcoal">
          Quick Downloads
        </h2>
        <ul className="flex flex-wrap gap-3 text-sm">
          <li>
            <Link href="/downloads/Leadership_Playbook.pdf" className="aol-btn rounded-full px-4 py-2" prefetch={false}>
              Leadership Playbook (30•60•90)
            </Link>
          </li>
          <li>
            <Link href="/downloads/Mentorship_Starter_Kit.pdf" className="aol-btn rounded-full px-4 py-2" prefetch={false}>
              Mentorship Starter Kit
            </Link>
          </li>
          <li>
            <Link
              href="/downloads/Entrepreneur_Operating_Pack.pdf"
              className="aol-btn rounded-full px-4 py-2"
              prefetch={false}
            >
              Entrepreneur Operating Pack
            </Link>
          </li>
        </ul>
      </section>

      {/* Letter of Practice */}
      <section aria-labelledby="letter-heading" className="container mx-auto max-w-6xl px-4 py-10">
        <h2 id="letter-heading" className="mb-4 font-serif text-2xl sm:text-3xl font-semibold text-deepCharcoal">
          Our Letter of Practice
        </h2>

        <div className="prose md:prose-lg max-w-none text-[color:var(--color-on-secondary)/0.9] dark:prose-invert">
          <p>
            I work quietly; deliver visibly. My concern is usefulness over noise—the kind of work that stands without
            explanation. Counsel is discreet, cadence disciplined, outcomes durable.
          </p>

          <p className="font-medium">For fathers:</p>
          <ul>
            <li>Build the house first—schedule, Scripture, and standards.</li>
            <li>Choose presence over performance; private order before public output.</li>
            <li>Lead with truth and kindness; own errors without ceremony.</li>
          </ul>

          <p className="font-medium">For young founders:</p>
          <ul>
            <li>Ship less, better. Protect constraints; they preserve quality.</li>
            <li>Measure twice. Cut once. Record progress; do not perform it.</li>
            <li>Cash discipline over clout; stewardship over spectacle.</li>
          </ul>

          <p className="font-medium">For enterprise leaders:</p>
          <ul>
            <li>Clarify mandate, remove friction, guard the standard.</li>
            <li>Keep counsel private; let public work speak.</li>
            <li>Scale only what proves worthy; heritage over headlines.</li>
          </ul>

          <p>If our standards align, we can begin.</p>
        </div>
      </section>

      {/* Contextual CTA like the blogs */}
      <section className="container mx-auto max-w-3xl px-4">
        <ResourcesCTA
          title={leadershipCTA.title}
          reads={leadershipCTA.reads}
          downloads={leadershipCTA.downloads}
          className="mb-10"
        />
      </section>

      {/* House standards */}
      <section className="container mx-auto max-w-6xl px-4">
        <aside
          className="mt-4 rounded-2xl border border-lightGrey bg-warmWhite p-5 text-sm text-[color:var(--color-on-secondary)/0.8] shadow-card"
          aria-label="House standards"
        >
          <h2 className="mb-2 font-serif text-lg font-semibold text-deepCharcoal">House Standards</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use insights freely; attribution by permission.</li>
            <li>Devices silent. No photos. No recordings.</li>
            <li>Names and affiliations kept private.</li>
          </ul>
          <p className="mt-3 text-xs text-[color:var(--color-on-secondary)/0.6]">Private rooms available for sensitive work.</p>
        </aside>
      </section>

      {/* CTA */}
      <div className="container mx-auto max-w-6xl px-4 pb-20">
        <Link
          href="/contact"
          className="mt-8 inline-flex items-center rounded-full bg-forest px-5 py-2 text-cream hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-opacity-40"
          prefetch={false}
        >
          Work with me
        </Link>
      </div>
    </Layout>
  );
}
