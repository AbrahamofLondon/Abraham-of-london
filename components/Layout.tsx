// components/Layout.tsx
import Head from "next/head";
import Link from "next/link";
import SocialFollowStrip from "@/components/SocialFollowStrip";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
  pageTitle?: string;
};

const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  process.env.DEPLOY_PRIME_URL ??
  "https://abrahamoflondon.org";

const originNoSlash = ORIGIN.replace(/\/$/, "");

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Abraham of London",
  url: originNoSlash,
  logo: `${originNoSlash}/assets/images/logo/abraham-of-london-logo.svg`,
  sameAs: [
    "https://twitter.com/AbrahamAda48634",
    "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    "https://www.instagram.com/abraham_of_london",
    "https://www.facebook.com/share/p/156tQWm2mZ/",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "info@abrahamoflondon.org",
      telephone: "+44 20 8 622 5909",
      areaServed: "GB",
      availableLanguage: ["en"],
    },
  ],
};

export default function Layout({ children, pageTitle }: LayoutProps) {
  const title = pageTitle ? `${pageTitle} | Abraham of London` : "Abraham of London";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Organization schema site-wide */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
      </Head>

      {/* Site-wide social strip */}
      <SocialFollowStrip />

      {/* Page content */}
      <main className="min-h-screen bg-gray-50">{children}</main>

      {/* Footer with legal links */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:text-left">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Abraham of London. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link
              href="/privacy"
              className="hover:text-gray-900 underline decoration-forest/40 hover:decoration-forest"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-900 underline decoration-forest/40 hover:decoration-forest"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
