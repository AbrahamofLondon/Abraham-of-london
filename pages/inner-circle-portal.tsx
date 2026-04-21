import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Layers, BookOpen } from "lucide-react";

const GOLD = "#C9A96E";

const PRINCIPLES = [
  {
    icon: Shield,
    title: "Continuous access",
    body: "Every paid framework, report, and intelligence brief — available the moment it is published. No per-asset gates.",
  },
  {
    icon: Layers,
    title: "Removes friction",
    body: "One decision replaces many. Access the full decision layer without evaluating each resource individually.",
  },
  {
    icon: BookOpen,
    title: "For serious use",
    body: "Designed for operators, principals, and institutional architects who use these frameworks in live environments.",
  },
];

const InnerCirclePage: NextPage = () => {
  const pageTitle = "The Inner Circle | Abraham of London";
  const description =
    "Access to the system without interruption. Continuous access to every framework, report, and intelligence brief.";

  return (
    <Layout title={pageTitle} description={description}>
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen" style={{ backgroundColor: "var(--ds-background)", color: "var(--ds-text)" }}>
        {/* Hero */}
        <section className="relative overflow-hidden border-b px-6 pb-20 pt-28 md:pt-36" style={{ borderColor: "var(--ds-border)" }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at top, ${GOLD}0A, transparent 45%)` }} />
          <div className="relative mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px w-8" style={{ backgroundColor: `${GOLD}50` }} />
                <span
                  className="font-mono uppercase"
                  style={{ fontSize: "8px", letterSpacing: "0.34em", color: `${GOLD}90` }}
                >
                  Inner Circle
                </span>
              </div>

              <h1
                className="font-['Cormorant_Garamond',Georgia,serif] font-light"
                style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", lineHeight: 1.05, color: "var(--ds-text)" }}
              >
                Access to the system<br />
                <span style={{ color: `${GOLD}CC` }}>without interruption.</span>
              </h1>

              <p
                className="mt-6 max-w-[52ch]"
                style={{ fontSize: "15.5px", lineHeight: 1.75, color: "var(--ds-text-muted)" }}
              >
                The Inner Circle is continuous access to every framework, intelligence brief,
                and decision asset in the Abraham of London system. No per-asset purchase.
                No repeated gates. One decision — full access.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Principles */}
        <section className="mx-auto max-w-3xl px-6 py-16">
          <div className="space-y-8">
            {PRINCIPLES.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex gap-5 border-b pb-8"
                  style={{ borderColor: "var(--ds-border)" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center border"
                    style={{ borderColor: `${GOLD}30`, color: `${GOLD}90` }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3
                      className="font-mono uppercase"
                      style={{ fontSize: "9px", letterSpacing: "0.28em", color: `${GOLD}CC` }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="mt-2"
                      style={{ fontSize: "14.5px", lineHeight: 1.7, color: "var(--ds-text-muted)" }}
                    >
                      {item.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 pb-24">
          <div
            className="border p-8"
            style={{ borderColor: `${GOLD}25`, backgroundColor: `${GOLD}06` }}
          >
            <p
              className="font-mono uppercase mb-4"
              style={{ fontSize: "8px", letterSpacing: "0.28em", color: `${GOLD}90` }}
            >
              How to join
            </p>
            <p
              className="max-w-[48ch]"
              style={{ fontSize: "14.5px", lineHeight: 1.7, color: "var(--ds-text-muted)" }}
            >
              The Inner Circle is currently invitation-controlled. Register your interest
              and you will be contacted when a place is available.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inner-circle"
                className="inline-flex items-center gap-2 border px-6 py-3 transition-all hover:opacity-80"
                style={{
                  borderColor: `${GOLD}40`,
                  backgroundColor: `${GOLD}0D`,
                  color: `${GOLD}CC`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Register interest
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/downloads"
                className="inline-flex items-center gap-2 border px-6 py-3 transition-all hover:opacity-80"
                style={{
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text-muted)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Browse available assets
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Authority line */}
          <p
            className="mt-4 font-mono"
            style={{ fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: "var(--ds-text-subtle)" }}
          >
            Designed for decision environments · Used when clarity matters
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;

