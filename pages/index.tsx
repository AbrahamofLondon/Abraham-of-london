// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import BookCard from "@/components/BookCard";
import BlogPostCard from "@/components/BlogPostCard";
import { sans, serif, cursive } from "@/lib/fonts";

export default function Home() {
  const books = [
    {
      slug: "fathering-without-fear",
      title: "Fathering Without Fear",
      author: "Abraham of London",
      excerpt: "A bold memoir reclaiming fatherhood, confronting injustice, and living without fear.",
      genre: "Memoir",
      featured: true,
    },
    {
      slug: "fictional-adaptation",
      title: "The Fictional Adaptation",
      author: "Abraham of London",
      excerpt: "A dramatized reimagining of lived experiences — raw, compelling, and cinematic.",
      genre: "Drama",
    },
  ];

  const posts = [
    {
      // pages/index.tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useScroll, useSpring } from "framer-motion";

import Layout from "@/components/Layout";
import TestimonialsSection from "@/components/TestimonialsSection";
import AboutSection from "@/components/AboutSection";
import MilestonesTimeline from "@/components/MilestonesTimeline";
import EventsSection from "@/components/EventsSection";
import LogoTile from "@/components/LogoTile";
import NewsletterForm from "@/components/NewsletterForm";
import { getAllPosts } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

import abrahamOfLondonBanner from "@/public/assets/images/abraham-of-london-banner.webp";
import profilePortrait from "@/public/assets/images/profile-portrait.webp";
import abrahamLogo from "@/public/assets/images/abraham-logo.jpg";
import alomaradaLogo from "@/public/assets/images/logo/alomarada.svg";
import endureluxeLogo from "@/public/assets/images/logo/endureluxe.svg";
import innovatehubLogo from "@/public/assets/images/logo/innovatehub.svg";

// Fallback wrapper for missing Section (prevents build crash if the file is renamed/missing)
const Section = dynamic(
  () =>
    import("@/components/Section").catch(() => {
      const MissingSection = () => (
        <section className="px-4 py-14 text-center text-sm text-amber-600">
          ⚠️ Section component missing
        </section>
      );
      MissingSection.displayName = "MissingSection";
      return MissingSection;
    }),
  { ssr: true }
);

type HomeProps = { posts: PostMeta[] };

function Home({ posts }: HomeProps) {
  const siteUrl = "https://abrahamoflondon.org";
  const siteName = "Abraham of London";
  const telephone = "+44 20 8622 5909";
  const telHref = telephone.replace(/[^\d+]/g, "");

  const books = [
    { title: "Fathering Without Fear", desc: "Memoir on fatherhood and legacy." },
    { title: "The Fiction Adaptation", desc: "Romance-drama inspired by true events." },
  ];

  // subtle parallax on the hero image
  const { scrollY } = useScroll();
  const y = useSpring(scrollY, { stiffness: 50, damping: 20 });

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
      <header className="relative isolate flex h-[90vh] items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 -z-10"
          style={{ y: y.to((v) => v * -0.15) }}
          aria-hidden="true"
        >
          <Image
            src={abrahamOfLondonBanner}
            alt=""
            priority
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[radial-gradient(100%_60%_at_30%_20%,rgba(0,0,0,.7),rgba(0,0,0,.45)_40%,rgba(0,0,0,.7))] backdrop-blur-[1.5px]" />
        </motion.div>

        <div className="relative z-10 px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-5xl font-bold tracking-tight sm:text-7xl"
          >
            <span className="relative inline-block bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent [animation:shimmer_3s_infinite]">
              Abraham of London
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-200"
          >
            Strategist, writer, and builder. Dedicated to legacy, fatherhood, and principled work.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 flex justify-center gap-4"
          >
            <Link
              href="/about"
              className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-500"
            >
              Learn More
            </Link>
            <Link
              href="/blog"
              className="rounded-lg border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Read Posts
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Ventures */}
      <Section title="Ventures & Brands">
        <div className="grid grid-cols-2 items-center justify-items-center gap-8 md:grid-cols-4">
          <LogoTile
            src={abrahamLogo}
            alt="Abraham of London"
            className="transition-transform duration-300 hover:scale-105"
          />
          <LogoTile
            src={alomaradaLogo}
            alt="Alomarada Ltd"
            className="transition-transform duration-300 hover:scale-105"
          />
          <LogoTile
            src={endureluxeLogo}
            alt="Endureluxe Ltd"
            className="transition-transform duration-300 hover:scale-105"
          />
          <Link href="/ventures" aria-label="View InnovateHub on the Ventures page" className="contents">
            <LogoTile
              src={innovatehubLogo}
              alt="InnovateHub"
              className="transition-transform duration-300 hover:scale-105"
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
          {[
            { title: "Fathering Without Fear", desc: "Memoir on fatherhood and legacy." },
            { title: "The Fiction Adaptation", desc: "Romance-drama inspired by true events." },
          ].map((book) => (
            <div
              key={book.title}
              className="rounded-lg border p-6 shadow-sm transition hover:shadow-lg"
            >
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
              href={`/blog/${post.slug}`}
              className="block rounded-lg border p-4 transition-all hover:border-amber-400 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold">{post.title}</h3>
              {post.excerpt && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {post.excerpt}
                </p>
              )}
            </Link>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <div className="text-center">
          <p className="mb-4 text-lg">Let’s build something enduring together.</p>
          <a
            href={`tel:${telHref}`}
            className="inline-block rounded-md border border-amber-500 px-6 py-3 font-medium text-amber-600 transition-all hover:bg-amber-50 hover:shadow-lg"
          >
            {telephone}
          </a>
        </div>
      </Section>

      {/* Newsletter */}
      <Section title="Stay Updated">
        <NewsletterForm />
      </Section>

      {/* Signature */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        Built by{" "}
        <span className="font-[cursive] text-lg text-gray-700">Abraham</span>
      </footer>
    </Layout>
  );
}

Home.displayName = "Home";
export default Home;

export async function getStaticProps() {
  const posts = getAllPosts(); // ensure this reads from /content/blog and returns PostMeta[]
  return { props: { posts } };
}
SS,
    },
    {
      slug: "self-leadership-and-society",
      title: "Self-Leadership and Building Society",
      date: "2025-07-18",
      excerpt:
        "The society we desire begins at home: with family, children, and the daily discipline of responsibility.",
      category: "Society",
      readTime: "6 min read",
    },
  ];

  return (
    <>
      <Head>
        <title>Abraham of London — Home</title>
        <meta
          name="description"
          content="Official platform of Abraham of London: thought leadership, books, and political commentary."
        />
        <meta property="og:title" content="Abraham of London" />
        <meta property="og:description" content="Fathering Without Fear — reclaiming fatherhood and truth." />
        <meta property="og:image" content="/assets/images/social/og-image.jpg" />
        <meta property="twitter:image" content="/assets/images/social/twitter-image.jpg" />
      </Head>

      <main className={`${sans.variable} ${serif.variable} ${cursive.variable}`}>
        {/* Hero Section */}
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-cream to-white px-6 text-center">
          <motion.h1
            className={`mb-6 bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl ${serif.variable}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Abraham of London
          </motion.h1>
          <motion.p
            className="max-w-2xl text-lg text-gray-700 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <span className={`${cursive.variable} text-2xl text-gray-800`}>
              Fathering Without Fear
            </span>{" "}
            — where faith, strategy, and story collide.
          </motion.p>
          <motion.div
            className="mt-8 flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <Link
              href="/books"
              className="rounded-full bg-emerald-600 px-6 py-3 text-white shadow-lg transition hover:bg-emerald-700"
            >
              Explore Books
            </Link>
            <Link
              href="/blog"
              className="rounded-full border border-emerald-600 px-6 py-3 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
            >
              Read Blog
            </Link>
          </motion.div>
        </section>

        {/* Books Section */}
        <section className="px-6 py-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            Featured Books
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section className="bg-gray-50 px-6 py-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            Latest Commentary
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Abraham of London. All rights reserved.
        </footer>
      </main>
    </>
  );
}

Home.displayName = "Home";
