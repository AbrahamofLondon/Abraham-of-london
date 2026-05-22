import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import type { DiscoveredPublication } from "@/lib/editorial/types";

type Props = {
  publications: DiscoveredPublication[];
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const EditorialCataloguePage: NextPage<Props> = ({ publications }) => {
  return (
    <Layout
      title="Editorial Catalogue | Abraham of London"
      description="Browse editorials, publications, and strategic writing from Abraham of London."
      canonicalUrl="/editorials/catalogue"
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
          <div className="mx-auto max-w-5xl px-6 pb-8 pt-20 lg:px-10 lg:pb-10 lg:pt-24">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-7">
              <Link
                href="/editorials"
                className="font-mono uppercase tracking-[0.3em] transition-colors duration-200"
                style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
              >
                Editorials
              </Link>
              <span style={{ color: "var(--ds-border)", fontSize: "7px" }}>›</span>
              <span
                className="font-mono uppercase tracking-[0.3em]"
                style={{ fontSize: "7px", color: "var(--ds-accent)" }}
              >
                Catalogue
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <span style={{ width: 1, height: 16, backgroundColor: "var(--ds-accent-soft)", display: "inline-block" }} />
              <span
                className="font-mono uppercase tracking-[0.38em]"
                style={{ fontSize: "7.5px", color: "var(--ds-accent)" }}
              >
                Publication Record
              </span>
            </div>

            <h1
              className="font-serif italic mb-4"
              style={{
                fontWeight: 300,
                fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)",
                lineHeight: 1.0,
                color: "var(--ds-text)",
              }}
            >
              Editorial Catalogue
            </h1>

            <p
              className="text-sm leading-[1.65rem]"
              style={{ color: "var(--ds-text-muted)", maxWidth: "52ch" }}
            >
              A structured catalogue of editorials and publication records from Abraham of London.
            </p>
          </div>
        </section>

        {/* Publications */}
        <section className="py-10 lg:py-12">
          <div className="mx-auto max-w-5xl px-6 lg:px-10">

            {publications.length === 0 ? (
              <div className="border px-6 py-16 text-center" style={{ borderColor: "var(--ds-border)" }}>
                <p className="font-mono text-[8px] uppercase tracking-[0.3em]" style={{ color: "var(--ds-text-subtle)" }}>
                  No publications indexed yet
                </p>
              </div>
            ) : (
              <div style={{ borderTop: "1px solid var(--ds-border)" }}>
                {publications.map((pub) => (
                  <Link
                    key={pub.slug}
                    href={`/editorials/${encodeURIComponent(pub.slug)}`}
                    className="group grid gap-3 border-b py-6 transition-colors duration-200 md:grid-cols-[7rem_1fr_5rem]"
                    style={{ borderBottomColor: "var(--ds-border)" }}
                  >
                    <div className="font-mono text-[7px] uppercase tracking-[0.28em] pt-0.5" style={{ color: "var(--ds-text-subtle)" }}>
                      {formatDate(pub.date) ?? "Undated"}
                    </div>

                    <div className="min-w-0">
                      {pub.category && (
                        <div
                          className="font-mono uppercase tracking-[0.28em] mb-1"
                          style={{ fontSize: "7px", color: "var(--ds-accent)" }}
                        >
                          {pub.category}
                        </div>
                      )}
                      <h2
                        className="font-serif italic transition-colors duration-200 group-hover:text-white"
                        style={{ fontSize: "1.1rem", lineHeight: 1.15, color: "var(--ds-text)", fontWeight: 300 }}
                      >
                        {pub.title}
                      </h2>
                      {pub.description && (
                        <p
                          className="mt-1 text-[12px] leading-[1.5rem]"
                          style={{ color: "var(--ds-text-muted)" }}
                        >
                          {pub.description}
                        </p>
                      )}
                    </div>

                    <div className="self-start pt-0.5 text-right">
                      <span
                        className="font-mono uppercase tracking-[0.24em] transition-colors duration-200 group-hover:text-[#C9963A]"
                        style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
                      >
                        {pub.tier ?? "Public"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { discoverPublications } = await import("@/lib/editorial/discovery");
  const publications = discoverPublications();

  return {
    props: {
      publications: JSON.parse(JSON.stringify(publications)) as DiscoveredPublication[],
    },
  };
};

export default EditorialCataloguePage;
