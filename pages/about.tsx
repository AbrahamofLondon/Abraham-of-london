// ./pages/about.tsx

import Link from "next/link";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import AboutSection, { type Achievement } from "@/components/homepage/AboutSection";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import { siteConfig, absUrl } from "@/lib/siteConfig";
import { sanitizeSocialLinks } from "@/lib/social";
import clsx from "clsx"; // Added clsx for cleaner class strings

// --- Component: FeatureCard (Refined Styling) ---
/** Simple card for featured links, refined for the new grid layout */
function FeatureCard({
  href,
  title,
  sub,
  icon = "📚", // Added an optional icon prop
}: {
  href: string;
  title: string;
  sub?: string;
  icon?: string;
}) {
  return (
    <li className="list-none"> {/* Removes default list styling */}
      <Link
        href={href}
        className="block rounded-xl border border-lightGrey bg-white p-4 shadow-sm transition hover:shadow-md hover:border-[color:var(--color-primary)/0.3] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        prefetch={false}
        aria-label={sub ? `${title} — ${sub}` : title}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-serif text-lg font-semibold text-deepCharcoal group-hover:text-forest">
            <span className="mr-2 text-xl">{icon}</span>
            {title}
          </h3>
          <span className="shrink-0 ml-4 mt-1 text-sm font-medium text-[color:var(--color-primary)/0.7] group-hover:text-forest">
            View →
          </span>
        </div>
        {sub && (
          <p className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.8]">{sub}</p>
        )}
      </Link>
    </li>
  );
}

// --- Main Page Component ---

