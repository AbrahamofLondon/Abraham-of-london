import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";

type Zone = {
  label: string;
  title: string;
  description: string;
  href: string;
  entry: string;
};

const ZONES: Zone[] = [
  {
    label: "Product Spine",
    title: "Decision Authority Infrastructure",
    description:
      "The instruments for decision governance, executive oversight, and provenance tracking. The commercial operating layer — where doctrine becomes infrastructure.",
    href: "/decision-instruments",
    entry: "Enter Decision Authority",
  },
  {
    label: "Editorial Series",
    title: "The Mind's Clay",
    description:
      "A nine-part editorial serial on memory, writing, attention, authorship, and the technologies that shape the human mind. The intellectual terrain behind the operating doctrine.",
    href: "/editorials/series/the-minds-clay",
    entry: "Enter the series",
  },
  {
    label: "Editorials",
    title: "The Public Intellectual Record",
    description:
      "Long-form arguments, formal publications, and preserved public reasoning. Each piece is written to last.",
    href: "/editorials",
    entry: "View editorials",
  },
  {
    label: "Diagnostics",
    title: "Diagnostics & Executive Reporting",
    description:
      "Run the fast diagnostic. Surface decision delay exposure. Generate executive-grade intelligence on the conditions shaping your operating environment.",
    href: "/diagnostics/fast",
    entry: "Run the diagnostic",
  },
  {
    label: "Intelligence",
    title: "Global Market Intelligence",
    description:
      "Strategic intelligence on markets, forces, and conditions relevant to the operating doctrine. The signal layer.",
    href: "/intelligence",
    entry: "View intelligence",
  },
  {
    label: "Ventures",
    title: "Venture Doctrine in Operation",
    description:
      "Abraham of London's ventures. The doctrine applied, not described. Operating proof of the decision infrastructure in institutional conditions.",
    href: "/ventures",
    entry: "View ventures",
  },
  {
    label: "Strategy Room",
    title: "The Strategy Room",
    description:
      "Earned access to the operating doctrine in practice. Entry is gated by diagnostic evidence, not payment.",
    href: "/strategy-room",
    entry: "Enter if eligible",
  },
  {
    label: "Trust",
    title: "Trust & Governance",
    description:
      "The verification spine, provenance architecture, and retained oversight layer. The operational credibility record.",
    href: "/trust",
    entry: "View trust record",
  },
];

const DiscoveryPage: NextPage = () => {
  return (
    <Layout
      title="Discovery | Abraham of London"
      description="A guided orientation to the Abraham of London operating world — Decision Authority, Editorial Series, Intelligence, Ventures, and Trust."
      canonicalUrl="/editorials/discovery"
      fullWidth
      headerTransparent
      className="ds-surface-essays"
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main style={{ backgroundColor: "var(--ds-background)", minHeight: "100vh" }}>

        {/* Page header */}
        <section style={{ backgroundColor: "var(--ds-background-muted)", borderBottom: "1px solid var(--ds-border)" }}>
          <div className="mx-auto max-w-5xl px-6 pb-10 pt-20 lg:px-10 lg:pb-12 lg:pt-24">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-7">
              <Link
                href="/editorials"
                className="font-mono uppercase tracking-[0.3em] transition-colors duration-200 hover:text-white"
                style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
              >
                Editorials
              </Link>
              <span style={{ color: "var(--ds-border)", fontSize: "7px" }}>›</span>
              <span
                className="font-mono uppercase tracking-[0.3em]"
                style={{ fontSize: "7px", color: "var(--ds-accent)" }}
              >
                Discovery
              </span>
            </div>

            {/* Label */}
            <div className="flex items-center gap-3 mb-6">
              <span style={{ width: 1, height: 16, backgroundColor: "var(--ds-accent-soft)", display: "inline-block" }} />
              <span
                className="font-mono uppercase tracking-[0.38em]"
                style={{ fontSize: "7.5px", color: "var(--ds-accent)" }}
              >
                Operating World
              </span>
            </div>

            {/* Heading */}
            <h1
              className="font-serif italic mb-5"
              style={{
                fontWeight: 300,
                fontSize: "clamp(1.7rem, 2.8vw, 2.4rem)",
                lineHeight: 1.0,
                color: "var(--ds-text)",
                maxWidth: "32ch",
              }}
            >
              Discover the Abraham of London operating world.
            </h1>

            <p
              className="text-sm leading-[1.7rem]"
              style={{ color: "var(--ds-text-muted)", maxWidth: "56ch" }}
            >
              Eight zones. Each one is a distinct layer of the operating doctrine — intellectual, commercial, diagnostic, and credibility. Start anywhere. The zones are designed to be entered in any order.
            </p>

          </div>
        </section>

        {/* Zone list */}
        <section className="py-10 lg:py-12">
          <div className="mx-auto max-w-5xl px-6 lg:px-10">

            <div style={{ borderTop: "1px solid var(--ds-border)" }}>
              {ZONES.map((zone, i) => (
                <Link
                  key={zone.href}
                  href={zone.href}
                  className="group grid border-b py-7 transition-colors duration-200 gap-4 md:grid-cols-[2.5rem_1fr_auto] md:gap-8 md:items-start"
                  style={{ borderBottomColor: "var(--ds-border)" }}
                >
                  {/* Zone index */}
                  <div
                    className="font-mono uppercase tracking-[0.22em] pt-0.5 hidden md:block"
                    style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  {/* Zone content */}
                  <div className="min-w-0">
                    <div
                      className="font-mono uppercase tracking-[0.3em] mb-2"
                      style={{ fontSize: "7px", color: "var(--ds-accent)" }}
                    >
                      {zone.label}
                    </div>

                    <h2
                      className="font-serif italic mb-3 transition-colors duration-200 group-hover:text-white"
                      style={{
                        fontWeight: 300,
                        fontSize: "clamp(1.1rem, 1.5vw, 1.35rem)",
                        lineHeight: 1.1,
                        color: "var(--ds-text)",
                      }}
                    >
                      {zone.title}
                    </h2>

                    <p
                      className="text-[13px] leading-[1.6rem]"
                      style={{ color: "var(--ds-text-muted)", maxWidth: "58ch" }}
                    >
                      {zone.description}
                    </p>
                  </div>

                  {/* Entry CTA */}
                  <div className="flex-shrink-0 pt-7 md:pt-0.5">
                    <span
                      className="font-mono uppercase tracking-[0.24em] transition-colors duration-200 group-hover:text-[#C9963A] whitespace-nowrap"
                      style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
                    >
                      {zone.entry} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>

      </main>
    </Layout>
  );
};

export default DiscoveryPage;
