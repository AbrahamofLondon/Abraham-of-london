import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";
import { trackLaunch } from "@/lib/analytics/client-launch-events";
import OutcomeVerificationPanel from "@/components/outcomes/OutcomeVerificationPanel";
import { resolvePageAccess } from "@/lib/access/server";
import type { OutcomeVerificationContext } from "@/lib/product/outcome-verification-contract";
import { generateProofPack, type ProofPack } from "@/lib/product/proof-pack-generator";
import { loadOutcomeVerificationContext } from "@/lib/product/outcome-verification-service";

type Props = {
  authenticated: boolean;
  pack: ProofPack | null;
  outcomeContext: OutcomeVerificationContext | null;
  outcomeToken: string | null;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const ProofPackPage: NextPage<Props> = ({ authenticated, pack, outcomeContext, outcomeToken }) => {
  React.useEffect(() => {
    trackLaunch("proof_pack_viewed", "proof_pack");
  }, [authenticated, pack]);

  if (!authenticated) {
    return (
      <Layout title="Proof Pack" description="Account proof pack" fullWidth>
        <Head><meta name="robots" content="noindex,nofollow" /></Head>
        <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
          <div className="mx-auto max-w-3xl">
            <p className="text-white/70">Sign in to view your proof pack.</p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Proof Pack" description="Durable record of action, evidence, and follow-up." fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-5xl space-y-6">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
              Proof Pack
            </p>
            <h1 className="mt-3 text-3xl text-white">Portable governed-chain record.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
              A portable, client-safe record of the governed chain where the case has sufficient history: evidence posture, review state, delivery and outcome record, and internal chain anchor where available.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/40">
              Use this when a board, sponsor, counterparty, or reviewer needs a client-safe record of what was evidenced, reviewed, delivered, and carried forward. This pack does not replace verification, counsel review, or retained oversight.
            </p>
            {pack ? <p className="mt-4 text-sm text-white/30">Generated {new Date(pack.generatedAt).toLocaleString("en-GB")} for {pack.ownerEmail}.</p> : null}

            {/* Chain cues — source labels and export boundary */}
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "grid", gap: "6px" }}>
              {[
                { label: "Record type", value: "Governed chain record — client-safe view" },
                { label: "Evidence posture", value: pack?.retainedOutcomeHistory?.evidencePosture ?? "Establishing" },
                { label: "Export boundary", value: "This pack does not expose respondent text, operator notes, or internal trigger mechanics." },
                { label: "Provenance status", value: (pack?.oversightCycles?.count ?? 0) > 0 ? "Chain anchor available — view provenance sample for record detail" : "Provenance status will appear when this case has a chain-anchored record." },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", gap: "14px" }}>
                  <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(201,169,110,0.55)", minWidth: "120px", flexShrink: 0, paddingTop: "1px" }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.38)" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </header>

          {outcomeToken ? (
            <OutcomeVerificationPanel
              context={outcomeContext}
              token={outcomeToken}
            />
          ) : null}

          {pack ? (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  pack.diagnosticsCompleted,
                  pack.evidenceCaptured,
                  pack.contradictionsDetected,
                  pack.checkpointsCreated,
                  pack.checkpointResponses,
                  pack.outcomesVerified,
                  pack.decisionVelocityTrend,
                  pack.counselReviews,
                  pack.oversightCycles,
                ].map((item) => (
                  <article key={item.label} style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl text-white">{item.count}</p>
                    <p className="mt-3 text-sm text-white/60">{item.note}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[#C9A96E]" style={mono}>
                      {item.posture}
                    </p>
                  </article>
                ))}
              </section>

              <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
                  Retained Outcome History
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  {pack.retainedOutcomeHistory.thinState
                    ? "Outcome history is thin."
                    : `${pack.retainedOutcomeHistory.confirmedOutcomes} confirmed, ${pack.retainedOutcomeHistory.blockedOutcomes} blocked, ${pack.retainedOutcomeHistory.abandonedOutcomes} abandoned, ${pack.retainedOutcomeHistory.disputedFindings} disputed.`}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#C9A96E]" style={mono}>
                  {pack.retainedOutcomeHistory.evidencePosture}
                  {pack.retainedOutcomeHistory.latestOutcomeDate ? ` · ${new Date(pack.retainedOutcomeHistory.latestOutcomeDate).toLocaleDateString("en-GB")}` : ""}
                </p>
              </section>

              <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
                  Summary
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">{pack.summary}</p>
              </section>

              {/* Forward actions */}
              <section className="border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
                  Next Actions
                </p>
                <p className="mt-3 text-sm leading-7 text-white/50">
                  This proof pack preserves what the system can safely show. It does not replace verification, counsel review, or retained oversight.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <Link
                    href="/diagnostics/fast"
                    className="flex items-center justify-between border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.15]"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
                      Test another decision
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#C9A96E]" />
                  </Link>

                  {pack.outcomesVerified.count > 0 && pack.outcomesVerified.posture === "VERIFIED" && (
                    <Link
                      href="/decision-centre"
                      className="flex items-center justify-between border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.15]"
                    >
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
                        View Decision Centre
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#C9A96E]" />
                    </Link>
                  )}

                  <Link
                    href="/evidence/standards"
                    className="flex items-center justify-between border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.15]"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
                      View Evidence Standards
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#C9A96E]" />
                  </Link>
                </div>
              </section>

              {/* ── PDF Download ── */}
              <section className="border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
                  Export
                </p>
                <p className="mt-3 text-sm leading-7 text-white/50">
                  Download a durable PDF of your proof pack.
                </p>
                <button
                  className="mt-4 border border-amber-500/30 bg-amber-500/10 px-5 py-2 text-sm text-amber-200 transition-colors hover:bg-amber-500/20"
                  onClick={() => {
                    fetch("/api/pdf/proof-pack", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: pack.ownerEmail }),
                    })
                      .then((r) => {
                        if (!r.ok) throw new Error("PDF generation failed");
                        return r.blob();
                      })
                      .then((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `proof-pack-${pack.ownerEmail.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      })
                      .catch(() => {
                        alert("PDF generation failed. Admin access may be required.");
                      });
                  }}
                >
                  Download PDF
                </button>
              </section>
            </>
          ) : (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/60">No proof pack could be assembled yet.</p>
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { requireRole } = await import("@/lib/access/require-role.server");
  const roleCheck = await requireRole(ctx, "PROOF_VIEW");
  if ("redirect" in roleCheck) return { redirect: roleCheck.redirect };

  const { session, access } = await resolvePageAccess(ctx);
  const email = typeof session?.user?.email === "string" ? session.user.email.toLowerCase() : null;
  const userId = typeof session?.user?.id === "string" ? session.user.id : null;
  const outcomeToken = typeof ctx.query.outcomeToken === "string" ? ctx.query.outcomeToken : null;

  if (!access.permissions.isAuthenticated || !email) {
    return {
      props: {
        authenticated: false,
        pack: null,
        outcomeContext: null,
        outcomeToken,
      },
    };
  }

  const [pack, outcomeContext] = await Promise.all([
    generateProofPack({ email, userId }),
    outcomeToken
      ? loadOutcomeVerificationContext({ email, userId, token: outcomeToken })
      : Promise.resolve(null),
  ]);

  return {
    props: {
      authenticated: true,
      pack,
      outcomeContext,
      outcomeToken,
    },
  };
};

export default ProofPackPage;
