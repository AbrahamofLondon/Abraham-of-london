import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import {
  loadSuppressionLedger,
  buildSuppressionSummary,
} from "@/lib/product/suppression-ledger";
import type {
  SuppressionEvent,
  SuppressionSummary,
} from "@/lib/product/suppression-ledger-contract";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type PageProps = {
  events: SuppressionEvent[];
  summary: SuppressionSummary;
};

function OverrideBadge({ status }: { status: string }) {
  const color =
    status === "APPROVED_FOR_RELEASE"
      ? "rgba(110,231,183,0.70)"
      : status === "REMAIN_SUPPRESSED"
        ? "rgba(252,165,165,0.70)"
        : "rgba(255,255,255,0.30)";
  return (
    <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color }}>
      {status}
    </span>
  );
}

const SuppressionLedgerPage: NextPage<PageProps> = ({ events, summary }) => {
  const [actionState, setActionState] = React.useState<Record<string, string>>({});
  const [surface, setSurface] = React.useState("");
  const [scopeId, setScopeId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [filteredEvents, setFilteredEvents] = React.useState(events);

  React.useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  async function applyFilters() {
    const params = new URLSearchParams();
    if (surface.trim()) params.set("surface", surface.trim());
    if (scopeId.trim()) params.set("scopeId", scopeId.trim());
    if (reason.trim()) params.set("reason", reason.trim());
    const res = await fetch(`/api/admin/suppression-ledger?${params.toString()}`);
    const data = await res.json();
    if (Array.isArray(data.events)) setFilteredEvents(data.events);
  }

  function exportSummary() {
    const payload = JSON.stringify({ summary, events: filteredEvents }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "suppression-audit-summary.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleOverride(eventId: string, decision: "APPROVED_FOR_RELEASE" | "REMAIN_SUPPRESSED") {
    setActionState((prev) => ({ ...prev, [eventId]: "loading" }));
    try {
      const res = await fetch("/api/admin/suppression-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, decision, reason: `Admin override: ${decision}` }),
      });
      if (res.ok) {
        setActionState((prev) => ({ ...prev, [eventId]: decision }));
      } else {
        setActionState((prev) => ({ ...prev, [eventId]: "error" }));
      }
    } catch {
      setActionState((prev) => ({ ...prev, [eventId]: "error" }));
    }
  }

  return (
    <AdminLayout title="Suppression Audit Ledger">
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-7xl">
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80` }}>
            Decision infrastructure
          </p>
          <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", color: "rgba(255,255,255,0.90)" }}>
            Suppression Audit Ledger
          </h1>
          <p className="mt-3 max-w-2xl" style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.40)" }}>
            Every instance where the system withheld material from a surface — tracked, reviewable, and auditable.
          </p>

          {/* Summary strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
              <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Total suppressed</div>
              <div style={{ ...mono, fontSize: "14px", color: "rgba(255,255,255,0.55)", marginTop: "0.25rem" }}>{summary.totalSuppressed}</div>
            </div>
            {Object.entries(summary.bySurface).map(([surface, count]) => (
              <div key={surface} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
                <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{surface}</div>
                <div style={{ ...mono, fontSize: "14px", color: `${GOLD}BB`, marginTop: "0.25rem" }}>{count}</div>
              </div>
            ))}
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
              <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Latest at</div>
              <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.40)", marginTop: "0.25rem" }}>
                {summary.latestAt ? new Date(summary.latestAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "---"}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <input value={surface} onChange={(e) => setSurface(e.target.value)} placeholder="Surface" style={{ ...mono, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "0.65rem", color: "white" }} />
            <input value={scopeId} onChange={(e) => setScopeId(e.target.value)} placeholder="Scope" style={{ ...mono, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "0.65rem", color: "white" }} />
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" style={{ ...mono, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "0.65rem", color: "white" }} />
            <div className="flex gap-2">
              <button onClick={applyFilters} style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", border: "1px solid rgba(201,169,110,0.25)", padding: "0.65rem 0.9rem", color: "rgba(201,169,110,0.88)" }}>
                Filter
              </button>
              <button onClick={exportSummary} style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.14)", padding: "0.65rem 0.9rem", color: "rgba(255,255,255,0.70)" }}>
                Export
              </button>
            </div>
          </div>

          {/* Sponsor-safe notice */}
          <div className="mt-4" style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)" }}>
              Sponsor-safe notice: {summary.sponsorSafeNotice}
            </p>
          </div>

          {/* Suppression event table */}
          <div className="mt-10 space-y-3">
            {filteredEvents.length === 0 && (
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center" }}>
                <p style={{ ...serif, color: "rgba(255,255,255,0.30)" }}>No suppression events recorded yet.</p>
              </div>
            )}
            {filteredEvents.map((ev) => {
              const resolved = actionState[ev.eventId];
              return (
                <div key={ev.eventId} style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                        {ev.surface} &middot; {new Date(ev.suppressedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>
                        {ev.suppressionReason}
                      </p>
                    </div>
                    <OverrideBadge status={resolved || ev.overrideStatus} />
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-5" style={{ fontSize: "0" }}>
                    {[
                      { label: "Field", value: ev.fieldName },
                      { label: "Rule", value: ev.suppressionRule },
                      { label: "Evidence source", value: ev.evidenceSource },
                      { label: "Evidence posture", value: ev.evidencePosture || ev.originalPosture },
                      { label: "Scope", value: ev.scopeId },
                    ].map((d) => (
                      <div key={d.label}>
                        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>{d.label}</span>
                        <div style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.40)", marginTop: "2px", wordBreak: "break-all" }}>{d.value || "---"}</div>
                      </div>
                    ))}
                  </div>

                  {ev.reviewedByOperator && (
                    <div className="mt-2">
                      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(110,231,183,0.50)" }}>
                        Reviewed by {ev.reviewedByOperator} &middot; {ev.reviewedAt ? new Date(ev.reviewedAt).toLocaleDateString("en-GB") : ""}
                        {ev.overrideReason ? ` &middot; ${ev.overrideReason}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Override actions */}
                  {ev.overrideStatus === "NONE" && !resolved && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleOverride(ev.eventId, "APPROVED_FOR_RELEASE")}
                        style={{
                          ...mono,
                          fontSize: "7px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          border: "1px solid rgba(110,231,183,0.30)",
                          backgroundColor: "transparent",
                          color: "rgba(110,231,183,0.70)",
                          padding: "0.35rem 0.65rem",
                          cursor: "pointer",
                        }}
                      >
                        Approve for release
                      </button>
                      <button
                        onClick={() => handleOverride(ev.eventId, "REMAIN_SUPPRESSED")}
                        style={{
                          ...mono,
                          fontSize: "7px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          border: "1px solid rgba(252,165,165,0.30)",
                          backgroundColor: "transparent",
                          color: "rgba(252,165,165,0.70)",
                          padding: "0.35rem 0.65rem",
                          cursor: "pointer",
                        }}
                      >
                        Confirm suppression
                      </button>
                    </div>
                  )}
                  {resolved === "loading" && (
                    <p className="mt-2" style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>Processing...</p>
                  )}
                  {resolved === "error" && (
                    <p className="mt-2" style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.60)" }}>Failed to update. Try again.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.authorized) return auth.redirect as any;

  const scopeId = typeof ctx.query.scopeId === "string" ? ctx.query.scopeId : undefined;
  const surface = typeof ctx.query.surface === "string" ? ctx.query.surface : undefined;

  const [events, summary] = await Promise.all([
    loadSuppressionLedger({ scopeId, surface, limit: 200 }),
    buildSuppressionSummary(scopeId),
  ]);

  return { props: { events, summary } };
};

export default SuppressionLedgerPage;
