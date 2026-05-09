import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import CounselMemorySummary from "@/components/counsel/CounselMemorySummary";
import CounselCaseTimeline from "@/components/counsel/CounselCaseTimeline";
import { resolvePageAccess } from "@/lib/access/server";
import { loadCounselCaseForUser, loadCounselCasesForUser } from "@/lib/product/counsel-case-service";
import type { CounselCase } from "@/lib/product/counsel-room-contract";

type Props = {
  authenticated: boolean;
  counselCase: CounselCase | null;
  counselCaseCount: number;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const CounselStatusPage: NextPage<Props> = ({ authenticated, counselCase, counselCaseCount }) => {
  return (
    <Layout title="Counsel Status" description="Track counsel case state." fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-5xl space-y-6">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
              Counsel Status
            </p>
            <h1 className="mt-3 text-3xl text-white">Governed counsel lifecycle</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
              This is a status surface, not a sales funnel. It shows what happened, what the system is waiting for, and what each side can do next.
            </p>
          </header>

          {!authenticated ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">Sign in to view counsel case status.</p>
            </section>
          ) : null}

          {authenticated && !counselCase ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">No counsel case is currently attached to this account.</p>
            </section>
          ) : null}

          {authenticated && counselCase ? (
            <>
              <section className="grid gap-4 md:grid-cols-3">
                <article style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                    Current status
                  </p>
                  <p className="mt-3 text-xl text-white">{counselCase.status}</p>
                </article>
                <article style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                    Created
                  </p>
                  <p className="mt-3 text-xl text-white">{new Date(counselCase.createdAt).toLocaleDateString("en-GB")}</p>
                </article>
                <article style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                    Updated
                  </p>
                  <p className="mt-3 text-xl text-white">{new Date(counselCase.updatedAt).toLocaleDateString("en-GB")}</p>
                </article>
              </section>

              <CounselCaseTimeline counselCase={counselCase} />

              <CounselMemorySummary counselCase={counselCase} caseCount={counselCaseCount} />

              <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
                  Current case summary
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">{counselCase.userSummary}</p>
                {counselCase.counselResponse ? (
                  <div className="mt-5">
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                      Counsel response
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/60">{counselCase.counselResponse}</p>
                  </div>
                ) : null}
              </section>
            </>
          ) : null}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { session, access } = await resolvePageAccess(ctx);
  const email = typeof session?.user?.email === "string" ? session.user.email.toLowerCase() : null;
  const userId = typeof session?.user?.id === "string" ? session.user.id : null;

  if (!access.permissions.isAuthenticated || !email) {
    return {
      props: {
        authenticated: false,
        counselCase: null,
        counselCaseCount: 0,
      },
    };
  }

  const counselCases = await loadCounselCasesForUser({ email, userId: userId ?? undefined });
  const counselCase = counselCases[0] ?? await loadCounselCaseForUser({ email, userId: userId ?? undefined });

  return {
    props: {
      authenticated: true,
      counselCase,
      counselCaseCount: counselCases.length || (counselCase ? 1 : 0),
    },
  };
};

export default CounselStatusPage;
