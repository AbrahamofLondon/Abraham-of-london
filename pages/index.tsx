// pages/index.tsx
import React from "react";
import Head from "next/head";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { GetStaticProps } from "next";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";
import EmailSignup from "@/components/EmailSignup";
import BlogPostCard from "@/components/BlogPostCard";
import BookCard, { type BookCardProps } from "@/components/BookCard";
import { getAllPosts, type PostMeta } from "@/lib/posts";
import { siteConfig } from "@/lib/siteConfig";

// images
import profilePortrait from "@/public/assets/images/profile-portrait.webp";
import abrahamLogo from "@/public/assets/images/abraham-logo.jpg";
import abrahamOfLondonBanner from "@/public/assets/images/abraham-of-london-banner.webp";
import alomaradaLogo from "@/public/assets/images/alomarada-ltd.webp";
import endureluxeLogo from "@/public/assets/images/endureluxe-ltd.webp";
import ogImage from "@/public/assets/social/og-image.jpg";
import twitterImage from "@/public/assets/social/twitter-image.webp";
import linkedinIcon from "@/public/assets/social/linkedin.svg";
import twitterIcon from "@/public/assets/social/twitter.svg";
import instagramIcon from "@/public/assets/social/instagram.svg";
import fatheringWithoutFear from "@/public/assets/books/fathering-without-fear.jpg";
import fatheringPrinciples from "@/public/assets/images/fathering-principles.jpg";
import fatheringWithoutFearTeaser from "@/public/assets/images/fathering-without-fear-teaser.jpg";
import defaultBookCover from "@/public/assets/images/default-book.jpg";

// ---------------- Animations ----------------
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
} as const;

// ---------------- Page ----------------
interface HomeProps {
  posts: PostMeta[];
}

