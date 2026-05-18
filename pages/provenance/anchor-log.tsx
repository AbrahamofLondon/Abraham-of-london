/**
 * pages/provenance/anchor-log.tsx
 *
 * Public provenance anchor log. Displays cryptographic Merkle roots only.
 * No client data, evidence, decisions, suppression details, actor data,
 * or internal review material is exposed.
 *
 * These anchors disclose cryptographic roots only. They do not reveal
 * client data, evidence, decisions, or internal review material.
 *
 * External WORM/public anchoring is not yet configured.
 */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Shield, Clock, Hash, Layers } from "lucide-react";

import Layout from "@/components/Layout";
import SurfaceBoundaryPanel from "@/components/product/SurfaceBoundaryPanel";
import { trackLaunch } from "@/lib/analytics/client-launch-events";
import {
  buildPublicAnchorLogState,
  toPublicAnchorEntries,
  type PublicAnchorEntry,
  type PublicAnchorLogState,
} from "@/lib/admin/public-anchor-log-state";

type PageProps = {
  anchors: PublicAnchorEntry[];
  state: PublicAnchorLogState;
  generatedAt: string;
};

// ─── Design tokens ─────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─── Server-side data loading ──────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<PageProps> = async () => {
  let anchors: PublicAnchorEntry[] = [];
  let internalAnchoringAvailable: boolean | null = null;

  try {
    // Attempt to load persisted anchors from AuditEvent metadata
    const { prisma } = await import("@/lib/prisma.server");
    const [rows, internalAnchor] = await Promise.all([
      (prisma as any).auditEvent.findMany({
        where: { objectType: "PROVENANCE_ANCHOR" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { metadata: true, createdAt: true },
      }),
      prisma.provenanceChainAnchor.findFirst({
        select: { id: true },
      }),
    ]);

    internalAnchoringAvailable = Boolean(internalAnchor);

    anchors = toPublicAnchorEntries(rows);
  } catch {
    // No anchors persisted yet — show empty state
  }

  return {
    props: {
      anchors,
      state: buildPublicAnchorLogState({
        publicRootsCount: anchors.length,
        latestPublicRootAt: anchors[0]?.computedAt ?? null,
        internalAnchoringAvailable,
      }),
      generatedAt: new Date().toISOString(),
    },
  };
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

// ─── Page ──────────────────────────────────────────────────────────────────

function internalAnchoringLabel(value: PublicAnchorLogState["internalAnchoringAvailable"]): string {
  if (value === true) return "Observed in internal ledger";
  if (value === false) return "No internal anchors observed";
  return "Not observable from this page";
}

const AnchorLogPage: NextPage<PageProps> = ({ anchors, state, generatedAt }) => {
  React.useEffect(() => {
    trackLaunch("anchor_log_viewed", "public_anchor_log");
  }, [anchors.length]);

  return (
    <Layout
      title="Provenance Anchor Log | Abraham of London"
      description="Public provenance chain anchor log — cryptographic Merkle roots for governed decision verification."
      canonicalUrl="/provenance/anchor-log"
      fullWidth
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" style={{ color: GOLD }} />
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Provenance Anchor Log
              </p>
            </div>
            <h1 style={{ ...serif, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.05, color: "rgba(255,255,255,0.92)" }}>
              Cryptographic integrity anchors
            </h1>
            <p style={{ marginTop: "1rem", ...serif, fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", maxWidth: "48ch" }}>
              These anchors disclose cryptographic roots only. They do not reveal client data, evidence, decisions, or internal review material.
            </p>
            <p style={{ marginTop: "0.5rem", ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)" }}>
              External WORM/public anchoring is not yet configured.
            </p>
            <p style={{ marginTop: "0.5rem", ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.20)" }}>
              Generated: {formatDate(generatedAt)}
            </p>
          </header>

          <SurfaceBoundaryPanel
            surfaceType="PUBLIC_SAMPLE"
            recordCreated="No case record is created by viewing this public status surface."
            systemReads={[
              "Whether public roots have been deliberately published",
              "Observed internal chain-anchor availability",
              "Whether external anchoring is configured",
            ]}
            nextAction={{ label: "Create your governed case", href: "/diagnostics/fast" }}
            secondaryAction={{ label: "View client-safe provenance sample", href: "/provenance/sample-export" }}
          />

          {/* How to read this page */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.75rem" }}>
              How to read this page
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}88` }}>
                  Internal chain anchor
                </p>
                <p style={{ marginTop: "0.35rem", ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.52)" }}>
                  Created inside the platform for supported governed records.
                </p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}88` }}>
                  Public root
                </p>
                <p style={{ marginTop: "0.35rem", ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.52)" }}>
                  A deliberately published non-sensitive cryptographic root.
                </p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}88` }}>
                  External anchoring
                </p>
                <p style={{ marginTop: "0.35rem", ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.52)" }}>
                  WORM or public blockchain anchoring is not configured yet.
                </p>
              </div>
            </div>
          </section>

          {/* Anchoring status */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.75rem" }}>
              Anchoring status
            </p>
            <div className="grid gap-px md:grid-cols-3" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <div style={{ backgroundColor: "rgb(3,3,5)", padding: "0.85rem 0.95rem" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}88` }}>
                  Internal chain anchoring
                </p>
                <p
                  style={{
                    marginTop: "0.35rem",
                    ...serif,
                    fontSize: "0.88rem",
                    lineHeight: 1.55,
                    color: state.internalAnchoringAvailable === true
                      ? "rgba(110,231,183,0.65)"
                      : "rgba(255,255,255,0.38)",
                  }}
                >
                  {internalAnchoringLabel(state.internalAnchoringAvailable)}
                </p>
                <p style={{ marginTop: "0.25rem", ...mono, fontSize: "6.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)" }}>
                  Not visible publicly
                </p>
              </div>

              <div style={{ backgroundColor: "rgb(3,3,5)", padding: "0.85rem 0.95rem" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}88` }}>
                  Public anchor publication
                </p>
                <p style={{ marginTop: "0.35rem", ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: state.publicRootsCount > 0 ? "rgba(110,231,183,0.65)" : "rgba(255,255,255,0.38)" }}>
                  {state.publicRootsCount === 0
                    ? "No public roots published yet"
                    : `${state.publicRootsCount} public root${state.publicRootsCount !== 1 ? "s" : ""} visible`}
                </p>
                {state.latestPublicRootAt && (
                  <p style={{ marginTop: "0.25rem", ...mono, fontSize: "6.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)" }}>
                    Latest: {formatDate(state.latestPublicRootAt)}
                  </p>
                )}
              </div>

              <div style={{ backgroundColor: "rgb(3,3,5)", padding: "0.85rem 0.95rem" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}88` }}>
                  External anchoring
                </p>
                <p style={{ marginTop: "0.35rem", ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.38)" }}>
                  Not configured
                </p>
                <p style={{ marginTop: "0.25rem", ...mono, fontSize: "6.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.22)" }}>
                  External WORM and public anchoring are not yet active
                </p>
              </div>
            </div>
          </section>

          {/* Anchors */}
          {anchors.length === 0 ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "2rem", textAlign: "center" }}>
              <Layers className="mx-auto h-8 w-8" style={{ color: `${GOLD}60` }} />
              <p style={{ marginTop: "1rem", ...serif, fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.60)" }}>
                No public anchor roots are currently available.
              </p>
              <p style={{ marginTop: "0.5rem", ...serif, fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.40)" }}>
                This does not mean a governed case lacks an internal chain anchor. This page only shows roots deliberately published to the public anchor log. External WORM or public blockchain anchoring is not configured.
              </p>
            </section>
          ) : (
            <div className="space-y-4">
              {anchors.map((anchor, index) => (
                <section
                  key={`${anchor.scope}-${anchor.computedAt}-${index}`}
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}
                >
                  <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    {/* Scope badge */}
                    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}99`, border: `1px solid ${GOLD}30`, padding: "0.2rem 0.5rem" }}>
                        {anchor.scope}
                      </span>
                      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                        v{anchor.version}
                      </span>
                    </div>

                    {/* Merkle root */}
                    <div className="md:min-w-[80px]" style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                      Merkle Root
                    </div>
                    <div>
                      <div title={anchor.merkleRoot} style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.70)" }}>
                        <Hash className="inline h-3 w-3 mr-1" style={{ color: `${GOLD}70` }} />
                        {truncateHash(anchor.merkleRoot)}
                      </div>
                      <details style={{ marginTop: "0.35rem" }}>
                        <summary style={{ ...mono, cursor: "pointer", fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}88` }}>
                          Show full root
                        </summary>
                        <p style={{ marginTop: "0.35rem", ...mono, fontSize: "8px", lineHeight: 1.6, color: "rgba(255,255,255,0.48)", wordBreak: "break-all" }}>
                          {anchor.merkleRoot}
                        </p>
                      </details>
                    </div>

                    {/* Leaf count */}
                    <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                      Leaves
                    </div>
                    <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.70)" }}>
                      <Layers className="inline h-3 w-3 mr-1" style={{ color: `${GOLD}70` }} />
                      {anchor.leafCount}
                    </div>

                    {/* Timestamp */}
                    <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                      Computed
                    </div>
                    <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.70)" }}>
                      <Clock className="inline h-3 w-3 mr-1" style={{ color: `${GOLD}70` }} />
                      {formatDate(anchor.computedAt)}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Boundary notice */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.5rem" }}>
              Boundary
            </p>
            <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>
              These anchors disclose cryptographic roots only. They do not reveal client data, evidence, decisions, or internal review material. External WORM or public anchoring is not yet configured. Until then, these roots are stored in the platform database and are not independently anchored to an external immutable store.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/provenance/sample-export" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}>
                View client-safe provenance sample
              </Link>
              <Link href="/diagnostics/fast" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}>
                Create your governed case
              </Link>
              <Link href="/trust" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}>
                View Trust Center
              </Link>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default AnchorLogPage;
