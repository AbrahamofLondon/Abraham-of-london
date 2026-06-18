import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import {
  buildProductAuthorityBackboneReport,
  type ProductAuthorityBackboneRecord,
} from "@/lib/product/product-qualification-backbone";

type ProductRow = {
  product: string;
  productCode: string;
  productFamily: string;
  authorityState: string;
  evidenceState: string;
  validationState: string;
  v2State: string;
  antiToyState: string;
  redTeamState: string;
  genericAiState: string;
  marketState: string;
  fulfilmentState: string;
  releaseState: string;
  publicClaimPermission: boolean;
  blockerSummary: string[];
  nextRequiredEvidence: string[];
};

type Props = {
  generatedAt: string;
  summary: ReturnType<typeof buildProductAuthorityBackboneReport>["summary"];
  rows: ProductRow[];
};

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const GOLD = "#C9A96E";
const DIM = "rgba(242,241,238,0.55)";
const RULE = "rgba(255,255,255,0.08)";

function tone(value: string): string {
  if (value === "authority_cleared" || value === "passed" || value === "verified" || value === "proof_attached") {
    return "#4ade80";
  }
  if (value === "blocked" || value === "failed" || value === "missing" || value === "missing_source") {
    return "#ef4444";
  }
  if (value === "evidence_incomplete" || value === "revalidation_required" || value === "insufficient" || value === "requires_product_review") {
    return "#facc15";
  }
  if (value === "not_release_eligible" || value === "not_claim_eligible" || value === "not_applicable") {
    return "#94a3b8";
  }
  return "#60a5fa";
}

function summarize(product: ProductAuthorityBackboneRecord): ProductRow {
  return {
    product: product.productName,
    productCode: product.productId,
    productFamily: product.productFamily,
    authorityState: product.authorityClearance.state,
    evidenceState: product.evidence.evidenceState,
    validationState: product.validationState,
    v2State: product.v2Revalidation.revalidationStatus,
    antiToyState: product.antiToy.state,
    redTeamState: product.redTeam.state,
    genericAiState: product.genericAiComparison.state,
    marketState: product.marketComparison.state,
    fulfilmentState: product.fulfilmentQualification.state,
    releaseState: product.releaseFirewall.state,
    publicClaimPermission: product.authorityClearance.publicClaimPermission,
    blockerSummary: product.blockerSummary,
    nextRequiredEvidence: product.nextRequiredEvidence,
  };
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  const report = buildProductAuthorityBackboneReport();

  return {
    props: {
      generatedAt: report.generatedAt,
      summary: report.summary,
      rows: report.products.map(summarize),
    },
  };
};

