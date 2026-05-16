import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import { loadSharedCaseByToken } from "@/lib/product/case-sharing";
import {
  CASE_SHARE_BOUNDARY_NOTE,
  type CaseShareRecord,
  type SharedCaseView,
} from "@/lib/product/case-sharing-contract";
import type { SharedCaseVerifyResult } from "@/lib/product/case-sharing-provenance";

type Props = {
  token: string;
  state: "ACTIVE" | "EXPIRED" | "REVOKED" | "INVALID";
  share: Omit<CaseShareRecord, "tokenHash" | "ownerEmail"> | null;
  view: SharedCaseView | null;
};

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const SharedCasePage: NextPage<Props> = ({ token, state, share, view }) => {
  const [verification, setVerification] = React.useState<SharedCaseVerifyResult | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState("");
  const [exportError, setExportError] = React.useState("");

  async function verifyIntegrity() {
    setVerifying(true);
    setVerifyError("");
    try {
      const response = await fetch(`/api/cases/share/verify?token=${encodeURIComponent(token)}`);
      const data = await response.json() as { ok?: boolean; verification?: SharedCaseVerifyResult; error?: string };
      if (!response.ok || !data.ok || !data.verification) {
        throw new Error(data.error ?? "Verification failed.");
      }
      setVerification(data.verification);
    } catch (error) {
      setVerifyError(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  async function exportClientSafeEvidence() {
    setExportError("");
    try {
      const response = await fetch(`/api/cases/share/export?token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Export failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `shared-case-${view?.caseRef ?? "export"}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    }
  }

  const unavailableCopy = state === "EXPIRED"
    ? "This shared case link has expired."
    : state === "REVOKED"
      ? "This shared case link has been revoked by the owner."
      : "This shared case link is unavailable.";

  return (
    <Layout title="Shared Case | Abraham of London" description="Client-safe shared governed case record." fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-3xl space-y-5">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Shared governed case
            </p>
            <h1 style={{ ...serif, marginTop: "0.75rem", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "rgba(255,255,255,0.90)" }}>
              {view?.title ?? "Shared case unavailable"}
            </h1>
            {share && view && (
              <p style={{ ...mono, marginTop: "0.75rem", fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                {view.caseRef} · {share.role.toLowerCase()} · expires {new Date(share.expiresAt).toLocaleDateString("en-GB")}
              </p>
            )}
          </header>

          {!view || !share ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
              <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.68)" }}>
                {unavailableCopy}
              </p>
            </section>
          ) : (
            <>
              <section style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Client-safe summary
                </p>
                <p style={{ ...serif, marginTop: "0.65rem", fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.70)" }}>
                  {view.summary}
                </p>
              </section>

              <section className="grid gap-3 md:grid-cols-2">
                <SharedField label="Status" value={view.status.replace(/_/g, " ").toLowerCase()} />
                <SharedField label="Evidence posture" value={(view.evidencePosture ?? "unavailable").replace(/_/g, " ").toLowerCase()} />
                <SharedField label="Provenance status" value={view.provenanceStatus.replace(/_/g, " ").toLowerCase()} />
                <SharedField label="Shared role" value={share.role.toLowerCase()} />
              </section>

              {view.governanceImplication && (
                <SharedNarrative label="Governance implication" value={view.governanceImplication} />
              )}
              {view.nextAction && (
                <SharedNarrative label="Next action" value={view.nextAction} />
              )}

              <section style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Reviewer actions
                </p>
                <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", marginTop: "0.8rem" }}>
                  {view.canVerify ? (
                    <button type="button" onClick={verifyIntegrity} disabled={verifying}
                      style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: verifying ? "rgba(255,255,255,0.24)" : "#0A0A0A", backgroundColor: verifying ? "rgba(255,255,255,0.08)" : GOLD, border: "none", padding: "0.6rem 0.9rem", cursor: verifying ? "not-allowed" : "pointer" }}>
                      {verifying ? "Verifying…" : "Verify integrity"}
                    </button>
                  ) : (
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.34)" }}>
                      {share.role === "AUDITOR"
                        ? "Verification is not yet available for this record type."
                        : "Verification is available only to auditor links."}
                    </p>
                  )}
                  {view.canExport && (
                    <button type="button" onClick={exportClientSafeEvidence}
                      style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}28`, backgroundColor: "transparent", padding: "0.6rem 0.9rem", cursor: "pointer" }}>
                      Export client-safe evidence
                    </button>
                  )}
                </div>
                {verification && (
                  <p style={{ marginTop: "0.75rem", fontSize: "12px", color: verification.status === "MATCH" ? "rgba(110,231,183,0.72)" : "rgba(252,165,165,0.72)" }}>
                    {verification.message}
                  </p>
                )}
                {verifyError && <p style={{ marginTop: "0.75rem", fontSize: "11px", color: "rgba(252,165,165,0.72)" }}>{verifyError}</p>}
                {exportError && <p style={{ marginTop: "0.75rem", fontSize: "11px", color: "rgba(252,165,165,0.72)" }}>{exportError}</p>}
              </section>
            </>
          )}

          <section style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.45rem" }}>
              Boundary note
            </p>
            <p style={{ fontSize: "12px", lineHeight: 1.7, color: "rgba(255,255,255,0.42)" }}>
              {CASE_SHARE_BOUNDARY_NOTE}
            </p>
          </section>
        </div>
      </main>
    </Layout>
  );
};

function SharedField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
        {label}
      </p>
      <p style={{ ...serif, marginTop: "0.45rem", fontSize: "1rem", color: "rgba(255,255,255,0.70)" }}>
        {value}
      </p>
    </div>
  );
}

function SharedNarrative({ label, value }: { label: string; value: string }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
        {label}
      </p>
      <p style={{ ...serif, marginTop: "0.65rem", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.64)" }}>
        {value}
      </p>
    </section>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const token = typeof ctx.params?.token === "string" ? ctx.params.token : "";
  const result = token ? await loadSharedCaseByToken(token) : { state: "INVALID" as const, share: null, view: null };

  return {
    props: {
      token,
      state: result.state,
      share: result.share
        ? {
            id: result.share.id,
            caseId: result.share.caseId,
            recipientEmail: result.share.recipientEmail,
            role: result.share.role,
            status: result.share.status,
            allowExport: result.share.allowExport,
            expiresAt: result.share.expiresAt,
            createdAt: result.share.createdAt,
            revokedAt: result.share.revokedAt ?? null,
          }
        : null,
      view: result.view,
    },
  };
};

export default SharedCasePage;
