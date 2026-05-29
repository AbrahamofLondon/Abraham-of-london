"use client";

import React from "react";

const GOLD = "#C9A96E";
const VOID = "rgb(6 6 9)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "0.5rem" }}>{children}</div>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem", marginBottom: "1rem" }}>{children}</div>;
}

type CatalogProduct = { code: string; price: number; type: string; duration: string; cookie?: string };
type RecentGrant = { email: string; productCode: string; source: string; status: string; createdAt: string };
type FailedGrant = { id: string; email: string; slug: string; source: string; error: string; createdAt: string };

export default function CommercialAdminPage() {
  const [data, setData] = React.useState<any>(null);
  const [failed, setFailed] = React.useState<FailedGrant[]>([]);
  const [lookup, setLookup] = React.useState("");
  const [lookupResult, setLookupResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/admin/commercial").then((r) => r.json()),
      fetch("/api/admin/commercial?failed=true").then((r) => r.json()),
    ]).then(([main, failedData]) => {
      setData(main);
      setFailed(failedData.failedGrants ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function lookupEmail() {
    if (!lookup.trim()) return;
    const res = await fetch(`/api/admin/commercial?email=${encodeURIComponent(lookup.trim())}`);
    setLookupResult(await res.json());
  }

  async function repairGrant(id: string) {
    await fetch("/api/admin/commercial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "repair", failedGrantId: id }),
    });
    setFailed((prev) => prev.filter((f) => f.id !== id));
  }

  if (loading) return <div style={{ backgroundColor: VOID, minHeight: "100vh", color: "white", padding: "2rem" }}><Label>Loading commercial data...</Label></div>;

  const catalog: CatalogProduct[] = data?.catalog?.products ?? [];
  const recent: RecentGrant[] = data?.recentGrants ?? [];
  const stats = data?.stats ?? {};

  return (
    <div style={{ backgroundColor: VOID, minHeight: "100vh", color: "white" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <Label>Admin / Commercial Control</Label>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "1.6rem", color: "rgba(255,255,255,0.88)", marginBottom: "1.5rem" }}>
          Commercial Authority
        </h1>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Entitlements", value: stats.totalEntitlements },
            { label: "Active", value: stats.activeEntitlements },
            { label: "Failed Pending", value: stats.failedPendingCount, alert: stats.failedPendingCount > 0 },
          ].map((s) => (
            <Panel key={s.label}>
              <Label>{s.label}</Label>
              <div style={{ ...mono, fontSize: "1.5rem", color: s.alert ? "rgba(252,165,165,0.80)" : GOLD }}>{s.value ?? 0}</div>
            </Panel>
          ))}
        </div>

        {/* Product Catalog */}
        <Panel>
          <Label>Product Catalog</Label>
          <div style={{ display: "grid", gap: "2px" }}>
            {catalog.map((p) => (
              <div key={p.code} style={{ display: "grid", gridTemplateColumns: "1fr 4rem 5rem 5rem 8rem", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                <span style={{ ...mono, fontSize: "7.5px", color: "rgba(255,255,255,0.60)" }}>{p.code}</span>
                <span style={{ ...mono, fontSize: "8px", color: GOLD }}>£{p.price}</span>
                <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.30)" }}>{p.type}</span>
                <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.30)" }}>{p.duration}</span>
                <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.20)" }}>{p.cookie ?? "no cookie"}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Failed Grants Queue */}
        {failed.length > 0 && (
          <Panel>
            <Label>Failed Entitlement Grants (Pending Recovery)</Label>
            {failed.map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ ...mono, fontSize: "7.5px", color: "rgba(252,165,165,0.70)" }}>{f.email} — {f.slug}</div>
                  <div style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.22)" }}>{f.error}</div>
                </div>
                <button onClick={() => repairGrant(f.id)} style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(110,231,183,0.70)", background: "none", border: "1px solid rgba(110,231,183,0.25)", padding: "4px 10px", cursor: "pointer" }}>
                  Repair
                </button>
              </div>
            ))}
          </Panel>
        )}

        {/* Email Lookup */}
        <Panel>
          <Label>Entitlement Lookup by Email</Label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input value={lookup} onChange={(e) => setLookup(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookupEmail()}
              placeholder="user@example.com" style={{ flex: 1, backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.09)", padding: "6px 10px", ...mono, fontSize: "8px", color: "rgba(255,255,255,0.70)", outline: "none" }} />
            <button onClick={lookupEmail} style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, background: "none", border: `1px solid ${GOLD}35`, padding: "6px 12px", cursor: "pointer" }}>
              Lookup
            </button>
          </div>
          {lookupResult && (
            <div style={{ marginTop: "0.75rem" }}>
              {lookupResult.entitlements?.length === 0 && (
                <div style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.60)" }}>No entitlements found for {lookupResult.email}</div>
              )}
              {lookupResult.entitlements?.map((e: any) => (
                <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 5rem 4rem 8rem", gap: "0.5rem", padding: "0.35rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.55)" }}>{e.productCode}</span>
                  <span style={{ ...mono, fontSize: "7px", color: e.status === "active" ? "rgba(110,231,183,0.60)" : "rgba(252,165,165,0.60)" }}>{e.status}</span>
                  <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.25)" }}>{e.source}</span>
                  <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.20)" }}>{new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Recent Activity */}
        <Panel>
          <Label>Recent Grants</Label>
          {recent.map((g, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 4rem 4rem 6rem", gap: "0.5rem", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.45)" }}>{g.email}</span>
              <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.45)" }}>{g.productCode}</span>
              <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.25)" }}>{g.source}</span>
              <span style={{ ...mono, fontSize: "6.5px", color: g.status === "active" ? "rgba(110,231,183,0.50)" : "rgba(252,165,165,0.50)" }}>{g.status}</span>
              <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>{new Date(g.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
