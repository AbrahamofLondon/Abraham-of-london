"use client";

/**
 * app/portal/page.tsx — Client Portal v1
 *
 * Access: magic-link token (?token=<raw>) validated via /api/client-portal/verify
 * Shows: Boardroom dossiers, decision action items, access history
 *
 * Token is stored in sessionStorage after first verification so the user
 * doesn't need to keep the token in the URL for the session lifetime.
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Archive, FileText, Shield, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionStatus = "OPEN" | "IN_PROGRESS" | "ACTIONED" | "DEFERRED" | "WONT_ACT";
type ActionSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type ActionItem = {
  id: string;
  findingTitle: string;
  recommendedAction: string;
  owner: string | null;
  status: ActionStatus;
  severity: ActionSeverity;
  dueDate: string | null;
  outcomeNote: string | null;
  followUpDate: string | null;
  actionedAt: string | null;
};

type Dossier = {
  id: string;
  title: string;
  status: string;
  sourceType: string;
  hasActiveToken: boolean;
  lastViewedAt: string | null;
  viewCount: number;
  createdAt: string;
};

type ActionSummary = {
  open: number;
  inProgress: number;
  actioned: number;
  deferred: number;
  wontAct: number;
  total: number;
};

type PortalData = {
  clientEmail: string;
  deliverables: {
    dossiers: Dossier[];
    actionItems: ActionItem[];
    actionSummary: ActionSummary;
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 } as const;

const PORTAL_TOKEN_KEY = "aol_portal_token";

const STATUS_CONFIG: Record<ActionStatus, { label: string; color: string; icon: React.FC<{ size?: number }> }> = {
  OPEN: { label: "Open", color: "rgba(251,191,36,0.7)", icon: Clock },
  IN_PROGRESS: { label: "In progress", color: "rgba(59,130,246,0.7)", icon: AlertTriangle },
  ACTIONED: { label: "Actioned", color: "rgba(34,197,94,0.7)", icon: CheckCircle2 },
  DEFERRED: { label: "Deferred", color: "rgba(156,163,175,0.7)", icon: Archive },
  WONT_ACT: { label: "Won't act", color: "rgba(239,68,68,0.7)", icon: XCircle },
};

const SEVERITY_COLORS: Record<ActionSeverity, string> = {
  CRITICAL: "rgba(239,68,68,0.75)",
  HIGH: "rgba(249,115,22,0.75)",
  MEDIUM: "rgba(251,191,36,0.70)",
  LOW: "rgba(110,231,183,0.60)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(str: string | null): string {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ textAlign: "center" as const, padding: "0.75rem 1.25rem", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
      <p style={{ ...mono, fontSize: "18px", fontWeight: 600, color, marginBottom: "0.25rem" }}>{count}</p>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.35)" }}>{label}</p>
    </div>
  );
}

function DossierCard({ dossier, token }: { dossier: Dossier; token: string }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.85rem" }}>
        <div>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: `${GOLD}70`, marginBottom: "0.3rem" }}>
            {dossier.sourceType.replace(/_/g, " ")}
          </p>
          <p style={{ ...serif, fontSize: "1.1rem", color: "rgba(255,255,255,0.88)" }}>{dossier.title}</p>
        </div>
        <FileText size={16} style={{ color: `${GOLD}60`, flexShrink: 0 }} />
      </div>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" as const, marginBottom: "1rem" }}>
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)" }}>
          Delivered {formatDate(dossier.createdAt)}
        </span>
        {dossier.lastViewedAt && (
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)" }}>
            Last viewed {formatDate(dossier.lastViewedAt)}
          </span>
        )}
        {dossier.viewCount > 0 && (
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)" }}>
            Viewed {dossier.viewCount}×
          </span>
        )}
      </div>
      {dossier.hasActiveToken ? (
        <a
          href={`/api/client-portal/dossier-redirect?dossierId=${dossier.id}&token=${encodeURIComponent(token)}`}
          style={{
            display: "inline-block",
            padding: "0.6rem 1.25rem",
            border: `1px solid ${GOLD}35`,
            background: `${GOLD}0c`,
            color: GOLD,
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: "9px",
            letterSpacing: "0.22em",
            textTransform: "uppercase" as const,
            textDecoration: "none",
          }}
        >
          Open Dossier →
        </a>
      ) : (
        <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.22)" }}>
          Access link expired — contact your representative for a new link.
        </p>
      )}
    </div>
  );
}

function ActionRow({ action, token, onUpdate }: { action: ActionItem; token: string; onUpdate: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [outcomeNote, setOutcomeNote] = React.useState(action.outcomeNote ?? "");
  const statusCfg = STATUS_CONFIG[action.status];
  const Icon = statusCfg.icon;
  const severityColor = SEVERITY_COLORS[action.severity];

  async function updateStatus(newStatus: ActionStatus) {
    setUpdating(true);
    try {
      await fetch(`/api/client-portal/actions?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: action.id,
          status: newStatus,
          outcomeNote: outcomeNote || undefined,
        }),
      });
      onUpdate();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", marginBottom: "0.5rem" }}>
      <div
        style={{ padding: "0.85rem 1.25rem", cursor: "pointer" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <span style={{ color: statusCfg.color, marginTop: "3px", flexShrink: 0, display: "inline-flex" }}>
            <Icon size={14} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem", flexWrap: "wrap" as const }}>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: severityColor }}>
                {action.severity}
              </span>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: statusCfg.color }}>
                {statusCfg.label}
              </span>
              {action.dueDate && (
                <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)" }}>
                  Due {formatDate(action.dueDate)}
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.80)", marginBottom: "0.2rem" }}>
              {action.findingTitle}
            </p>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.42)", lineHeight: 1.5 }}>
              {action.recommendedAction.slice(0, 120)}{action.recommendedAction.length > 120 ? "…" : ""}
            </p>
          </div>
          {expanded ? <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} /> : <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: "1rem 0" }}>
            {action.recommendedAction}
          </p>
          {action.owner && (
            <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.30)", marginBottom: "0.75rem" }}>
              Owner: {action.owner}
            </p>
          )}
          {action.actionedAt && (
            <p style={{ ...mono, fontSize: "8px", color: "rgba(34,197,94,0.55)", marginBottom: "0.75rem" }}>
              Actioned: {formatDate(action.actionedAt)}
            </p>
          )}
          {action.outcomeNote && (
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.40)", lineHeight: 1.6, fontStyle: "italic", marginBottom: "0.75rem" }}>
              Outcome: {action.outcomeNote}
            </p>
          )}

          {/* Outcome note input */}
          {action.status !== "ACTIONED" && action.status !== "WONT_ACT" && (
            <div style={{ marginBottom: "0.75rem" }}>
              <textarea
                value={outcomeNote}
                onChange={(e) => setOutcomeNote(e.target.value)}
                placeholder="Add an outcome note…"
                rows={2}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.75)",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.82rem",
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "vertical" as const,
                  boxSizing: "border-box" as const,
                }}
              />
            </div>
          )}

          {/* Status update buttons */}
          {action.status !== "ACTIONED" && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
              {action.status !== "IN_PROGRESS" && (
                <button
                  onClick={() => updateStatus("IN_PROGRESS")}
                  disabled={updating}
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" as const, padding: "0.4rem 0.85rem", border: "1px solid rgba(59,130,246,0.35)", background: "rgba(59,130,246,0.08)", color: "rgba(59,130,246,0.75)", cursor: "pointer" }}
                >
                  Mark in progress
                </button>
              )}
              <button
                onClick={() => updateStatus("ACTIONED")}
                disabled={updating}
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" as const, padding: "0.4rem 0.85rem", border: "1px solid rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.08)", color: "rgba(34,197,94,0.75)", cursor: "pointer" }}
              >
                Mark actioned
              </button>
              {action.status !== "DEFERRED" && (
                <button
                  onClick={() => updateStatus("DEFERRED")}
                  disabled={updating}
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" as const, padding: "0.4rem 0.85rem", border: "1px solid rgba(156,163,175,0.25)", background: "transparent", color: "rgba(156,163,175,0.55)", cursor: "pointer" }}
                >
                  Defer
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientPortalPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = React.useState<string | null>(null);
  const [data, setData] = React.useState<PortalData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Resolve token from URL or sessionStorage
  React.useEffect(() => {
    const urlToken = searchParams?.get("token");
    const storedToken = typeof window !== "undefined" ? sessionStorage.getItem(PORTAL_TOKEN_KEY) : null;
    const resolvedToken = urlToken || storedToken;

    if (resolvedToken) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(PORTAL_TOKEN_KEY, resolvedToken);
      }
      setToken(resolvedToken);
    } else {
      setLoading(false);
      setError("No access token. Use the link from your portal invitation email.");
    }
  }, [searchParams]);

  // Fetch deliverables once token is resolved
  React.useEffect(() => {
    if (!token) return;

    async function fetchPortalData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/client-portal/deliverables?token=${encodeURIComponent(token!)}`);
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Access denied.");
          if (typeof window !== "undefined") sessionStorage.removeItem(PORTAL_TOKEN_KEY);
        } else {
          setData(json);
        }
      } catch {
        setError("Connection error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchPortalData();
  }, [token]);

  const refreshData = React.useCallback(() => {
    if (!token) return;
    setData(null);
    setLoading(true);
    fetch(`/api/client-portal/deliverables?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => { if (json.ok) setData(json); })
      .finally(() => setLoading(false));
  }, [token]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0a09", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
          Verifying access…
        </p>
      </div>
    );
  }

  // ── Error / no access ────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0a09", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: "460px", padding: "2rem", textAlign: "center" as const }}>
          <Shield size={32} style={{ color: "rgba(239,68,68,0.4)", margin: "0 auto 1rem" }} />
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(239,68,68,0.5)", marginBottom: "0.75rem" }}>
            Access denied
          </p>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
            {error ?? "Access link invalid or expired. Use the link from your portal invitation email."}
          </p>
        </div>
      </div>
    );
  }

  const { clientEmail, deliverables } = data;
  const { dossiers, actionItems, actionSummary } = deliverables;

  const openActions = actionItems.filter((a) => a.status === "OPEN" || a.status === "IN_PROGRESS");
  const resolvedActions = actionItems.filter((a) => a.status === "ACTIONED" || a.status === "DEFERRED" || a.status === "WONT_ACT");

  // ── Portal view ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0b0a09", color: "#f2f1ee" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem 2rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.25rem" }}>
              Decision Portal
            </p>
            <p style={{ ...serif, fontSize: "1.35rem", color: "rgba(255,255,255,0.88)" }}>
              Abraham of London
            </p>
          </div>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.22)" }}>
            {clientEmail}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem" }}>

        {/* Action summary */}
        {actionSummary.total > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "1rem" }}>
              Decision action summary
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.75rem" }}>
              <SummaryBadge label="Open" count={actionSummary.open} color="rgba(251,191,36,0.7)" />
              <SummaryBadge label="In progress" count={actionSummary.inProgress} color="rgba(59,130,246,0.7)" />
              <SummaryBadge label="Actioned" count={actionSummary.actioned} color="rgba(34,197,94,0.7)" />
              <SummaryBadge label="Deferred" count={actionSummary.deferred} color="rgba(156,163,175,0.5)" />
            </div>
          </div>
        )}

        {/* Boardroom dossiers */}
        {dossiers.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "1rem" }}>
              Boardroom dossiers ({dossiers.length})
            </p>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {dossiers.map((d) => (
                <DossierCard key={d.id} dossier={d} token={token!} />
              ))}
            </div>
          </section>
        )}

        {dossiers.length === 0 && actionItems.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center" as const, border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.5rem" }}>
              No deliverables yet
            </p>
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.35)" }}>
              Your reports and dossiers will appear here when delivered.
            </p>
          </div>
        )}

        {/* Open action items */}
        {openActions.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "1rem" }}>
              Action items — open ({openActions.length})
            </p>
            {openActions.map((a) => (
              <ActionRow key={a.id} action={a} token={token!} onUpdate={refreshData} />
            ))}
          </section>
        )}

        {/* Resolved actions */}
        {resolvedActions.length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "1rem" }}>
              Resolved actions ({resolvedActions.length})
            </p>
            {resolvedActions.map((a) => (
              <ActionRow key={a.id} action={a} token={token!} onUpdate={refreshData} />
            ))}
          </section>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "1.5rem", marginTop: "2rem" }}>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)", lineHeight: 1.8 }}>
            Abraham of London · Decision Authority Infrastructure · Client portal is confidential.<br />
            Do not share your access link. Contact your representative if your session expires.
          </p>
        </div>

      </div>
    </div>
  );
}