export default function ProductAuthorityPage({ generatedAt, summary, rows }: Props) {
  const [search, setSearch] = React.useState("");
  const [blockedOnly, setBlockedOnly] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !q ||
        row.product.toLowerCase().includes(q) ||
        row.productCode.toLowerCase().includes(q) ||
        row.productFamily.toLowerCase().includes(q);
      const matchesBlocked = !blockedOnly ||
        row.authorityState === "blocked" ||
        row.authorityState === "evidence_incomplete" ||
        row.authorityState === "revalidation_required";
      return matchesSearch && matchesBlocked;
    });
  }, [blockedOnly, rows, search]);

  return (
    <AdminLayout>
      <Head>
        <title>Product Authority | Admin</title>
      </Head>

      <div style={{ padding: "24px 32px", maxWidth: 1800 }}>
        <BackToOperatorCommandCentre />

        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              ...MONO,
              fontSize: 11,
              color: GOLD,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Estate · Product Authority
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8", margin: 0 }}>
            Product Authority Control Surface
          </h1>
          <p style={{ fontSize: 13, color: DIM, marginTop: 8 }}>
            {rows.length} products resolved through the evidence qualification backbone.{" "}
            {summary.explicitEvidenceObjects} explicit evidence objects,{" "}
            {summary.productsWithLedgerEntries} ledger entries,{" "}
            {summary.productsWithExplicitMissingLedgerStates} explicit missing-ledger states,{" "}
            {summary.authorityCleared} authority-cleared,{" "}
            {summary.publicClaimPermissionEnabled} public-claim enabled.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            ["Evidence Objects", `${summary.explicitEvidenceObjects}`],
            ["Ledger Entries", `${summary.productsWithLedgerEntries}`],
            ["Authority Cleared", `${summary.authorityCleared}`],
            ["Evidence Incomplete", `${summary.evidenceIncomplete}`],
            ["Generic-AI Coverage", `${summary.genericAiCoverage}`],
            ["Public Claims", `${summary.publicClaimPermissionEnabled}`],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                border: `1px solid ${RULE}`,
                padding: "12px 14px",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ ...MONO, fontSize: 10, color: DIM, textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 22, color: "#f5f0e8", marginTop: 6 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, code, or family"
            style={{
              ...MONO,
              width: 320,
              padding: "8px 12px",
              fontSize: 11,
              border: `1px solid ${RULE}`,
              background: "rgba(255,255,255,0.03)",
              color: "#f5f0e8",
              outline: "none",
            }}
          />
          <label style={{ ...MONO, fontSize: 11, color: DIM, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={blockedOnly}
              onChange={(event) => setBlockedOnly(event.target.checked)}
              style={{ accentColor: GOLD }}
            />
            Show authority-blocking rows only
          </label>
        </div>

        <div style={{ overflowX: "auto", border: `1px solid ${RULE}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", ...MONO, fontSize: 10 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${RULE}`, color: DIM, textTransform: "uppercase" }}>
                {[
                  "Product",
                  "Family",
                  "Authority",
                  "Evidence",
                  "Validation",
                  "V2",
                  "Anti-Toy",
                  "Red-Team",
                  "Generic-AI",
                  "Market",
                  "Fulfilment",
                  "Release",
                  "Public Claim",
                  "Blockers",
                  "Next Required Evidence",
                ].map((label) => (
                  <th key={label} style={{ padding: "10px 12px", textAlign: "left", whiteSpace: "nowrap" }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.productCode} style={{ borderBottom: `1px solid ${RULE}`, color: "#f5f0e8" }}>
                  <td style={{ padding: "10px 12px", minWidth: 220 }}>
                    <div>{row.product}</div>
                    <div style={{ color: DIM, marginTop: 4 }}>{row.productCode}</div>
                  </td>
                  <td style={{ padding: "10px 12px", color: DIM, minWidth: 160 }}>{row.productFamily}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.authorityState), minWidth: 140 }}>{row.authorityState}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.evidenceState) }}>{row.evidenceState}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.validationState) }}>{row.validationState}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.v2State) }}>{row.v2State}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.antiToyState) }}>{row.antiToyState}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.redTeamState) }}>{row.redTeamState}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.genericAiState) }}>{row.genericAiState}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.marketState) }}>{row.marketState}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.fulfilmentState) }}>{row.fulfilmentState}</td>
                  <td style={{ padding: "10px 12px", color: tone(row.releaseState) }}>{row.releaseState}</td>
                  <td style={{ padding: "10px 12px", color: row.publicClaimPermission ? "#4ade80" : "#ef4444" }}>
                    {row.publicClaimPermission ? "enabled" : "denied"}
                  </td>
                  <td style={{ padding: "10px 12px", minWidth: 320, color: DIM }}>
                    {row.blockerSummary.length > 0 ? row.blockerSummary.slice(0, 3).join(" | ") : "None"}
                  </td>
                  <td style={{ padding: "10px 12px", minWidth: 320, color: DIM }}>
                    {row.nextRequiredEvidence.length > 0 ? row.nextRequiredEvidence.slice(0, 3).join(" | ") : "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 18, ...MONO, fontSize: 10, color: DIM }}>
          Generated: {generatedAt}
        </div>
      </div>
    </AdminLayout>
  );
}
