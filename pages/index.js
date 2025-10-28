// ./pages/index.js
import React from "react";
import Link from "next/link";
import Image from "next/image"; // Next.js Image component for performance
import Layout from "@/components/Layout"; // Assuming a shared Layout component
import SEOHead from "@/components/SEOHead"; // Assuming a shared SEOHead component

// NOTE: Font variables should typically be handled in the main Layout or _app.tsx file.
// We will assume the Geist fonts are applied globally or via the Layout component.

// --- Component ---

export default function Home() {
  const siteName = "Abraham of London";
  const tagline = "Principled Strategy. Durable Execution.";
  const pageTitle = `${siteName} | ${tagline}`;
  const pageDesc = "Quiet counsel and durable execution for leaders committed to the long view: fathers, young founders, and enterprise teams.";

  return (
    <Layout pageTitle={siteName}>
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        slug="/"
        // Assuming siteConfig is available to populate social/OG tags in Layout/SEOHead
      />

      {/* Main Content: Centered Hero Section with Tailwind */}
      <main className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center p-4 text-center md:p-10">
        
        {/* Logo/Icon (Placeholder for LCP optimization) */}
        <div className="mb-8">
            {/* NOTE: Replace with actual logo path and size. Assuming a stylized 'A' or symbol. */}
            <Image 
                src="/logo-symbol.svg"
                alt={siteName}
                width={80}
                height={80}
                priority 
                className="mx-auto h-20 w-20"
            />
        </div>

        {/* Header/Headline */}
        <header className="mb-10 max-w-4xl">
          <h1 className="font-serif text-5xl font-extrabold tracking-tight text-deepCharcoal sm:text-7xl md:text-8xl">
            {siteName}
          </h1>
          <p className="mt-4 font-sans text-xl font-medium text-[color:var(--color-primary)] sm:text-2xl">
            {tagline}
          </p>
        </header>

        {/* Hero Content / Introduction */}
        <section className="max-w-2xl">
          <p className="text-lg font-light leading-relaxed text-[color:var(--color-on-secondary)/0.9] md:text-xl">
            I provide **quiet counsel** and durable execution for leaders committed to the long view: **fathers**, **young founders**, and **enterprise teams**. My focus is on clarity, stewardship, and enduring impact over fleeting noise.
          </p>
        </section>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
          {/* Primary CTA: Explore */}
          <Link
            href="/about"
            className="aol-btn aol-btn-primary group inline-flex items-center justify-center bg-forest text-cream hover:bg-forest/90"
            aria-label="Learn more about Abraham of London's principles and practice"
            prefetch={false}
          >
            Explore the Practice
            <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">→</span>
          </Link>

          {/* Secondary CTA: Contact */}
          <Link
            href="/contact"
            className="aol-btn aol-btn-secondary inline-flex items-center justify-center border-deepCharcoal text-deepCharcoal hover:border-forest hover:text-forest"
            aria-label="Contact Abraham of London for counsel or partnership"
            prefetch={false}
          >
            Contact for Counsel
          </Link>
        </div>

        {/* Highlights / Social Proof (Discreet) */}
        <div className="mt-16 max-w-md">
          <p className="text-sm font-sans font-light italic text-[color:var(--color-on-secondary)/0.7]">
            Quietly serving leaders featured in: *HBR*, *The Wall Street Journal*, *The Federalist*
          </p>
        </div>

      </main>

      {/* Footer is now assumed to be part of the shared Layout component */}
    </Layout>
  );
}