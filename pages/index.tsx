// pages/index.tsx
import React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { GetStaticProps } from "next";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";
import EmailSignup from "@/components/EmailSignup";
import BlogPostCard from "@/components/BlogPostCard";
import BookCard, { BookCardProps } from "@/components/BookCard";

import { getAllPosts, PostMeta } from "@/lib/posts";

// --- Images & assets ---
import profilePortrait from "@/public/assets/images/profile-portrait.webp";
import heroImage from "@/public/assets/images/abraham-of-london-banner.webp";

import abrahamLogo from "@/public/assets/images/abraham-logo.jpg";
import alomaradaLogo from "@/public/assets/images/alomarada-ltd.webp";
import endureluxeLogo from "@/public/assets/images/endureluxe-ltd.webp";

import ogImage from "@/public/assets/images/social/og-image.jpg"; // Using existing banner as fallback
import twitterImage from "@/public/assets/images/social/twitter-image.webp";
import linkedinIcon from "@/public/assets/images/social/linkedin.svg";
import twitterIcon from "@/public/assets/images/social/twitter.svg";
import instagramIcon from "@/public/assets/images/social/instagram.svg";

// Book covers
import fatheringWithoutFear from "@/public/assets/images/books/fathering-without-fear.jpg";
import fatheringPrinciples from "@/public/assets/images/fathering-principles.jpg";
import fatheringWithoutFearTeaser from "@/public/assets/images/fathering-without-fear-teaser.jpg";
import defaultBookCover from "@/public/assets/images/default-book.jpg";

// ---------- Env-aware site URL ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://abrahamoflondon.org"
).replace(/\/$/, "");

// ---------- Export types that may be needed by other modules ----------
export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string; // Make this required, not optional
  author: string; // Make this required, not optional
  content?: string;
}

export interface Book {
  slug: string;
  title: string;
  coverImage: string;
  excerpt: string;
  author: string;
  buyLink: string;
  downloadPdf?: string;
  downloadEpub?: string;
  genre: string;
}

// ---------- Page props ----------
interface HomeProps {
  posts: Post[]; // Use our defined Post type instead of PostMeta
}

