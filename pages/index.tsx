// pages/index.tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import TestimonialsSection from "@/components/TestimonialsSection";
import AboutSection from "@/components/AboutSection";
import MilestonesTimeline from "@/components/MilestonesTimeline";
import EventsSection from "@/components/EventsSection";
import LogoTile from "@/components/LogoTile";
import NewsletterForm from "@/components/NewsletterForm";
import { getAllPosts } from "@/lib/mdx";
import { PostMeta } from "@/types/post";

import abrahamOfLondonBanner from "@/public/assets/images/abraham-of-london-banner.webp";
import profilePortrait from "@/public/assets/images/profile-portrait.webp";
import abrahamLogo from "@/public/assets/images/abraham-logo.jpg";
import alomaradaLogo from "@/public/assets/images/logo/alomarada.svg";
import endureluxeLogo from "@/public/assets/images/logo/endureluxe.svg";
import innovatehubLogo from "@/public/assets/images/logo/innovatehub.svg";

type HomeProps = { posts: PostMeta[] };

export default function Home({ posts }: HomeProps) {
  const siteUrl = "https://abrahamoflondon.org";
  const siteName = "Abraham of London";
  const telephone = "+44 20 7946 0958";
  const telHref = telephone.replace(/[^\d+]/g, ""); // strip spaces/symbols

  const books = [
    { title: "Fathering Without Fear", desc: "Memoir on fatherhood and legacy." },
    { title: "The Fiction Adaptation", desc: "Romance-drama inspired by true events." },
  ];

  return (
    <Layout>
      <Head>
        <title>{siteName}</title>
        <meta name="description" content="Abraham of London — strategist, father, builder." />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={siteName} />
        <meta property="og:description" content="Abraham of London — strategist, father, builder." />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}/assets/images/social/og-image.jpg`} />
        <meta property="og:site_name" content={siteName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteName} />
        <meta name="twitter:description" content="Abraham of London — strategist, father, builder." />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/social/twitter-image.jpg`} />
        <meta name="twitter:site" content="@abrahamoflondon" />
      </Head>

      {/* Hero */}
      <header className="relative isolate">
        <div
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <Image src={abrahamOfLondonBanner} alt="" priority fill className="object-cover" sizes="100vw" />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_60%_at_30%_20%,rgba(0,0,0,.7),rgba(0,0,0,.45)_40%,rgba(0,0,0,.7))] backdrop-blur-[1.5px]"
            aria-hidden="true"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-24 md:py-32">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Abraham of London
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-200">
            Strategist, writer, and builder. Dedicated to legacy, fatherhood, and principled work.
          </p>
        </div>
      </header>

      {/* Ventures */}
      <Section title="Ventures & Brands">
        <div className="grid grid-cols-2 items-center justify-items-center gap-8 md:grid-cols-4">
          <LogoTile
            src={abrahamLogo}
            alt="Abraham of London"
            className="hover:scale-105 transition-transform duration-300"
          />
          <LogoTile
            src={alomaradaLogo}
            alt="Alomarada Ltd"
            className="hover:scale-105 transition-transform duration-300"
          />
          <LogoTile
            src={endureluxeLogo}
            alt="Endureluxe Ltd"
            className="hover:scale-105 transition-transform duration-300"
          />
          <Link
            href="/ventures"
            aria-label="View InnovateHub on the Ventures page"
            className="contents"
          >
            <LogoTile
              src={innovatehubLogo}
              alt="InnovateHub"
              className="hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
      </Section>

      <TestimonialsSection />

      <AboutSection
        bio="I’m Abraham of London — strategist, writer, and builder. My work sits at the intersection of principled strategy, fatherhood & legacy, and craft. I help leaders build with clarity, discipline, and standards that endure."
        achievements={[
          { title: "DADx Talk", year: 2022, description: "Shared ideas on fatherhood and legacy." },
          { title: "Best-selling Book", year: 2026, description: "Broad international readership established." },
          { title: "Leadership Award", year: 2027, description: "Recognized for strategic impact." },
        ]}
        portraitSrc={profilePortrait.src}
      />

      <MilestonesTimeline />
      <EventsSection variant="light" />

      {/* Books */}
      <Section title="Featured Books">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div key={book.title} className="rounded-lg border p-6 shadow-sm">
              <h3 className="text-lg font-semibold">{book.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{book.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Blog */}
      <Section title="Latest Posts">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="block rounded-lg border p-4 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <div className="text-center">
          <p className="mb-4 text-lg">Let’s build something enduring together.</p>
          <a href={`tel:${telHref}`} className="text-blue-600 hover:underline">
            {telephone}
          </a>
        </div>
      </Section>

      {/* Newsletter */}
      <Section title="Stay Updated">
        <NewsletterForm />
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  const posts = getAllPosts().map((post) => post.meta);
  return { props: { posts } };
}
