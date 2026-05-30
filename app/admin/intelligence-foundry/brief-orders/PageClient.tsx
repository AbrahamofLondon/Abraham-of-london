"use client";

/* app/admin/intelligence-foundry/brief-orders/PageClient.tsx
 *
 * Admin fulfilment queue for paid Decision Failure Brief orders.
 * Lists all orders, filterable by status/tier.
 * Allows founder to mark as in_review or delivered.
 */

import * as React from "react";
import Link from "next/link";

const GOLD = "#C9A96E";

type BriefOrder = {
  id: string;
  name: string;
  email: string;
  tier: string;
  price: number;
  status: string;
  decisionType: string | null;
  primaryFailurePoint: string | null;
  directive: string | null;
  decisionSummary: string | null;
  verificationToken: string | null;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400",
  in_review: "bg-blue-500/10 text-blue-400",
  delivered: "bg-emerald-500/10 text-emerald-400",
  cancelled: "bg-white/5 text-white/40",
  refunded: "bg-red-500/10 text-red-400",
};

type Metrics = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalRevenueFormatted: string;
  revenueByTier: Record<string, number>;
  ordersByStatus: Record<string, number>;
  decisionTypeCount: Record<string, number>;
  failurePointCount: Record<string, number>;
  constrainedRescueCount: number;
};

const TIER_LABELS: Record<string, string> = {
  basic: "Basic £49",
  full: "Full £149",
  urgent: "Urgent £349",
  executive: "Executive Review",
};

function priceDisplay(pence: number): string {
  return `£${(pence / 100).toFixed(0)}`;
}

