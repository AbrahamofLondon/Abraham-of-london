import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import PortfolioMemorySummary from "@/components/oversight/PortfolioMemorySummary";
import { resolvePageAccess } from "@/lib/access/server";
import { buildPortfolioMemory, type PortfolioMemory } from "@/lib/product/portfolio-memory-surface";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Props = {
  authenticated: boolean;
  data: PortfolioMemory | null;
};

const PortfolioPage: NextPage<Props> = ({ authenticated, data }) => {
  if (!authenticated) {
    return (
      <Layout title="Portfolio Memory | Abraham of London" description="Cross-case institutional intelligence." fullWidth>
        <Head><meta name="robots" content="noindex,nofollow" /></Head>
        <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
          <div className="mx-auto max-w-4xl">
            <p className="text-white/65">Sign in to view portfolio memory.</p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Portfolio Memory | Abraham of London" description="Sponsor-safe cross-case institutional intelligence." fullWidth headerTransparent>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
              Portfolio Memory
            </p>
            <h1 className="mt-3 text-3xl text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Cross-case institutional intelligence
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
              This surface aggregates sponsor-safe signals across retained diagnostic cases, checkpoint posture,
              counsel escalations, boardroom dossiers, and outcome verifications. Raw respondent text and
              operator notes are withheld.
            </p>
          </header>

          {data ? (
            <PortfolioMemorySummary data={data} />
          ) : (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">Portfolio memory could not be assembled for the current access scope.</p>
              <p className="mt-3 text-sm leading-7 text-white/50">
                Start with diagnostic evidence, then establish retained oversight before expecting cross-case portfolio intelligence.
              </p>
            </section>
          )}

          <section className="flex flex-wrap gap-3">
            <Link href="/oversight" className="border border-white/10 px-4 py-3 text-sm text-white/68 transition hover:bg-white/5">
              &larr; Back to oversight
            </Link>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { requireRole } = await import("@/lib/access/require-role.server");
  const roleCheck = await requireRole(ctx, "PORTFOLIO_VIEW");
  if ("redirect" in roleCheck) return { redirect: roleCheck.redirect };

  const { session, access } = await resolvePageAccess(ctx);
  const email = typeof session?.user?.email === "string" ? session.user.email.toLowerCase() : null;
  const userId = typeof session?.user?.id === "string" ? session.user.id : null;

  if (!access.permissions.isAuthenticated || !email) {
    return { props: { authenticated: false, data: null } };
  }

  const organisationId = typeof ctx.query.organisationId === "string" ? ctx.query.organisationId : null;

  const data = await buildPortfolioMemory({
    organisationId,
    email,
    userId,
  }).catch(() => null);

  return {
    props: {
      authenticated: true,
      data,
    },
  };
};

export default PortfolioPage;
