import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { resolvePageAccess } from "@/lib/access/server";
import { loadBoardroomArchiveCommandSummary } from "@/lib/product/boardroom-archive-summary";

type Props = {
  authenticated: boolean;
  summary: Awaited<ReturnType<typeof loadBoardroomArchiveCommandSummary>> | null;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const BoardroomArchivePage: NextPage<Props> = ({ authenticated, summary }) => {
  return (
    <Layout title="Boardroom Archive" description="Boardroom archive as retained strategic memory." fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-5xl space-y-6">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
              Boardroom archive
            </p>
            <h1 className="mt-3 text-3xl text-white">Board-level strategic memory.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
              Boardroom is not a one-off PDF. This archive shows whether board-level dossiers exist, when they were generated, and whether the current record is boardroom-ready.
            </p>
          </header>

          {!authenticated ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">Sign in to view boardroom archive state.</p>
            </section>
          ) : !summary ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">No boardroom archive is available for this scope yet.</p>
              <p className="mt-3 text-sm leading-7 text-white/50">Boardroom memory appears only when evidence, consequence, and qualification conditions justify escalation.</p>
            </section>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-4">
                {[
                  ["Archive count", String(summary.archiveCount)],
                  ["Repeated exposure", String(summary.repeatedExposureCount)],
                  ["Unresolved", String(summary.unresolvedCount)],
                  ["Latest dossier", summary.latestDossier ? new Date(summary.latestDossier.generatedAt).toLocaleDateString("en-GB") : "None"],
                ].map(([label, value]) => (
                  <article key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>{label}</p>
                    <p className="mt-3 text-2xl text-white">{value}</p>
                  </article>
                ))}
              </section>

              <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p className="text-sm leading-7 text-white/65">{summary.summary}</p>
                {summary.latestDossier ? (
                  <div className="mt-4 space-y-2 text-sm text-white/56">
                    <p>Case reference: {summary.latestDossier.caseReference}</p>
                    <p>Qualification state: {summary.latestDossier.qualificationStatus.replace(/_/g, " ").toLowerCase()}</p>
                    <p>Download availability: {summary.latestDossier.downloadAvailable ? "Available through the dossier route" : "Not yet available"}</p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-white/50">Not yet qualified. Evidence must first justify board-level escalation before any dossier is archived.</p>
                )}
              </section>

              <div>
                <Link href="/oversight" className="text-sm text-white/60 underline-offset-4 hover:underline">Return to Retained Oversight Command</Link>
              </div>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { requireRole } = await import("@/lib/access/require-role.server");
  const roleCheck = await requireRole(ctx, "OVERSIGHT_VIEW");
  if ("redirect" in roleCheck) return { redirect: roleCheck.redirect };

  const { session, access } = await resolvePageAccess(ctx);
  if (!access.permissions.isAuthenticated || !session?.user?.email) {
    return { props: { authenticated: false, summary: null } };
  }
  const organisationId = typeof ctx.query.organisationId === "string" ? ctx.query.organisationId : null;
  const summary = organisationId
    ? await loadBoardroomArchiveCommandSummary({ organisationId }).catch(() => null)
    : null;
  return { props: { authenticated: true, summary } };
};

export default BoardroomArchivePage;

