// pages/terms.tsx
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { absUrl, siteConfig } from "@/lib/siteConfig";

export default function Terms() {
  // Keep these in ISO for schema + <time>
  const isoDate = "2025-08-23";
  const humanDate = "August 23, 2025";

  const CANONICAL = absUrl("/terms");

  // Safe absolute images (handle both root-relative and absolute)
  const ogImageAbs = siteConfig.ogImage?.startsWith("/")
    ? absUrl(siteConfig.ogImage)
    : siteConfig.ogImage;
  const twitterImageAbs = siteConfig.twitterImage?.startsWith("/")
    ? absUrl(siteConfig.twitterImage)
    : siteConfig.twitterImage;

  const BREADCRUMBS = [
    { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
    { "@type": "ListItem", position: 2, name: "Terms of Use", item: CANONICAL },
  ];

  const pageTitle = "Terms of Use | Abraham of London";
  const pageDesc = "Terms of Use for abrahamoflondon.org";

  // Schemas
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: BREADCRUMBS,
  };

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms of Use",
    url: CANONICAL,
    inLanguage: "en-GB",
    dateModified: isoDate,
    description: pageDesc,
  };

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.title,
    url: siteConfig.siteUrl,
    logo: absUrl("/assets/images/social/og-image.jpg"),
  };

  return (
    <Layout pageTitle="Terms of Use">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={CANONICAL} />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:site_name" content={siteConfig.title} />
        {ogImageAbs ? (
          <>
            <meta property="og:image" content={ogImageAbs} />
            <meta property="og:image:alt" content="Abraham of London website" />
          </>
        ) : null}

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        {twitterImageAbs ? (
          <meta name="twitter:image" content={twitterImageAbs} />
        ) : null}

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-16 prose prose-slate dark:prose-invert">
        <h1>Terms of Use</h1>
        <p className="text-sm">
          Last updated: <time dateTime={isoDate}>{humanDate}</time>
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using this website and any related services (the
          “Services”), you agree to be bound by these Terms of Use (“Terms”). If
          you do not agree, do not use the Services.
        </p>

        <h2>2. Use of the Services</h2>
        <ul>
          <li>
            Do not attempt to interfere with the site’s security or
            availability.
          </li>
          <li>
            Do not copy, scrape, or redistribute content without permission.
          </li>
          <li>You must comply with applicable laws and regulations.</li>
        </ul>

        <h2>3. Intellectual Property</h2>
        <p>
          All content, trademarks, and branding are the property of Abraham of
          London or its licensors. Limited personal, non-commercial use is
          granted; all other rights are reserved.
        </p>

        <h2>4. Third-Party Links</h2>
        <p>
          Links to third-party sites (e.g., social platforms, booking tools) are
          provided for convenience. We are not responsible for their content or
          practices.
        </p>

        <h2>5. No Professional Advice</h2>
        <p>
          Information is provided for general purposes only and does not
          constitute legal, financial, or other professional advice.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any
          indirect, incidental, special, consequential, or punitive damages
          arising from your use of the Services.
        </p>

        <h2>7. Changes</h2>
        <p>
          We may update these Terms from time to time. Material changes will be
          reflected by updating the “Last updated” date above.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions? Email{" "}
          <a href="mailto:info@abrahamoflondon.org">info@abrahamoflondon.org</a>
          . See also our{" "}
          <Link href="/privacy" prefetch={false}>
            Privacy Policy
          </Link>
          .
        </p>

        {/* Optional legal hardening: add if desired */}
        {/* <h2>9. Governing Law</h2>
        <p>These Terms are governed by the laws of England and Wales.</p>
        <h2>10. Jurisdiction</h2>
        <p>You agree to the exclusive jurisdiction of the courts of England and Wales.</p>
        <h2>11. Termination</h2>
        <p>We may suspend or terminate access for any breach of these Terms.</p>
        <h2>12. Indemnity</h2>
        <p>You agree to indemnify and hold us harmless from claims arising from your use of the Services.</p> */}
      </main>
    </Layout>
  );
}

// Incremental Static Regeneration (daily). Remove if you prefer fully static.
export async function getStaticProps() {
  return { props: {}, revalidate: 86400 };
}