export default function Home({ posts }: HomeProps) {
  const siteTitle = siteConfig?.title || "Abraham of London";
  const siteDescription =
    "Global strategist, author, and visionary leader. Principled strategy, fatherhood, and craftsmanship for a life and legacy that endure.";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://abraham-of-london.netlify.app";

  const email = "info@abrahamoflondon.org";
  const telephone = "+44 20 8062 25909";
  const telHref = telephone.replace(/\s+/g, ""); // for a valid tel: link

  const socialLinks = {
    linkedin: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    twitter: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09",
    instagram: "https://www.instagram.com/abraham_of_london",
  };

  const books: BookCardProps[] = [
    {
      slug: "fathering-without-fear",
      title: "Fathering Without Fear",
      coverImage: fatheringWithoutFear.src,
      excerpt:
        "A heartfelt guide for fathers navigating the complexities of parenthood with courage, integrity, and love.",
      author: "Abraham Adaramola",
      buyLink: "https://example.com/buy/fathering-without-fear",
      downloadPdf: "/downloads/fathering-without-fear.pdf",
      downloadEpub: "/downloads/fathering-without-fear.epub",
      genre: "Parenting & Fatherhood",
    },
    {
      slug: "fathering-principles",
      title: "Fathering Principles",
      coverImage: fatheringPrinciples.src,
      excerpt:
        "Essential principles every father should know to build strong, lasting relationships with their children.",
      author: "Abraham Adaramola",
      buyLink: "https://example.com/buy/fathering-principles",
      downloadPdf: "/downloads/fathering-principles.pdf",
      downloadEpub: "/downloads/fathering-principles.epub",
      genre: "Parenting & Fatherhood",
    },
  ];

  const latestPosts = posts.slice(0, 3);

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />

        {/* Open Graph */}
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}${ogImage.src}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Abraham of London — social banner"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={`${siteUrl}${twitterImage.src}`} />
        <meta name="twitter:creator" content="@AbrahamAda48634" />

        <link rel="canonical" href={siteUrl} />
      </Head>

      {/* ---------------- Hero (crisp & legible) ---------------- */}
      <section className="relative isolate">
        {/* Background image (decorative) */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={abrahamOfLondonBanner}
            alt="" // decorative
            priority
            fill
            className="object-cover"
            sizes="100vw"
          />
          {/* Scrim for contrast + slight blur for readability */}
          <div className="absolute inset-0 bg-[radial-gradient(100%_60%_at_30%_20%,rgba(0,0,0,.7),rgba(0,0,0,.45)_40%,rgba(0,0,0,.7))] backdrop-blur-[1.5px]" />
        </div>

        {/* Content */}
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={container}
            className="max-w-2xl text-left"
          >
            <motion.h1
              variants={item}
              className="font-serif text-4xl md:text-6xl font-extrabold leading-tight text-cream drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]"
            >
              Abraham of London
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-4 text-lg md:text-2xl text-cream/90 leading-relaxed"
            >
              Global strategist, author, and visionary leader.{" "}
              <span className="font-semibold">Join 120,000</span> global
              leaders.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-8 flex flex-wrap gap-4"
              aria-label="Primary actions"
            >
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-forest px-6 py-3 text-cream font-semibold shadow-lg shadow-black/30 hover:bg-forest/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/60"
              >
                Join the Movement
              </Link>
              <Link
                href="/books"
                className="inline-flex items-center rounded-full border border-white/70 bg-white/10 px-6 py-3 text-cream backdrop-blur hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/60"
              >
                Shop Now
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Brand row ---------------- */}
      <Section title="Ventures & Brands">
        <div className="grid grid-cols-2 items-center justify-items-center gap-8 md:grid-cols-4">
          <LogoTile src={abrahamLogo} alt="Abraham of London" />
          <LogoTile src={alomaradaLogo} alt="Alomarada Ltd" />
          <LogoTile src={endureluxeLogo} alt="Endureluxe Ltd" />
          <div className="hidden md:block">
            <Image
              src={profilePortrait}
              alt="Portrait of Abraham"
              width={100}
              height={100}
              className="rounded-full shadow"
              sizes="100px"
            />
          </div>
        </div>
      </Section>

      {/* ---------------- Featured books ---------------- */}
      <Section title="Featured Books">
        <div className="grid grid-cols-1 justify-items-center gap-8 md:grid-cols-2">
          {books.map((b) => (
            <motion.div key={b.slug} variants={item}>
              <BookCard
                {...b}
                coverImage={b.coverImage || defaultBookCover.src}
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Image
            src={fatheringWithoutFearTeaser}
            alt="Fathering Without Fear — Coming soon"
            width={220}
            height={320}
            className="mx-auto rounded-lg shadow-lg"
            sizes="220px"
          />
          <p className="mt-3 text-gray-600">
            More insights on fatherhood coming your way.
          </p>
        </div>
      </Section>

      {/* ---------------- Latest posts ---------------- */}
      <div>
  {latestPosts.map((post) => (
    <motion.div key={post.slug} variants={fadeInUp}>
      {/* Pass a default value for 'title' if it's undefined */}
      <BlogPostCard {...post} title={post.title ?? 'Untitled Post'} />
    </motion.div>
  ))}
</div>

          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center rounded-full border border-gray-300 px-6 py-3 text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
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
        </Section>
      )}

      {/* ---------------- About ---------------- */}
      <Section title="About Me" withContainer>
        <div className="rounded-xl bg-gradient-to-r from-gray-50 to-emerald-50 p-8 shadow-sm">
          <p className="mx-auto max-w-3xl text-center text-lg text-gray-700">
            I’m Abraham of London — strategist, writer, and builder. My work
            sits at the intersection of principled strategy, fatherhood &
            legacy, and craft. I help leaders build with clarity, discipline,
            and standards that endure.
          </p>
          <div className="mt-6 text-center">
            <Link
              href="/about"
              className="inline-flex items-center text-forest underline decoration-forest/40 underline-offset-2 hover:decoration-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 rounded"
            >
              Read My Full Story
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
        </div>
      </Section>

      {/* ---------------- Contact / Social ---------------- */}
      <section className="mx-auto my-16 max-w-4xl rounded-xl bg-gradient-to-r from-emerald-50 to-forest/10 px-8 py-12 shadow">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Get in Touch
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-8 text-center md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Email</h3>
            <a
              href={`mailto:${email}`}
              className="text-forest underline decoration-forest/40 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 rounded"
            >
              {email}
            </a>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Phone</h3>
            <a
              href={`tel:${telHref}`}
              className="text-forest underline decoration-forest/40 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 rounded"
            >
              {telephone}
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="mb-6 text-xl font-semibold text-gray-800">
            Follow My Journey
          </h3>
          <div className="flex justify-center gap-8">
            <SocialIcon
              href={socialLinks.linkedin}
              src={linkedinIcon}
              alt="LinkedIn"
            />
            <SocialIcon
              href={socialLinks.twitter}
              src={twitterIcon}
              alt="Twitter / X"
            />
            <SocialIcon
              href={socialLinks.instagram}
              src={instagramIcon}
              alt="Instagram"
            />
          </div>
        </div>
      </section>

      {/* ---------------- Newsletter ---------------- */}
      <section className="mx-auto mb-20 max-w-4xl rounded-2xl bg-forest px-8 py-14 text-center text-cream shadow-xl">
        <h2 className="text-3xl md:text-4xl font-bold">Join My Newsletter</h2>
        <p className="mx-auto mt-3 max-w-2xl opacity-90">
          Receive exclusive insights on fatherhood, leadership, and strategy
          directly in your inbox.
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <EmailSignup />
        </div>
      </section>
    </Layout>
  );
}

/* ---------------- helpers & small components ---------------- */

function LogoTile({
  src,
  alt,
}: {
  src: StaticImageData;
  alt: string;
}) {
  return (
    <motion.div className="transition-transform" whileHover={{ scale: 1.05 }}>
      <Image
        src={src}
        alt={alt}
        width={120}
        height={120}
        className="rounded-lg shadow-sm"
        sizes="120px"
      />
    </motion.div>
  );
}

function Section({
  title,
  children,
  withContainer = false,
}: {
  title: string;
  children: React.ReactNode;
  withContainer?: boolean;
}) {
  return (
    <motion.section
      className={withContainer ? "mx-auto max-w-6xl px-4 py-14" : "px-4 py-14"}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="mb-8 text-center text-3xl font-bold text-gray-800 md:text-4xl">
        {title}
      </h2>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={container}
      >
        {children}
      </motion.div>
    </motion.section>
  );
}

function SocialIcon({
  href,
  src,
  alt,
}: {
  href: string;
  src: StaticImageData;
  alt: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 rounded"
      aria-label={alt}
    >
      <Image src={src} alt={alt} width={44} height={44} sizes="44px" />
    </a>
  );
}

/* ---------------- data ---------------- */

export const getStaticProps: GetStaticProps = async () => {
  try {
    const posts = getAllPosts(["slug", "title", "date", "coverImage", "excerpt"]);
    return { props: { posts: posts || [] } };
  } catch {
    return { props: { posts: [] } };
  }
};
