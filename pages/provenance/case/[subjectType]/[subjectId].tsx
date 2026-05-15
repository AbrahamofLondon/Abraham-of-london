import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SendToSelfForm from "@/components/tools/SendToSelfForm";
import { resolvePageAccess } from "@/lib/access/server";
import { loadClientSafeProvenance } from "@/lib/admin/client-safe-provenance-composer";
import { authorizeClientSafeProvenanceSubject } from "@/lib/product/client-safe-provenance-access";
import {
  CLIENT_SAFE_PROVENANCE_SAMPLE_ROUTE,
  type ClientSafeProvenanceSummary,
} from "@/lib/product/client-safe-provenance-contract";

type PageProps = {
  subjectType: string;
  subjectId: string;
  summary: ClientSafeProvenanceSummary | null;
  unavailableReason: string | null;
};

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function label(value: string): string {
  return value.replace(/_/g, " ").toLowerCase();
}

const ClientSafeProvenanceCasePage: NextPage<PageProps> = ({
  subjectType,
  subjectId,
  summary,
  unavailableReason,
}) => {
  return (
    <Layout
      title="Client-Safe Provenance Summary | Abraham of London"
      description="Authenticated client-safe provenance summary for a supported governed record."
      canonicalUrl={`/provenance/case/${encodeURIComponent(subjectType)}/${encodeURIComponent(subjectId)}`}
      fullWidth
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-4xl space-y-6">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Client-safe provenance
            </p>
            <h1 style={{ ...serif, marginTop: "0.75rem", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", lineHeight: 1.05, color: "rgba(255,255,255,0.92)" }}>
              Case-specific summary
            </h1>
            <p style={{ ...mono, marginTop: "0.9rem", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
              {label(subjectType)} · {subjectId}
            </p>
          </header>

          {!summary ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
              <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.68)" }}>
                {unavailableReason ?? "Case-specific client-safe provenance is not available for this subject."}
              </p>
              <p style={{ ...mono, marginTop: "0.8rem", fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                Public samples remain available separately from live case records.
              </p>
            </section>
          ) : (
            <>
              <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Accountability statement
                </p>
                <p style={{ ...serif, marginTop: "0.8rem", fontSize: "1.08rem", lineHeight: 1.7, color: "rgba(255,255,255,0.76)" }}>
                  {summary.accountabilityStatement}
                </p>
              </section>

              <section className="grid gap-3 md:grid-cols-3">
                <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    Delivery posture
                  </p>
                  <p style={{ ...serif, marginTop: "0.45rem", fontSize: "1rem", color: "rgba(255,255,255,0.70)" }}>
                    {label(summary.deliveryPosture)}
                  </p>
                </div>
                <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    Outcome posture
                  </p>
                  <p style={{ ...serif, marginTop: "0.45rem", fontSize: "1rem", color: "rgba(255,255,255,0.70)" }}>
                    {label(summary.outcomePosture)}
                  </p>
                </div>
                <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    Gap posture
                  </p>
                  <p style={{ ...serif, marginTop: "0.45rem", fontSize: "1rem", color: "rgba(255,255,255,0.70)" }}>
                    {summary.gapCount} gap{summary.gapCount === 1 ? "" : "s"}
                  </p>
                  {summary.gapClasses.length > 0 && (
                    <p style={{ ...mono, marginTop: "0.25rem", fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                      {summary.gapClasses.map(label).join(" · ")}
                    </p>
                  )}
                </div>
              </section>

              <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Confidence bands
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {summary.confidenceBands.length === 0 ? (
                    <p style={{ ...serif, color: "rgba(255,255,255,0.48)" }}>No confidence bands recorded.</p>
                  ) : summary.confidenceBands.map((band) => (
                    <div key={band.level} style={{ borderLeft: `1px solid ${GOLD}55`, paddingLeft: "0.75rem" }}>
                      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                        {label(band.level)}
                      </p>
                      <p style={{ ...serif, marginTop: "0.25rem", color: "rgba(255,255,255,0.72)" }}>
                        {band.count}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Milestone timeline
                </p>
                <div className="mt-4 space-y-3">
                  {summary.timelineSummary.length === 0 ? (
                    <p style={{ ...serif, color: "rgba(255,255,255,0.48)" }}>No client-safe milestones recorded.</p>
                  ) : summary.timelineSummary.map((entry) => (
                    <div key={`${entry.milestone}-${entry.occurredAt ?? "pending"}`} style={{ borderLeft: `1px solid ${GOLD}55`, paddingLeft: "0.75rem" }}>
                      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                        {entry.occurredAt ? new Date(entry.occurredAt).toLocaleString("en-GB") : "Date unavailable"}
                      </p>
                      <p style={{ ...serif, marginTop: "0.25rem", color: "rgba(255,255,255,0.72)" }}>
                        {entry.label}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Hash-verifiable summary
                </p>
                <p style={{ ...mono, marginTop: "0.7rem", fontSize: "10px", color: "rgba(255,255,255,0.68)", wordBreak: "break-all" }}>
                  {summary.provenanceHash}
                </p>
                <p style={{ ...mono, marginTop: "0.7rem", fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                  Composed {new Date(summary.composedAt).toLocaleString("en-GB")}
                </p>
              </section>

              <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
                <SendToSelfForm
                  source="client_safe_provenance"
                  isLiveRecord={true}
                  content={{
                    title: `Provenance summary — ${subjectType} · ${subjectId}`,
                    summary: summary.accountabilityStatement,
                    nextMove: "",
                    subjectType,
                    subjectId,
                  }}
                />
              </section>
            </>
          )}

          <section style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.5rem" }}>
              Boundary
            </p>
            <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)" }}>
              This client-safe summary excludes raw governance events, operator notes, suppression details, actor IDs, raw evidence, and internal links. External WORM or public blockchain anchoring is not configured.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={CLIENT_SAFE_PROVENANCE_SAMPLE_ROUTE}
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}
              >
                View public sample
              </Link>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { session, access } = await resolvePageAccess(ctx);
  if (!access.permissions.isAuthenticated || !session?.user?.email) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  const subjectType = typeof ctx.params?.subjectType === "string" ? ctx.params.subjectType : "";
  const subjectId = typeof ctx.params?.subjectId === "string" ? ctx.params.subjectId : "";
  const authorised = await authorizeClientSafeProvenanceSubject({
    subjectType,
    subjectId,
    viewerEmail: session.user.email,
    viewerIsAdmin: access.permissions.isAdmin,
  });

  if (!authorised.ok) {
    const unavailableReason = authorised.reason === "UNSUPPORTED_SUBJECT_TYPE"
      ? "Case-specific client-safe provenance is not available for this subject type yet."
      : authorised.reason === "SUBJECT_NOT_FOUND"
        ? "No supported provenance subject was found for this reference."
        : "This case-specific provenance summary is not available to the current account.";
    return {
      props: {
        subjectType,
        subjectId,
        summary: null,
        unavailableReason,
      },
    };
  }

  const summary = await loadClientSafeProvenance({
    subjectType: authorised.subjectType,
    subjectId: authorised.subjectId,
  });

  return {
    props: {
      subjectType: authorised.subjectType,
      subjectId: authorised.subjectId,
      summary,
      unavailableReason: null,
    },
  };
};

export default ClientSafeProvenanceCasePage;