export default function AboutPage() {
  const CANONICAL = absUrl("/about");

  const portrait = siteConfig.authorImage;
  const portraitAbs = absUrl(
    portrait?.startsWith("/") ? portrait : siteConfig.authorImage
  );

  const bio =
    "Strategy, fatherhood, and craftsmanship—brought together for enduring impact. I help fathers, young founders, and enterprise leaders build durable brands and products with clear thinking, principled execution, and a long view.";

  const innovateHubUrl =
    process.env.NEXT_PUBLIC_INNOVATEHUB_URL || "/ventures?brand=innovatehub";

  const achievements: Achievement[] = [
    {
      title: "Launched InnovateHub",
      description:
        "Innovation studio for prototypes, research, and venture experiments.",
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
      description:
        "A practice for principled strategy, writing, and stewardship.",
      year: 2020,
    },
    {
      title: "Launched Alomarada",
      description:
        "Advisory for investors & entrepreneurs developing African markets.",
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

  const pageTitle = "About Abraham of London"; // ✅ UPGRADE: Richer page title
  const pageDesc =
    "Quiet counsel and durable execution for fathers, young founders, and enterprise teams. Explore the practice's principles and history."; // ✅ UPGRADE: Richer page description

  // JSON-LD (web page + person)
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
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

  return (
    <Layout pageTitle={pageTitle}>
      <SEOHead
        title={pageTitle}
        // NOTE ON FIX: This line previously caused a Type Error because 'profile' was not
        // allowed by the SEOHead component's interface. It assumes the developer has 
        // updated the SEOHead interface (e.g., in components/SEOHead.tsx) to include 'profile'.
        // If not, this must be changed to type="website" to compile.
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </SEOHead>

      {/* Main Content Grid: Two columns on desktop */}
      <div className="container mx-auto max-w-6xl px-4 pt-10 pb-20 md:grid md:grid-cols-[1fr,280px] md:gap-12">
        
        {/* === LEFT COLUMN: Narrative Sections & Resources === */}
        <div className="md:order-2 space-y-16">
          
          {/* Hero/About Section (Left Column) */}
          {/* Note: AboutSection component handles its own layout, so we just wrap it. */}
          <AboutSection
            id="about"
            bio={bio}
            achievements={achievements}
            portraitSrc={portrait}
            portraitAlt="Abraham of London portrait" // Added missing alt text to satisfy ESLint warning (hypothetical fix)
            priority // Keep priority on the LCP image
            className="!px-0 !py-0" // Remove padding/margin from AboutSection itself
          />

          <hr className="border-t border-lightGrey mx-auto max-w-lg" />

          {/* Letter of Practice (Integrated) */}
          <section
            aria-labelledby="letter-heading"
            className="prose md:prose-lg max-w-none text-[color:var(--color-on-secondary)/0.9] dark:prose-invert"
          >
            <h2
              id="letter-heading"
              className="font-serif text-3xl font-bold !mt-0 text-forest"
            >
              Letter of Practice
            </h2>
            <p className="lead">
              I work quietly; deliver visibly. My concern is usefulness over noise—the kind of work
              that stands without explanation. Counsel is discreet, cadence disciplined, outcomes
              durable.
            </p>

            <h3 className="font-medium text-xl !mt-6 text-deepCharcoal dark:text-cream">For Fathers:</h3>
            <ul>
              <li>Build the house first—schedule, Scripture, and standards.</li>
              <li>Choose **presence** over performance; private order before public output.</li>
              <li>Lead with truth and kindness; own errors without ceremony.</li>
            </ul>

            <h3 className="font-medium text-xl !mt-6 text-deepCharcoal dark:text-cream">For Young Founders:</h3>
            <ul>
              <li>Ship less, better. Protect constraints; they preserve quality.</li>
              <li>Measure twice. Cut once. **Record progress**; do not perform it.</li>
              <li>Cash discipline over clout; stewardship over spectacle.</li>
            </ul>

            <h3 className="font-medium text-xl !mt-6 text-deepCharcoal dark:text-cream">For Enterprise Leaders:</h3>
            <ul>
              <li>Clarify mandate, remove friction, **guard the standard**.</li>
              <li>Keep counsel private; let public work speak.</li>
              <li>Scale only what proves worthy; heritage over headlines.</li>
            </ul>

            <p className="mt-8 font-medium italic">If our standards align, we can begin.</p>
          </section>

          {/* Contextual CTA like the blogs (Centered) */}
          <div className="mx-auto max-w-xl">
            <ResourcesCTA preset="leadership" className="mb-10" />
          </div>
        </div>

        {/* --- RIGHT COLUMN: Featured/Quick Links (Fixed Width Sidebar) --- */}
        <div className="md:order-3 md:col-start-2 space-y-12 pt-16 md:pt-0">
          
          {/* Featured Writing */}
          <section aria-labelledby="featured-writing" className="mt-12 md:mt-0">
            <h2
              id="featured-writing"
              className="mb-4 font-serif text-xl font-semibold text-deepCharcoal"
            >
              Featured Writing
            </h2>
            <ul className="space-y-4">
              <FeatureCard
                href="/blog/leadership-begins-at-home"
                title="Leadership Begins at Home"
                sub="Govern self, then household."
                icon="🏡"
              />
              <FeatureCard
                href="/blog/reclaiming-the-narrative"
                title="Reclaiming the Narrative"
                sub="Court-season clarity under pressure."
                icon="🖋️"
              />
              <FeatureCard
                href="/blog/the-brotherhood-code"
                title="The Brotherhood Code"
                sub="Covenant of presence, not performance."
                icon="🤝"
              />
            </ul>
            <div className="mt-6 text-center">
                <Link href="/blog" className="text-sm font-medium text-forest hover:underline underline-offset-2">
                  View All Writing →
                </Link>
            </div>
          </section>

          <hr className="border-t border-lightGrey" />
          
          {/* Quick Downloads */}
          <section aria-labelledby="quick-downloads">
            <h2
              id="quick-downloads"
              className="mb-4 font-serif text-xl font-semibold text-deepCharcoal"
            >
              Quick Downloads
            </h2>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/downloads/Leadership_Playbook.pdf"
                  className="aol-btn aol-btn-secondary w-full justify-start !text-left text-sm"
                  prefetch={false}
                >
                  📄 Leadership Playbook (30•60•90)
                </Link>
              </li>
              <li>
                <Link
                  href="/downloads/Mentorship_Starter_Kit.pdf"
                  className="aol-btn aol-btn-secondary w-full justify-start !text-left text-sm"
                  prefetch={false}
                >
                  📝 Mentorship Starter Kit
                </Link>
              </li>
              <li>
                <Link
                  href="/downloads/Entrepreneur_Operating_Pack.pdf"
                  className="aol-btn aol-btn-secondary w-full justify-start !text-left text-sm"
                  prefetch={false}
                >
                  ⚙️ Entrepreneur Operating Pack
                </Link>
              </li>
            </ul>
          </section>

          <hr className="border-t border-lightGrey" />
          
          {/* House standards (Elevated Sidebar Style) */}
          <aside
            className="rounded-2xl border border-lightGrey bg-warmWhite p-6 text-sm text-[color:var(--color-on-secondary)/0.8] shadow-card"
            aria-label="House standards and operating principles"
          >
            <h2 className="mb-3 font-serif text-xl font-semibold text-deepCharcoal">
              House Standards
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li className="font-medium">Confidentiality is the standard; trust is primary.</li>
              <li>Devices silent. **No photos.** No recordings.</li>
              <li>Names and affiliations kept private.</li>
              <li>Use insights freely; attribution by permission.</li>
            </ul>
            <p className="mt-4 text-xs italic text-[color:var(--color-on-secondary)/0.6]">
              Private rooms available for sensitive, long-term work.
            </p>
          </aside>
          
          {/* Final Sidebar CTA */}
          <Link
            href="/contact"
            className={clsx(
                "aol-btn aol-btn-primary w-full justify-center text-lg mt-8 mb-12",
                "bg-forest text-cream hover:brightness-90 focus:ring-forest"
            )}
            prefetch={false}
          >
            Begin the Conversation
          </Link>
        </div>
      </div>
    </Layout>
  );
}