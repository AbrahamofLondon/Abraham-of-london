/**
 * pages/admin/product-authority.tsx
 *
 * Product-Wide Authority Control Surface
 *
 * Shows all 43 products with their authority state, evidence state,
 * validation status, blocking reasons, and next action.
 *
 * Every product resolves through the same resolver. Boardroom Brief
 * appears as one row within the estate-wide picture, not as a bespoke case.
 */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import { resolveProductAuthority, getDefaultProductConfigurations } from "@/lib/product/resolve-product-authority";
import { ProductAuthorityBadge } from "@/components/product/ProductAuthorityBadge";
import type { ProductAuthorityContract } from "@/lib/product/product-authority-contract";
import { getAllProducts } from "@/lib/commercial/catalog";

type Props = {
  products: Array<{
    code: string;
    name: string;
    authorityState: string;
    evidenceState: string;
    validationSummary: string;
    blockingReasons: string[];
    nextAction: string;
    publicClaimAllowed: boolean;
    isExplicitEntry: boolean;
  }>;
};

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const GOLD = "#C9A96E";
const DIM = "rgba(242,241,238,0.35)";
const RULE = "rgba(255,255,255,0.07)";

function statusColor(state: string): string {
  if (state.startsWith("externally_proven") || state.startsWith("diagnostic") || state.startsWith("judgement")) return "#4ade80";
  if (state.startsWith("legacy_validated")) return "#facc15";
  if (state.startsWith("blocked")) return "#ef4444";
  if (state.startsWith("pending") || state.startsWith("measurement")) return "#60a5fa";
  if (state === "static_reference" || state === "internal_only") return "#a78bfa";
  return DIM;
}

function evidenceColor(state: string): string {
  if (state === "trusted_artifact_supported") return "#4ade80";
  if (state === "missing") return "#ef4444";
  if (state === "unknown") return "#facc15";
  return DIM;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  const catalogProducts = getAllProducts();
  const defaultConfigs = getDefaultProductConfigurations();
  const explicitCodes = new Set(defaultConfigs.map((c) => c.productCode));

  const products = catalogProducts.map((cat) => {
    const config = defaultConfigs.find((c) => c.productCode === cat.code);
    const contract = config
      ? resolveProductAuthority(config)
      : resolveProductAuthority({ productCode: cat.code });

    const evidenceState = contract.validation.evidenceLedgerV2Present
      ? "trusted_artifact_supported"
      : "missing";

    const passedCount = [
      contract.validation.evidenceLedgerV2Present,
      contract.validation.antiToyPassed,
      contract.validation.redTeamPassed,
      contract.validation.genericAiComparisonPassed,
      contract.validation.marketComparisonPassed,
      contract.validation.releaseFirewallPassed,
      contract.validation.constitutionPassed,
      contract.validation.noMockAuthorityPassed,
      contract.validation.antiGamingPassed,
      contract.validation.adversarialValidationPassed,
    ].filter(Boolean).length;

    return {
      code: cat.code,
      name: cat.displayName || cat.code,
      authorityState: contract.currentAuthorityState,
      evidenceState,
      validationSummary: `${passedCount}/10`,
      blockingReasons: contract.blockingReasons,
      nextAction: contract.nextEvidenceAction,
      publicClaimAllowed: contract.publicClaimAllowed,
      isExplicitEntry: explicitCodes.has(cat.code),
    };
  });

  return { props: { products } };
};

export default function ProductAuthorityPage({ products }: Props) {
  const [search, setSearch] = React.useState("");
  const [filterBlocked, setFilterBlocked] = React.useState(false);

  const filtered = React.useMemo(() => {
    let result = products;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
      );
    }
    if (filterBlocked) {
      result = result.filter((p) => p.authorityState.startsWith("blocked"));
    }
    return result;
  }, [products, search, filterBlocked]);

  const blockedCount = products.filter((p) => p.authorityState.startsWith("blocked")).length;
  const explicitCount = products.filter((p) => p.isExplicitEntry).length;

  return (
    <AdminLayout>
      <Head><title>Product Authority | Admin</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 1400 }}>
        <BackToOperatorCommandCentre />

        <div style={{ marginBottom: 24 }}>
          <p style={{ ...MONO, fontSize: 11, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            Estate · Product Authority
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8" }}>Product Authority Control Surface</h1>
          <p style={{ fontSize: 13, color: DIM, marginTop: 6 }}>
            All {products.length} products resolved through the unified authority system.
            {explicitCount} with explicit authority entries, {products.length - explicitCount} default-resolved.
            {blockedCount} blocked.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...MONO, fontSize: 11, padding: "6px 12px",
              background: "rgba(255,255,255,0.04)", border: `1px solid ${RULE}`,
              color: "#f5f0e8", outline: "none", width: 280,
            }}
          />
          <label style={{ ...MONO, fontSize: 10, color: DIM, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={filterBlocked}
              onChange={(e) => setFilterBlocked(e.target.checked)}
              style={{ accentColor: GOLD }}
            />
            Blocked only ({blockedCount})
          </label>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", ...MONO, fontSize: 10 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${RULE}`, color: DIM, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Product</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Code</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Source</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Authority</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Evidence</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Validation</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Public Claim</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Blocking / Next Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.code} style={{ borderBottom: `1px solid ${RULE}`, color: "#f5f0e8" }}>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{p.name}</td>
                  <td style={{ padding: "10px 12px", color: DIM }}>{p.code}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: p.isExplicitEntry ? GOLD : DIM }}>
                      {p.isExplicitEntry ? "explicit" : "default"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <ProductAuthorityBadge
                      productCode={p.code}
                      currentAuthorityState={p.authorityState as any}
                      size="small"
                      variant="compact"
                    />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: evidenceColor(p.evidenceState) }}>{p.evidenceState}</span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: p.validationSummary === "10/10" ? "#4ade80" : DIM }}>
                      {p.validationSummary}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: p.publicClaimAllowed ? "#4ade80" : "#ef4444" }}>
                      {p.publicClaimAllowed ? "allowed" : "denied"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: DIM, maxWidth: 300 }}>
                    {p.blockingReasons.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 16, listStyle: "none" }}>
                        {p.blockingReasons.slice(0, 2).map((r, i) => (
                          <li key={i} style={{ marginBottom: 2 }}>• {r}</li>
                        ))}
                        {p.blockingReasons.length > 2 && (
                          <li style={{ color: GOLD }}>• +{p.blockingReasons.length - 2} more</li>
                        )}
                      </ul>
                    ) : (
                      <span>{p.nextAction || "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: DIM, ...MONO, fontSize: 11 }}>
            No products match the current filter.
          </div>
        )}

        <div style={{ marginTop: 24, padding: "16px 0", borderTop: `1px solid ${RULE}`, ...MONO, fontSize: 10, color: DIM }}>
          <div>Total products: {products.length}</div>
          <div>Explicit authority entries: {explicitCount}</div>
          <div>Default-resolved: {products.length - explicitCount}</div>
          <div>Blocked: {blockedCount}</div>
          <div>Boardroom Brief: {
            (() => {
              const bb = products.find((p) => p.code === "boardroom_brief");
              return bb ? `${bb.authorityState} — ${bb.publicClaimAllowed ? "public claim allowed" : "public claim denied"}` : "not found";
            })()
          }</div>
        </div>
      </div>
    </AdminLayout>
  );
}
