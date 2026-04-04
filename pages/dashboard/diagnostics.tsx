import * as React from "react";
import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import Layout from "@/components/Layout";
import type { DiagnosticRecordDTO } from "@/lib/diagnostics/types";

const DiagnosticsDashboardPage: NextPage = () => {
  const { data: session, status } = useSession();
  const [records, setRecords] = React.useState<DiagnosticRecordDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/diagnostics/my-records");
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.reason || "FAILED_TO_LOAD");
        }

        setRecords(Array.isArray(json.records) ? json.records : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "FAILED_TO_LOAD");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      void load();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  async function buyReport(recordId: string, reportTier: "standard" | "premium") {
    try {
      setBusyId(recordId);
      const res = await fetch("/api/diagnostics/create-report-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosticRecordId: recordId, reportTier }),
      });

      const json = await res.json();
      if (!res.ok || !json?.url) {
        throw new Error(json?.reason || "CHECKOUT_FAILED");
      }

      window.location.href = json.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusyId(null);
    }
  }

  function downloadReport(recordId: string) {
    window.open(`/api/diagnostics/report/${encodeURIComponent(recordId)}`, "_blank");
  }

  return (
    <Layout title="Diagnostics Dashboard" className="bg-black text-white" fullWidth>
      <main className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.25em] text-amber-400">
            Client Dashboard
          </div>
          <h1 className="mt-3 text-4xl font-serif">Diagnostics</h1>
          <p className="mt-4 max-w-2xl text-white/60">
            Your recorded diagnostics, report status, and premium report actions.
          </p>
        </div>

        {status === "loading" || loading ? (
          <div className="border border-white/10 bg-white/[0.03] p-8 text-white/60">
            Loading…
          </div>
        ) : !session?.user ? (
          <div className="border border-white/10 bg-white/[0.03] p-8 text-white/60">
            Sign in to view your diagnostics.
          </div>
        ) : error ? (
          <div className="border border-red-500/20 bg-red-500/10 p-8 text-red-200">
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.03] p-8 text-white/60">
            No diagnostics recorded yet.
          </div>
        ) : (
          <div className="grid gap-6">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400">
                      {record.diagnosticType}
                    </div>
                    <h2 className="mt-2 text-2xl font-serif">
                      {record.title || "Diagnostic Record"}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/60">
                      <span>Ref: {record.id}</span>
                      <span>Score: {record.score}%</span>
                      <span>Severity: {record.severity}</span>
                      <span>Status: {record.reportStatus}</span>
                    </div>
                    <p className="mt-4 text-white/70">{record.verdict}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {["paid", "generated"].includes(record.reportStatus) ? (
                      <button
                        onClick={() => downloadReport(record.id)}
                        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-xs uppercase tracking-[0.18em] text-emerald-300"
                      >
                        Download Report
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => buyReport(record.id, "standard")}
                          disabled={busyId === record.id}
                          className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/85"
                        >
                          Buy Standard Report
                        </button>
                        <button
                          onClick={() => buyReport(record.id, "premium")}
                          disabled={busyId === record.id}
                          className="rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-xs uppercase tracking-[0.18em] text-amber-300"
                        >
                          Buy Premium Report
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
};

export default DiagnosticsDashboardPage;