export default function BriefOrdersPageClient() {
  const [orders, setOrders] = React.useState<BriefOrder[]>([]);
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("all");
  const [tierFilter, setTierFilter] = React.useState<string>("all");
  const [selectedOrder, setSelectedOrder] = React.useState<BriefOrder | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [draftOutput, setDraftOutput] = React.useState<object | null>(null);
  const [draftLoading, setDraftLoading] = React.useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (tierFilter !== "all") params.set("tier", tierFilter);
      params.set("metrics", "true");
      const res = await fetch(`/api/admin/intelligence-foundry/brief-orders?${params}`);
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadOrders(); }, [filter, tierFilter]);

  async function updateStatus(orderId: string, newStatus: string) {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/intelligence-foundry/brief-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        loadOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch {
      // Silent
    } finally {
      setActionLoading(null);
    }
  }

  async function generateDraft(orderId: string) {
    setDraftLoading(true);
    setDraftOutput(null);
    try {
      const res = await fetch(`/api/admin/intelligence-foundry/brief-orders/${orderId}/generate-draft`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setDraftOutput(data.draft);
      }
    } catch {
      // Silent
    } finally {
      setDraftLoading(false);
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (tierFilter !== "all" && o.tier !== tierFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/intelligence-foundry" className="font-mono text-[11px] text-white/25 hover:text-white/45">
            ← Foundry
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-white/80">Brief Orders</h1>
          <p className="text-xs text-white/40 mt-1">Paid Decision Failure Brief fulfilment queue</p>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="border border-white/8 bg-white/[0.02] p-3">
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">Total Orders</p>
              <p className="text-lg font-mono text-white/80 mt-1">{metrics.totalOrders}</p>
            </div>
            <div className="border border-white/8 bg-white/[0.02] p-3">
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">Paid Orders</p>
              <p className="text-lg font-mono text-white/80 mt-1">{metrics.paidOrders}</p>
            </div>
            <div className="border border-white/8 bg-white/[0.02] p-3">
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">Revenue</p>
              <p className="text-lg font-mono text-emerald-400 mt-1">{metrics.totalRevenueFormatted}</p>
            </div>
            <div className="border border-white/8 bg-white/[0.02] p-3">
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">Constrained Rescue</p>
              <p className="text-lg font-mono text-amber-400 mt-1">{metrics.constrainedRescueCount}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-black/30 border border-white/10 px-3 py-1.5 text-xs text-white/60 font-mono"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value)}
            className="bg-black/30 border border-white/10 px-3 py-1.5 text-xs text-white/60 font-mono"
          >
            <option value="all">All tiers</option>
            <option value="basic">Basic</option>
            <option value="full">Full</option>
            <option value="urgent">Urgent</option>
            <option value="executive">Executive</option>
          </select>
          <button
            onClick={loadOrders}
            className="border border-white/10 px-3 py-1.5 text-xs font-mono text-white/40 hover:text-white/60"
          >
            Refresh
          </button>
        </div>

        {/* Orders table */}
        {loading ? (
          <p className="text-xs text-white/30 font-mono">Loading...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-white/50 mb-2">No Decision Failure Brief orders yet</p>
            <p className="text-xs text-white/30 leading-relaxed max-w-lg mx-auto">
              Once checkout is completed, paid orders will appear here for founder review,
              draft generation, and delivery tracking.
            </p>
            <p className="mt-4 text-[10px] font-mono text-amber-500/50">
              Run a checkout smoke test after production deployment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-white/30 uppercase tracking-wider">
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-left py-2 pr-3">Email</th>
                  <th className="text-left py-2 pr-3">Tier</th>
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-left py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                  >
                    <td className="py-2 pr-3 text-white/40">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="py-2 pr-3 text-white/70">{order.name}</td>
                    <td className="py-2 pr-3 text-white/50">{order.email}</td>
                    <td className="py-2 pr-3 text-white/60">{TIER_LABELS[order.tier] ?? order.tier}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase ${STATUS_STYLES[order.status] ?? ""}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-white/40">{order.decisionType ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-1">
                        {order.status === "pending" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, "in_review"); }}
                            disabled={actionLoading === order.id}
                            className="border border-blue-500/30 px-2 py-0.5 text-[8px] uppercase tracking-wider text-blue-400/70 hover:bg-blue-500/10 disabled:opacity-30"
                          >
                            {actionLoading === order.id ? "..." : "Review"}
                          </button>
                        )}
                        {order.status === "in_review" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, "delivered"); }}
                            disabled={actionLoading === order.id}
                            className="border border-emerald-500/30 px-2 py-0.5 text-[8px] uppercase tracking-wider text-emerald-400/70 hover:bg-emerald-500/10 disabled:opacity-30"
                          >
                            {actionLoading === order.id ? "..." : "Deliver"}
                          </button>
                        )}
                        {(order.status === "pending" || order.status === "in_review") && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, "cancelled"); }}
                            disabled={actionLoading === order.id}
                            className="border border-red-500/20 px-2 py-0.5 text-[8px] uppercase tracking-wider text-red-400/50 hover:bg-red-500/10 disabled:opacity-30"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order detail panel */}
        {selectedOrder && (
          <div className="mt-6 border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-start justify-between mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">Order Detail</p>
              <button onClick={() => setSelectedOrder(null)} className="text-white/30 hover:text-white/60 text-xs">Close</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Order ID</p>
                <p className="text-white/60">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Created</p>
                <p className="text-white/60">{new Date(selectedOrder.createdAt).toLocaleString("en-GB")}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Name</p>
                <p className="text-white/70">{selectedOrder.name}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Email</p>
                <p className="text-white/60">{selectedOrder.email}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Tier / Price</p>
                <p className="text-white/60">{TIER_LABELS[selectedOrder.tier] ?? selectedOrder.tier} — {priceDisplay(selectedOrder.price)}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Status</p>
                <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase ${STATUS_STYLES[selectedOrder.status] ?? ""}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Decision Type</p>
                <p className="text-white/50">{selectedOrder.decisionType ?? "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Failure Point</p>
                <p className="text-white/50">{selectedOrder.primaryFailurePoint ?? "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Directive</p>
                <p className="text-white/50">{selectedOrder.directive ?? "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Verification Token</p>
                <p className="text-white/50" style={{ color: selectedOrder.verificationToken ? GOLD : undefined }}>
                  {selectedOrder.verificationToken ?? "—"}
                </p>
              </div>
              {selectedOrder.paidAt && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Paid At</p>
                  <p className="text-white/50">{new Date(selectedOrder.paidAt).toLocaleString("en-GB")}</p>
                </div>
              )}
              {selectedOrder.deliveredAt && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Delivered At</p>
                  <p className="text-white/50">{new Date(selectedOrder.deliveredAt).toLocaleString("en-GB")}</p>
                </div>
              )}
            </div>
            {selectedOrder.decisionSummary && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">Decision Summary</p>
                <p className="text-xs text-white/60 leading-relaxed">{selectedOrder.decisionSummary}</p>
              </div>
            )}

            {/* Founder review checklist */}
            {selectedOrder.status === "in_review" && (
              <ReviewChecklist />
            )}

            <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-white/5">
              {selectedOrder.status === "pending" && (
                <button
                  onClick={() => updateStatus(selectedOrder.id, "in_review")}
                  disabled={actionLoading === selectedOrder.id}
                  className="border border-blue-500/30 px-3 py-1.5 text-[9px] uppercase tracking-wider text-blue-400/70 hover:bg-blue-500/10 disabled:opacity-30"
                >
                  {actionLoading === selectedOrder.id ? "..." : "Mark In Review"}
                </button>
              )}
              {selectedOrder.status === "in_review" && (
                <>
                  <button
                    onClick={() => generateDraft(selectedOrder.id)}
                    disabled={draftLoading}
                    className="border border-violet-500/30 px-3 py-1.5 text-[9px] uppercase tracking-wider text-violet-400/70 hover:bg-violet-500/10 disabled:opacity-30"
                  >
                    {draftLoading ? "Generating..." : "Generate Draft Brief"}
                  </button>
                  <button
                    onClick={() => updateStatus(selectedOrder.id, "delivered")}
                    disabled={actionLoading === selectedOrder.id}
                    className="border border-emerald-500/30 px-3 py-1.5 text-[9px] uppercase tracking-wider text-emerald-400/70 hover:bg-emerald-500/10 disabled:opacity-30"
                  >
                    {actionLoading === selectedOrder.id ? "..." : "Mark Delivered"}
                  </button>
                </>
              )}
            </div>

            {/* Draft output */}
            {draftOutput && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-2">Draft Brief Preview</p>
                <pre className="text-[10px] text-white/50 leading-relaxed max-h-96 overflow-y-auto bg-black/30 p-3 rounded border border-white/5">
                  {JSON.stringify(draftOutput, null, 2)}
                </pre>
                <p className="mt-2 font-mono text-[7px] uppercase tracking-wider text-amber-400/50">
                  Founder review required before delivery. Edit the draft as needed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Founder Review Checklist ─────────────────────────────────────────────────

const REVIEW_ITEMS = [
  { id: "decision_type", label: "Decision type correct", detail: "Does the classified domain match the user's situation?" },
  { id: "failure_point", label: "Failure point defensible", detail: "Is the primary failure point justified by the evidence in the submission?" },
  { id: "recommendation", label: "Recommendation viable", detail: "Is the minimum viable next move actually doable given the user's constraints?" },
  { id: "no_impossible_advice", label: "No impossible advice", detail: "Does the brief avoid recommending paid help to someone who can't afford it?" },
  { id: "evidence_included", label: "Evidence needed included", detail: "Are the evidence gaps clearly stated so the user knows what to gather?" },
  { id: "regulated_boundary", label: "Regulated advice boundary respected", detail: "Does the brief clearly disclaim that it is not legal, tax, or financial advice?" },
  { id: "worth_price", label: "Worth-price judgement", detail: "Would you pay the tier price for this brief? If not, what is missing?" },
  { id: "ready_to_deliver", label: "Ready to deliver", detail: "Is the brief complete, clear, and professional enough to send to a paying customer?" },
];

function ReviewChecklist() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  const allChecked = REVIEW_ITEMS.every(item => checked[item.id]);

  function toggle(id: string) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <p className="font-mono text-[8px] uppercase tracking-wider text-amber-400/70 mb-3">Founder Review Checklist</p>
      <div className="space-y-2">
        {REVIEW_ITEMS.map(item => (
          <label
            key={item.id}
            className="flex items-start gap-3 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={() => toggle(item.id)}
              className="mt-0.5 accent-[#C9A96E]"
            />
            <div>
              <span className={`text-xs font-medium ${checked[item.id] ? 'text-emerald-400/80' : 'text-white/60'} group-hover:text-white/80 transition-colors`}>
                {item.label}
              </span>
              <p className="text-[10px] text-white/35 mt-0.5">{item.detail}</p>
            </div>
          </label>
        ))}
      </div>
      {allChecked && (
        <p className="mt-3 font-mono text-[8px] uppercase tracking-wider text-emerald-400/50">
          ✓ All checks passed — ready to deliver
        </p>
      )}
    </div>
  );
}
