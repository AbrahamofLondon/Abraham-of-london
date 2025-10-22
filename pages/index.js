import Head from "next/head";
import Link from "next/link"; // Use Link for internal navigation
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css"; // Assuming this path for CSS Modules

// --- Font Setup ---
// Keeping the Geist fonts as they are a modern best practice
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- Component ---

export default function Home() {
  const siteName = "Abraham of London";
  const tagline = "Principled Strategy. Durable Execution.";

  return (
    <>
      <Head>
        <title>{siteName} | {tagline}</title> {/* ✅ OVERHAUL: Changed Title */}
        <meta name="description" content="Quiet counsel and durable execution for fathers, young founders, and enterprise teams." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
      >
        <main className={styles.main}>
          {/* Main Hero Content */}
          <header className={styles.header}>
            <h1 className={styles.headline}>
              {siteName}
            </h1>
            <p className={styles.tagline}>
              {tagline}
            </p>
          </header>

          <section className={styles.heroContent}>
            <p className={styles.intro}>
              I provide **quiet counsel** and durable execution for leaders committed to the long view: **fathers**, **young founders**, and **enterprise teams**. My focus is on clarity, stewardship, and enduring impact over fleeting noise.
            </p>

            <div className={styles.ctas}>
              {/* Primary Call to Action */}
              <Link
                href="/about"
                className={styles.primary}
                aria-label="Learn more about Abraham of London's principles and practice"
              >
                Explore the Practice →
              </Link>
              
              {/* Secondary Call to Action */}
              <Link
                href="/contact"
                className={styles.secondary}
                aria-label="Contact Abraham of London for counsel or partnership"
              >
                Contact for Counsel
              </Link>
            </div>
          </section>
          
          {/* Placeholder for Ventures/Highlights (optional) */}
          <div className={styles.highlights}>
            <p>
              Featured in: *HBR*, *The Wall Street Journal*, *The Federalist*
            </p>
          </div>

        </main>
        
        {/* Simplified Footer */}
        <footer className={styles.footer}>
          <nav aria-label="Quick links">
            <Link href="/blog">Writing</Link>
            <Link href="/ventures">Ventures</Link>
            <Link href="/contact">Contact</Link>
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
              Built with Next.js
            </a>
          </nav>
        </footer>
      </div>
    </>
  );
}