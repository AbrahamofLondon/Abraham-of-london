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

// ─── Types ─────────────────────────────────────────────────────────────────

type PublicAnchorEntry = {
  version: number;
  scope: string;
  merkleRoot: string;
  leafCount: number;
  computedAt: string;
};

type PageProps = {
  anchors: PublicAnchorEntry[];
  generatedAt: string;
};

// ─── Design tokens ─────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─── Server-side data loading ──────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<PageProps> = async () => {
  let anchors: PublicAnchorEntry[] = [];

  try {
    // Attempt to load persisted anchors from AuditEvent metadata
    const { prisma } = await import("@/lib/prisma.server");
    const rows = await (prisma as any).auditEvent.findMany({
      where: { objectType: "PROVENANCE_ANCHOR" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { metadata: true, createdAt: true },
    });

    anchors = rows
      .map((row: { metadata: unknown; createdAt: Date }) => {
        const meta = row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {};
        const merkleRoot = typeof meta.merkleRoot === "string" ? meta.merkleRoot : null;
        if (!merkleRoot) return null;

        return {
          version: typeof meta.version === "number" ? meta.version : 1,
          scope: typeof meta.scope === "string" ? meta.scope : "UNKNOWN",
          merkleRoot,
          leafCount: typeof meta.leafCount === "number" ? meta.leafCount : 0,
          computedAt: typeof meta.computedAt === "string"
            ? meta.computedAt
            : row.createdAt.toISOString(),
        };
      })
      .filter((entry: PublicAnchorEntry | null): entry is PublicAnchorEntry => entry !== null);
  } catch {
    // No anchors persisted yet — show empty state
  }

  return {
    props: {
      anchors,
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

const AnchorLogPage: NextPage<PageProps> = ({ anchors, generatedAt }) => {
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

          {/* Anchors */}
          {anchors.length === 0 ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "2rem", textAlign: "center" }}>
              <Layers className="mx-auto h-8 w-8" style={{ color: `${GOLD}60` }} />
              <p style={{ marginTop: "1rem", ...serif, fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.60)" }}>
                No provenance anchors have been published yet.
              </p>
              <p style={{ marginTop: "0.5rem", ...serif, fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.40)" }}>
                Anchors will appear here once batch Merkle root computation is active.
              </p>
            </section>
          ) : (
            <div className="space-y-4">
              {anchors.map((anchor, index) => (
                <section
                  key={`${anchor.scope}-${anchor.computedAt}-${index}`}
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}
                >
                  <div className="grid gap-3" style={{ gridTemplateColumns: "auto 1fr" }}>
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
                    <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", minWidth: "80px" }}>
                      Merkle Root
                    </div>
                    <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.70)", wordBreak: "break-all" }}>
                      <Hash className="inline h-3 w-3 mr-1" style={{ color: `${GOLD}70` }} />
                      {truncateHash(anchor.merkleRoot)}
                      <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)", marginLeft: "0.5rem" }}>
                        {anchor.merkleRoot}
                      </span>
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
            <div className="mt-4">
              <Link href="/provenance/sample-export" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}>
                View sample provenance summary
              </Link>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default AnchorLogPage;
