import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import type { DeliveryRecord } from "@/lib/product/delivery-audit-contract";

type PageProps = {
  initialDeliveries: DeliveryRecord[];
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

function statusColour(status: DeliveryRecord["status"]): string {
  switch (status) {
    case "QUEUED":
      return "rgba(201,169,110,0.70)";
    case "APPROVED":
      return "rgba(110,200,160,0.70)";
    case "DELIVERED":
      return "rgba(110,200,160,1)";
    case "FAILED":
      return "rgba(252,165,165,0.70)";
    case "TRANSPORT_PENDING":
      return "rgba(255,255,255,0.40)";
    default:
      return "rgba(255,255,255,0.40)";
  }
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const { listAllDeliveries } = await import("@/lib/product/oversight-delivery-service");
  const deliveries = await listAllDeliveries();

  return {
    props: {
      initialDeliveries: deliveries,
    },
  };
};

export default function DeliveryQueuePage({
  initialDeliveries,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [deliveries, setDeliveries] = React.useState<DeliveryRecord[]>(initialDeliveries);
  const [loading, setLoading] = React.useState<string | null>(null);

  async function refresh() {
    try {
      const resp = await fetch("/api/admin/delivery-queue");
      const data = await resp.json();
      if (data.ok) setDeliveries(data.deliveries);
    } catch {
      // silent
    }
  }

  async function handleAction(deliveryId: string, action: string) {
    setLoading(deliveryId);
    try {
      await fetch("/api/admin/delivery-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId, action }),
      });
      await refresh();
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  }

  return (
    <AdminLayout title="Delivery Queue">
      <Head>
        <title>Delivery Queue | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="space-y-6 text-white">
        <section className="border border-white/10 bg-white/5 p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/70">
            Oversight Delivery
          </p>
          <h1 className="mt-3 font-serif text-3xl">Delivery Queue</h1>
          <p className="mt-2 text-sm text-white/50">
            Manage pending and completed artifact deliveries. Approve before dispatch.
          </p>
          <button
            onClick={refresh}
            className="mt-4 border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200"
          >
            Refresh
          </button>
        </section>

        <section className="overflow-x-auto border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[9px] uppercase tracking-[0.2em] text-white/40" style={mono}>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Client Safe</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Delivered</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-white/30">
                    No delivery records found.
                  </td>
                </tr>
              )}
              {deliveries.map((d) => (
                <tr key={d.id} className="border-b border-white/[0.06]">
                  <td className="px-4 py-3" style={{ ...mono, fontSize: "10px" }}>
                    {d.artifactType}
                  </td>
                  <td className="px-4 py-3 text-white/70">{d.recipientEmail}</td>
                  <td className="px-4 py-3" style={{ ...mono, fontSize: "10px" }}>
                    {d.deliveryMethod}
                  </td>
                  <td className="px-4 py-3" style={{ ...mono, fontSize: "10px", color: statusColour(d.status) }}>
                    {d.status}
                  </td>
                  <td className="px-4 py-3 text-white/50">{d.clientSafe ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-white/50">{d.approvedBy ?? "—"}</td>
                  <td className="px-4 py-3 text-white/40" style={{ ...mono, fontSize: "10px" }}>
                    {new Date(d.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 text-white/40" style={{ ...mono, fontSize: "10px" }}>
                    {d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {(d.status === "QUEUED" || d.status === "TRANSPORT_PENDING") && (
                        <button
                          onClick={() => handleAction(d.id, "approve")}
                          disabled={loading === d.id}
                          className="border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200 disabled:opacity-40"
                        >
                          {loading === d.id ? "..." : "Approve"}
                        </button>
                      )}
                      {d.artifactType === "OVERSIGHT_BRIEF" && (
                        <form
                          method="POST"
                          action="/api/pdf/oversight-brief"
                          target="_blank"
                          onSubmit={(e) => {
                            // POST form submission to download PDF
                            e.preventDefault();
                            const form = e.currentTarget;
                            const formData = new FormData(form);
                            fetch(form.action, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: formData.get("email") }),
                            })
                              .then((r) => r.blob())
                              .then((blob) => {
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `oversight-brief-${d.artifactId}.pdf`;
                                a.click();
                                URL.revokeObjectURL(url);
                              });
                          }}
                        >
                          <input type="hidden" name="email" value={d.recipientEmail} />
                          <button
                            type="submit"
                            className="border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50"
                          >
                            Download PDF
                          </button>
                        </form>
                      )}
                      {d.artifactType === "PROOF_PACK" && (
                        <button
                          onClick={() => {
                            fetch("/api/pdf/proof-pack", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: d.recipientEmail }),
                            })
                              .then((r) => r.blob())
                              .then((blob) => {
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `proof-pack-${d.recipientEmail}.pdf`;
                                a.click();
                                URL.revokeObjectURL(url);
                              });
                          }}
                          className="border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50"
                        >
                          Download PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AdminLayout>
  );
}
