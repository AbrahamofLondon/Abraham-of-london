// pages/consulting/interventions.tsx
// Design: Institutional Monumentalism — matches platform design system
// Admin-grade surface: not a customer-facing page, but still architecturally consistent
// Data: StrategicIntervention with CorrectionNode children
// Interactions: status transitions for both interventions and correction nodes

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import {
  AlertTriangle,
  ArrowLeft,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  RefreshCw,
  Shield,
  X,
} from "lucide-react";

import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type CorrectionNode = {
  id:          string;
  title:       string;
  description: string;
  priority:    string;
  status:      string;
  createdAt:   string;
};

type Intervention = {
  id:             string;
  organisationId: string;
  campaignId:     string | null;
  domain:         string;
  baselineScore:  number;
  status:         string;
  deployedAt:     string | null;
  createdAt:      string;
  correctionNodes: CorrectionNode[];
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const LIFT = "rgb(10 14 20)";
const VOID = "rgb(3 3 5)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const INTERVENTION_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
const NODE_STATUSES         = ["OPEN",    "IN_PROGRESS", "RESOLVED",  "DISMISSED"] as const;

type InterventionStatus = typeof INTERVENTION_STATUSES[number];
type NodeStatus         = typeof NODE_STATUSES[number];

function interventionStatusColor(s: string): { border: string; bg: string; text: string } {
  switch (s) {
    case "COMPLETED":  return { border: "rgba(52,211,153,0.22)",  bg: "rgba(52,211,153,0.06)",  text: "rgba(110,231,183,0.85)" };
    case "IN_PROGRESS":return { border: `${GOLD}35`,              bg: `${GOLD}09`,              text: `${GOLD}CC` };
    case "CANCELLED":  return { border: "rgba(248,113,113,0.22)", bg: "rgba(248,113,113,0.06)", text: "rgba(252,165,165,0.85)" };
    default:           return { border: "rgba(255,255,255,0.10)", bg: "rgba(255,255,255,0.02)", text: "rgba(255,255,255,0.42)" };
  }
}

function nodeStatusColor(s: string): { border: string; bg: string; text: string } {
  switch (s) {
    case "RESOLVED":   return { border: "rgba(52,211,153,0.18)",  bg: "rgba(52,211,153,0.04)",  text: "rgba(110,231,183,0.80)" };
    case "IN_PROGRESS":return { border: `${GOLD}28`,              bg: `${GOLD}07`,              text: `${GOLD}BB` };
    case "DISMISSED":  return { border: "rgba(255,255,255,0.06)", bg: "rgba(255,255,255,0.01)", text: "rgba(255,255,255,0.22)" };
    default:           return { border: "rgba(248,113,113,0.18)", bg: "rgba(248,113,113,0.04)", text: "rgba(252,165,165,0.70)" };
  }
}

function priorityColor(p: string): string {
  switch (p) {
    case "CRITICAL": return "rgba(252,165,165,0.90)";
    case "HIGH":     return "rgba(251,146,60,0.85)";
    case "MEDIUM":   return `${GOLD}BB`;
    default:         return "rgba(255,255,255,0.40)";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then(r => r.json());

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={soft
      ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
    } />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8.5px",
        letterSpacing: "0.40em",
        textTransform: "uppercase",
        color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

function StatusPill({ status, colorFn }: {
  status: string;
  colorFn: (s: string) => { border: string; bg: string; text: string };
}) {
  const c = colorFn(status);
  return (
    <span style={{
      padding: "3px 10px",
      border: `1px solid ${c.border}`,
      backgroundColor: c.bg,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "7px",
      letterSpacing: "0.32em",
      textTransform: "uppercase",
      color: c.text,
      whiteSpace: "nowrap",
    }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CORRECTION NODE ROW
// ─────────────────────────────────────────────────────────────────────────────

function CorrectionNodeRow({
  node,
  onStatusChange,
  isPending,
}: {
  node: CorrectionNode;
  onStatusChange: (nodeId: string, status: string) => Promise<void>;
  isPending: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const nextStatuses = NODE_STATUSES.filter(s => s !== node.status);

  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.05)",
      backgroundColor: "rgba(255,255,255,0.008)",
      opacity: isPending ? 0.60 : 1,
      transition: "opacity 200ms ease",
    }}>
      <div
        className="flex items-start gap-3 cursor-pointer px-4 py-3 select-none"
        onClick={() => setOpen(o => !o)}
      >
        {/* Priority indicator */}
        <div style={{
          flexShrink: 0,
          marginTop: "3px",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: priorityColor(node.priority),
        }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "0.97rem",
              lineHeight: 1.40,
              color: "rgba(255,255,255,0.72)",
            }}>
              {node.title}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <StatusPill status={node.status} colorFn={nodeStatusColor} />
              <ChevronDown style={{
                width: "12px",
                height: "12px",
                color: "rgba(255,255,255,0.22)",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms ease",
              }} />
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div style={{
          padding: "0 1rem 1rem 1.75rem",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          {node.description && (
            <p style={{
              marginTop: "0.75rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "0.88rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.40)",
            }}>
              {node.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)",
            }}>
              Transition to
            </span>
            {nextStatuses.map(s => (
              <button
                key={s}
                type="button"
                disabled={isPending}
                onClick={e => { e.stopPropagation(); void onStatusChange(node.id, s); }}
                style={{
                  padding: "3px 10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.38)",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = `${GOLD}30`;
                  el.style.color = `${GOLD}AA`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = "rgba(255,255,255,0.08)";
                  el.style.color = "rgba(255,255,255,0.38)";
                }}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVENTION CARD
// ─────────────────────────────────────────────────────────────────────────────

function InterventionCard({
  item,
  onInterventionStatus,
  onNodeStatus,
  pendingIds,
}: {
  item: Intervention;
  onInterventionStatus: (id: string, status: string) => Promise<void>;
  onNodeStatus: (nodeId: string, status: string) => Promise<void>;
  pendingIds: Set<string>;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const sc = interventionStatusColor(item.status);
  const nextStatuses = INTERVENTION_STATUSES.filter(s => s !== item.status);
  const isPending = pendingIds.has(item.id);

  const completedNodes = item.correctionNodes.filter(n => n.status === "RESOLVED" || n.status === "DISMISSED").length;
  const totalNodes     = item.correctionNodes.length;

  return (
    <div
      style={{
        border: `1px solid ${expanded ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.062)"}`,
        backgroundColor: "rgb(5 5 7)",
        opacity: isPending ? 0.70 : 1,
        transition: "border-color 300ms ease, opacity 200ms ease",
      }}
    >
      {/* Card header */}
      <div
        className="cursor-pointer select-none"
        onClick={() => setExpanded(o => !o)}
        style={{ padding: "1.5rem 1.75rem" }}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <StatusPill status={item.status} colorFn={interventionStatusColor} />
              <span style={{
                padding: "3px 10px",
                border: "1px solid rgba(255,255,255,0.07)",
                backgroundColor: "rgba(255,255,255,0.015)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.30em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.30)",
              }}>
                {item.domain}
              </span>
            </div>

            {/* ID */}
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1.1rem, 1.5vw, 1.35rem)",
              lineHeight: 1.10,
              letterSpacing: "-0.018em",
              color: "rgba(255,255,255,0.82)",
            }}>
              Intervention
              <span style={{ marginLeft: "0.75rem", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "0.75rem", fontWeight: 300 }}>
                {item.id.slice(-8)}
              </span>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mt-2.5">
              {[
                { label: "Baseline", value: `${item.baselineScore}` },
                { label: "Deployed", value: fmtDate(item.deployedAt) },
                { label: "Created",  value: fmtDate(item.createdAt) },
                totalNodes > 0 && { label: "Nodes", value: `${completedNodes}/${totalNodes} closed` },
              ].filter(Boolean).map((m: any) => (
                <div key={m.label} className="flex items-center gap-1.5">
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>{m.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.50)" }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expand toggle */}
          <div style={{ flexShrink: 0, marginTop: "0.25rem" }}>
            <ChevronDown style={{
              width: "16px",
              height: "16px",
              color: "rgba(255,255,255,0.22)",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 250ms ease",
            }} />
          </div>
        </div>

        {/* Progress bar — only when there are nodes */}
        {totalNodes > 0 && (
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.round((completedNodes / totalNodes) * 100)}%`,
                backgroundColor: completedNodes === totalNodes ? "rgba(52,211,153,0.65)" : `${GOLD}80`,
                transition: "width 400ms ease",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Status transitions */}
          <div style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.20)",
            }}>
              Transition intervention to
            </span>
            {nextStatuses.map(s => {
              const c = interventionStatusColor(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={isPending}
                  onClick={() => void onInterventionStatus(item.id, s)}
                  style={{
                    padding: "5px 14px",
                    border: `1px solid ${c.border}`,
                    backgroundColor: c.bg,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: c.text,
                    cursor: "pointer",
                    transition: "opacity 200ms ease",
                    opacity: isPending ? 0.50 : 1,
                  }}
                >
                  {s.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>

          {/* Correction nodes */}
          {item.correctionNodes.length > 0 && (
            <div style={{ padding: "1rem 1.75rem 1.5rem" }}>
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.18)",
                marginBottom: "0.75rem",
              }}>
                Correction nodes ({item.correctionNodes.length})
              </div>
              <div className="space-y-2">
                {item.correctionNodes.map(node => (
                  <CorrectionNodeRow
                    key={node.id}
                    node={node}
                    onStatusChange={onNodeStatus}
                    isPending={pendingIds.has(node.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {item.correctionNodes.length === 0 && (
            <div style={{ padding: "1rem 1.75rem 1.25rem" }}>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.28)",
                fontStyle: "italic",
              }}>
                No correction nodes attached to this intervention.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER BAR
// ─────────────────────────────────────────────────────────────────────────────

function FilterBar({
  activeStatus,
  setActiveStatus,
  counts,
}: {
  activeStatus: string;
  setActiveStatus: (s: string) => void;
  counts: Record<string, number>;
}) {
  const all = ["All", ...INTERVENTION_STATUSES];

  return (
    <div style={{
      backgroundColor: "rgba(0,0,0,0.40)",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex items-center gap-2 overflow-x-auto py-3.5 hide-scrollbar">
          {all.map(s => {
            const isActive = s === "All" ? activeStatus === "" : activeStatus === s;
            const count    = s === "All"
              ? Object.values(counts).reduce((a, b) => a + b, 0)
              : (counts[s] ?? 0);
            const sc = s !== "All" ? interventionStatusColor(s) : null;

            return (
              <button
                key={s}
                type="button"
                onClick={() => setActiveStatus(s === "All" ? "" : s)}
                style={{
                  flexShrink: 0,
                  padding: "5px 14px",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                  border: `1px solid ${isActive ? (sc?.border ?? `${GOLD}35`) : "rgba(255,255,255,0.07)"}`,
                  backgroundColor: isActive ? (sc?.bg ?? `${GOLD}0D`) : "transparent",
                  color: isActive ? (sc?.text ?? `${GOLD}CC`) : "rgba(255,255,255,0.28)",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {s.replace(/_/g, " ")}
                <span style={{
                  padding: "0px 6px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  fontSize: "6.5px",
                  letterSpacing: "0.12em",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function InterventionConsole() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Intervention[] }>(
    "/api/constitution/interventions",
    fetcher,
    { refreshInterval: 30_000 },
  );

  const [activeStatus, setActiveStatus] = React.useState("");
  const [pendingIds,   setPendingIds]   = React.useState<Set<string>>(new Set());
  const [toastMsg,     setToastMsg]     = React.useState<string | null>(null);

  const list: Intervention[] = data?.data ?? [];

  // Status counts for filter bar
  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of INTERVENTION_STATUSES) c[s] = 0;
    for (const item of list) {
      if (c[item.status] !== undefined) c[item.status]++;
    }
    return c;
  }, [list]);

  const filtered = React.useMemo(() => {
    if (!activeStatus) return list;
    return list.filter(i => i.status === activeStatus);
  }, [list, activeStatus]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  }

  async function updateInterventionStatus(id: string, status: string) {
    setPendingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch("/api/constitution/interventions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, type: "intervention" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Update failed");
      await mutate();
      showToast(`Intervention → ${status.replace(/_/g, " ")}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPendingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  async function updateNodeStatus(nodeId: string, status: string) {
    setPendingIds(prev => new Set(prev).add(nodeId));
    try {
      const res = await fetch("/api/constitution/interventions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nodeId, status, type: "node" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Update failed");
      await mutate();
      showToast(`Node → ${status.replace(/_/g, " ")}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPendingIds(prev => { const n = new Set(prev); n.delete(nodeId); return n; });
    }
  }

  return (
    <Layout
      title="Intervention Console | Abraham of London"
      description="Constitutional intervention management console."
      canonicalUrl="/consulting/interventions"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="pointer-events-none absolute inset-x-0 overflow-hidden" style={{ height: "320px" }}>
            <div className="absolute" style={{
              left: "-3%", top: "-20%",
              width: "500px", height: "500px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${GOLD}08 0%, transparent 65%)`,
              filter: "blur(140px)",
            }} />
            <div className="absolute inset-0 opacity-[0.018]" style={GRAIN} />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-28 md:pt-32 pb-12">

              {/* Breadcrumb */}
              <Link
                href="/consulting"
                className="inline-flex items-center gap-1.5 mb-8 transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.26)",
                }}
              >
                <ArrowLeft style={{ width: "11px", height: "11px" }} />
                Consulting
              </Link>

              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <Eyebrow>Intervention console</Eyebrow>
                  <h1 style={{
                    marginTop: "1.25rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)",
                    lineHeight: 0.94,
                    letterSpacing: "-0.032em",
                    color: "rgba(255,255,255,0.92)",
                  }}>
                    Strategic interventions.
                  </h1>
                  <p style={{
                    marginTop: "0.85rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.02rem",
                    lineHeight: 1.70,
                    color: "rgba(255,255,255,0.38)",
                    maxWidth: "44ch",
                  }}>
                    Govern correction nodes, track intervention status, and manage
                    the deployment lifecycle of constitutional corrective actions.
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 shrink-0">
                  {[
                    { label: "Total",       value: String(list.length) },
                    { label: "In progress", value: String(counts["IN_PROGRESS"] ?? 0) },
                    { label: "Completed",   value: String(counts["COMPLETED"]   ?? 0) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "2.2rem",
                        lineHeight: 1,
                        color: "rgba(255,255,255,0.80)",
                      }}>
                        {value}
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.30em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.22)",
                        marginTop: "0.25rem",
                      }}>
                        {label}
                      </div>
                    </div>
                  ))}

                  {/* Refresh */}
                  <button
                    type="button"
                    onClick={() => void mutate()}
                    className="transition-opacity hover:opacity-70"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                    title="Refresh"
                  >
                    <RefreshCw style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.28)" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FILTER BAR ────────────────────────────────────────────────── */}
        <FilterBar
          activeStatus={activeStatus}
          setActiveStatus={setActiveStatus}
          counts={counts}
        />

        {/* ── CONTENT ───────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-14">

            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="h-4 w-4 animate-spin border border-current border-t-transparent mb-4"
                  style={{ borderColor: `${GOLD}70`, borderTopColor: "transparent", borderRadius: "50%" }}
                />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.34em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)",
                }}>
                  Loading interventions…
                </span>
              </div>
            )}

            {/* Error */}
            {!isLoading && error && (
              <div style={{
                padding: "1.25rem 1.5rem",
                border: "1px solid rgba(248,113,113,0.20)",
                backgroundColor: "rgba(248,113,113,0.04)",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}>
                <AlertTriangle style={{ width: "14px", height: "14px", color: "rgba(252,165,165,0.75)", flexShrink: 0, marginTop: "2px" }} />
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.97rem",
                  color: "rgba(252,165,165,0.80)",
                }}>
                  Failed to load interventions. Check network and API access.
                </p>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && filtered.length === 0 && (
              <div style={{
                padding: "4rem 2rem",
                border: "1px solid rgba(255,255,255,0.05)",
                backgroundColor: "rgba(255,255,255,0.008)",
                textAlign: "center",
              }}>
                <Shield style={{ width: "24px", height: "24px", color: "rgba(255,255,255,0.15)", margin: "0 auto 1rem" }} />
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.20rem",
                  color: "rgba(255,255,255,0.38)",
                  fontStyle: "italic",
                }}>
                  {activeStatus
                    ? `No interventions with status ${activeStatus.replace(/_/g, " ")}.`
                    : "No interventions found in the system."}
                </p>
              </div>
            )}

            {/* Intervention list */}
            {!isLoading && !error && filtered.length > 0 && (
              <div className="space-y-3">
                {filtered.map(item => (
                  <InterventionCard
                    key={item.id}
                    item={item}
                    onInterventionStatus={updateInterventionStatus}
                    onNodeStatus={updateNodeStatus}
                    pendingIds={pendingIds}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CLOSE ─────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-6" style={{ background: `linear-gradient(to right, ${GOLD}35, transparent)` }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.34em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                }}>
                  {filtered.length} intervention{filtered.length !== 1 ? "s" : ""} displayed
                </span>
              </div>
              <Link
                href="/consulting/strategy-room"
                className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: `${GOLD}90`,
                }}
              >
                Strategy Room
                <ChevronRight style={{ width: "10px", height: "10px" }} />
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 999,
            padding: "10px 18px",
            border: `1px solid ${GOLD}30`,
            backgroundColor: "rgb(6 6 9)",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            boxShadow: "0 16px 48px -12px rgba(0,0,0,0.80)",
          }}
        >
          <CheckSquare style={{ width: "13px", height: "13px", color: `${GOLD}AA` }} />
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
          }}>
            {toastMsg}
          </span>
        </div>
      )}

    </Layout>
  );
}