// ---------- Animation variants ----------
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const Home: React.FC<HomeProps> = ({ posts }) => {
  const title = "Abraham of London";
  const description =
    "Principled strategy, fatherhood, and practical wisdom — helping leaders build lives and work that endure.";

  const email = "info@abrahamoflondon.org";
  const telephone = "+44 20 8062 25909";

  const socialLinks = {
    linkedin: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    twitter: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09",
    instagram: "https://www.instagram.com/abraham_of_london",
  };

  // Books featured on the homepage (extend freely)
  const books: BookCardProps[] = [
    {
      slug: "fathering-without-fear",
      title: "Fathering Without Fear",
      coverImage: fatheringWithoutFear.src,
      excerpt:
        "A field guide for modern fatherhood — courage, presence, and principled leadership at home.",
      author: "Abraham Adaramola",
      buyLink: "/books/fathering-without-fear", // route within your site (or external store)
      downloadPdf: "/downloads/fathering-without-fear.pdf",
      downloadEpub: "/downloads/fathering-without-fear.epub",
      genre: "Parenting & Fatherhood",
    },
    {
      slug: "fathering-principles",
      title: "Fathering Principles",
      coverImage: fatheringPrinciples.src,
      excerpt:
        "Timeless principles to raise resilient children and build a family culture that lasts.",
      author: "Abraham Adaramola",
      buyLink: "/books/fathering-principles",
      downloadPdf: "/downloads/fathering-principles.pdf",
      downloadEpub: "/downloads/fathering-principles.epub",
      genre: "Parenting & Fatherhood",
    },
  ];

  // Latest posts are already properly typed as Post[]
  const latestPosts = posts.slice(0, 3);

  return (
    <Layout>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="author" content="Abraham Adaramola" />
        <meta
          name="keywords"
          content="Abraham of London, leadership, strategy, fatherhood, legacy"
        />
        <meta name="theme-color" content="#0b2e1f" />
        <link rel="canonical" href={SITE_URL} />

        {/* OG / Twitter */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}${ogImage.src}`} />
        <meta property="og:image:alt" content="Abraham of London — social preview" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}${twitterImage.src}`} />
        <meta name="twitter:creator" content="@AbrahamAda48634" />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Abraham of London",
              url: SITE_URL,
              image: `${SITE_URL}${profilePortrait.src}`,
              description,
              email,
              telephone,
              jobTitle: "Strategist & Author",
              sameAs: [socialLinks.linkedin, socialLinks.twitter, socialLinks.instagram],
            }),
          }}
        />
      </Head>

      {/* ---------------- HERO ---------------- */}
      <section className="relative min-h-[72vh] md:min-h-[78vh] overflow-hidden">
        <Image src={heroImage} alt="" fill priority className="object-cover -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_10%,rgba(0,0,0,0.55),rgba(0,0,0,0.78))]" />

        <div className="relative mx-auto max-w-5xl px-4 pt-[calc(2rem+env(safe-area-inset-top))] pb-14 text-white">
          <p className="text-sm md:text-base uppercase tracking-widest text-cream/85">
            London, Global
          </p>
          <h1 className="mt-2 font-serif font-bold leading-tight text-4xl md:text-6xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
            Abraham of London
          </h1>
          <p className="mt-3 text-lg md:text-xl text-white/90 max-w-prose drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
            Global strategist, author, and father—helping leaders build durable
            brands, resilient families, and legacies that last. <span className="whitespace-nowrap">Join 120,000+</span>{" "}
            readers and leaders.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#newsletter"
              className="inline-flex h-12 items-center rounded-full bg-forest px-6 text-base font-semibold text-cream shadow-lg ring-1 ring-white/10 hover:bg-forest/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/60"
            >
              Join the Movement
            </Link>
            <Link
              href="/books"
              className="inline-flex h-12 items-center rounded-full bg-white/10 px-6 text-base font-semibold text-white backdrop-blur-md ring-1 ring-white/30 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/60"
            >
              Explore the Books
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* ---------------- PILLARS ---------------- */}
        <motion.section
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={containerVariants}
        >
          {[
            {
              title: "Principled Strategy",
              text: "Clarity, leverage, and compounding results—without compromising values.",
            },
            {
              title: "Fatherhood & Legacy",
              text: "Timeless, practical wisdom for building resilient families and cultures.",
            },
            {
              title: "Craft & Excellence",
              text: "Writing, products, and ventures that respect people and the future.",
            },
          ].map((card) => (
            <motion.article
              key={card.title}
              variants={itemVariants}
              className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5"
            >
              <h3 className="text-xl font-semibold text-forest">{card.title}</h3>
              <p className="mt-2 text-gray-700">{card.text}</p>
            </motion.article>
          ))}
        </motion.section>

        {/* ---------------- FAMILY / VENTURES ---------------- */}
        <motion.section
          className="mt-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-3xl md:text-4xl font-serif font-bold text-forest">
            The Abraham of London Family
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-gray-700">
            A portfolio at the intersection of strategy, human development, and wellbeing.
          </p>

          <div className="mt-8 grid grid-cols-2 items-center justify-items-center gap-8 md:grid-cols-4">
            <LogoTile src={abrahamLogo} alt="Abraham of London" />
            <LogoTile src={alomaradaLogo} alt="Alomarada" />
            <LogoTile src={endureluxeLogo} alt="Endureluxe" />
            <LogoTile src={heroImage} alt="AØL Banner" w={200} h={100} rounded="lg" />
          </div>
        </motion.section>

        {/* ---------------- FEATURED BOOKS ---------------- */}
        <motion.section
          className="mt-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-3xl md:text-4xl font-serif font-bold text-forest">
            Featured Books
          </h2>

          <div className="mt-8 grid grid-cols-1 justify-items-center gap-8 md:grid-cols-2">
            {books.map((b) => (
              <motion.div
                key={b.slug}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-md"
              >
                <BookCard {...b} coverImage={b.coverImage || defaultBookCover.src} />
              </motion.div>
            ))}
          </div>

          {/* Teaser */}
          <div className="mt-10 text-center">
            <h3 className="text-xl font-semibold text-gray-900">Coming Soon</h3>
            <div className="mt-4 inline-block">
              <Image
                src={fatheringWithoutFearTeaser}
                alt="Fathering Without Fear — teaser"
                width={200}
                height={300}
                className="rounded-lg shadow-lg"
              />
              <p className="mt-3 text-gray-600">New work on fatherhood & leadership</p>
            </div>
          </div>
        </motion.section>

        {/* ---------------- LATEST POSTS ---------------- */}
        {latestPosts.length > 0 && (
          <motion.section
            className="mt-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-forest">
                Latest Reflections
              </h2>
              <Link
                href="/blog"
                className="inline-flex items-center rounded-full border border-black/10 px-5 py-2 text-forest hover:bg-black/5"
              >
                View All
                <svg
                  className="ml-2 h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>

            <motion.div
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={containerVariants}
            >
              {latestPosts.map((post) => (
                <motion.div key={post.slug} variants={itemVariants}>
                  <BlogPostCard {...post} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ---------------- ABOUT TEASER ---------------- */}
        <motion.section
          className="mx-auto mt-16 max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-3xl md:text-4xl font-serif font-bold text-forest">
            About Abraham
          </h2>
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-cream to-white p-8 shadow-lg ring-1 ring-black/5">
            <p className="mx-auto max-w-3xl text-center text-lg text-gray-800">
              I'm a London-based strategist and author. My work lives where leadership,
              fatherhood, and craft meet—helping people build work and families that
              endure. Less trend, more principle.
            </p>
            <div className="mt-6 text-center">
              <Link
                href="/about"
                className="inline-flex items-center rounded-full bg-forest px-6 py-3 font-semibold text-cream hover:bg-forest/90"
              >
                Read the Full Story
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ---------------- CONTACT / SOCIAL ---------------- */}
        <motion.section
          className="mx-auto mt-16 max-w-4xl rounded-2xl bg-white p-10 text-center shadow-lg ring-1 ring-black/5"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-forest">
            Get in Touch
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-gray-800">Email</h3>
              <a
                href={`mailto:${email}`}
                className="mt-1 inline-block text-forest underline underline-offset-2"
              >
                {email}
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Phone</h3>
              <a
                href={`tel:${telephone}`}
                className="mt-1 inline-block text-forest underline underline-offset-2"
              >
                {telephone}
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-black/10 pt-8">
            <h3 className="text-xl font-semibold text-gray-900">Follow the work</h3>
            <div className="mt-4 flex justify-center gap-8">
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="transition-transform hover:scale-110"
              >
                <Image src={linkedinIcon} alt="LinkedIn" width={44} height={44} />
              </a>
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="transition-transform hover:scale-110"
              >
                <Image src={twitterIcon} alt="Twitter / X" width={44} height={44} />
              </a>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition-transform hover:scale-110"
              >
                <Image src={instagramIcon} alt="Instagram" width={44} height={44} />
              </a>
            </div>
          </div>
        </motion.section>

        {/* ---------------- NEWSLETTER ---------------- */}
        <motion.section
          id="newsletter"
          className="mt-16 rounded-2xl bg-forest px-8 py-16 text-center text-cream shadow-xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold">Join the Newsletter</h2>
          <p className="mx-auto mt-2 max-w-2xl text-cream/90">
            Essays on leadership, fatherhood, and building durable work—delivered occasionally,
            when there's something worth saying.
          </p>

          {/* Use your existing component; if you prefer a simple form, replace with inputs */}
          <div className="mx-auto mt-6 max-w-md">
            <EmailSignup />
          </div>
        </motion.section>
      </main>
    </Layout>
  );
};

// Small logo tile helper
function LogoTile({
  src,
  alt,
  w = 120,
  h = 120,
  rounded = "xl",
}: {
  src: any; // Accept any type of image import
  alt: string;
  w?: number;
  h?: number;
  rounded?: "lg" | "xl" | "full";
}) {
  const radius = {
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[rounded];

  return (
    <motion.div whileHover={{ scale: 1.06 }} className="transition-transform">
      <Image
        src={src}
        alt={alt}
        width={w}
        height={h}
        className={`${radius} shadow-sm ring-1 ring-black/5`}
      />
    </motion.div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const rawPosts = getAllPosts(["slug", "title", "date", "coverImage", "excerpt", "author"]) || [];

    // Transform posts to match our Post interface with all required fields
    const posts: Post[] = rawPosts.map(post => ({
      slug: post.slug || "",
      title: post.title || "Untitled",
      date: post.date || "",
      excerpt: post.excerpt || "",
      coverImage: post.coverImage || "/assets/images/og-image.jpg",
      author: post.author || "Abraham Adaramola"
    }));

    return { props: { posts } };
  } catch (err) {
    console.error("getStaticProps error on index:", err);
    return { props: { posts: [] } };
  }
};

export default Home;
