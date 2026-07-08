import * as React from "react";
import type { GetServerSideProps } from "next";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import { listPilotQueue, type PilotLifecycleState, type PilotQueueItem } from "@/lib/engagements/pilot-intake-store";

const STATES: PilotLifecycleState[] = ["SUBMITTED", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "RESUBMITTED", "HUMAN_REVIEW", "POTENTIALLY_SUITABLE", "ACCEPTED", "DECLINED", "SCOPING", "COMMERCIAL_CONTINUATION"];

type Props = { items: PilotQueueItem[]; activeStatus: PilotLifecycleState | "ALL" };

export default function OperatorPilotAdmin({ items, activeStatus }: Props) {
  const [rows, setRows] = React.useState(items);
  async function transition(reference: string, nextState: PilotLifecycleState) {
    const res = await fetch("/api/admin/operator-pilot", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, nextState, operatorNote: `Moved to ${nextState} from queue`, finalDecision: nextState }) });
    if (res.ok) setRows((prev) => prev.map((r) => r.reference === reference ? { ...r, reviewStatus: nextState, updatedAt: new Date().toISOString(), nextOperation: "State updated" } : r));
  }
  return (
    <AdminLayout title="Operator Pilot Queue">
      <main className="min-h-screen px-6 py-24 text-white" style={{ background: "#050506" }}>
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber-400/80">Operator Pilot</p>
          <h1 className="mt-3 font-serif text-4xl font-light">Review queue</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">A normal operator surface for triage, ageing, next action and controlled state progression. Final decisions require the admin-guarded route.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <a href="/admin/operator-pilot" className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${activeStatus === "ALL" ? "border-amber-400 text-amber-300" : "border-white/10 text-white/45"}`}>All</a>
            {STATES.map((s) => <a key={s} href={`/admin/operator-pilot?status=${s}`} className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${activeStatus === s ? "border-amber-400 text-amber-300" : "border-white/10 text-white/45"}`}>{s}</a>)}
          </div>
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.03] font-mono text-[10px] uppercase tracking-widest text-white/35">
                <tr><th className="px-4 py-3">Organisation</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Domain</th><th className="px-4 py-3">Materiality</th><th className="px-4 py-3">Deadline</th><th className="px-4 py-3">Confidential</th><th className="px-4 py-3">Evidence</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Age</th><th className="px-4 py-3">Next action</th><th className="px-4 py-3">Operate</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.reference} className="border-t border-white/8 align-top">
                    <td className="px-4 py-3 text-white/80">{r.intake.organisation}<div className="font-mono text-[10px] text-white/30">{r.reference}</div></td>
                    <td className="px-4 py-3 text-white/55">{r.intake.role}</td>
                    <td className="px-4 py-3 text-white/55">{r.intake.decisionDomain}</td>
                    <td className="px-4 py-3 text-white/55">{r.intake.materiality}</td>
                    <td className="px-4 py-3 text-white/55">{r.intake.decisionDeadline ?? "—"}</td>
                    <td className="px-4 py-3 text-white/55">{r.intake.confidentialityRequired ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-white/55">{r.evidencePosture}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-amber-300">{r.reviewStatus}</td>
                    <td className="px-4 py-3 text-white/55">{r.owner ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-white/55">{r.ageHours}h</td>
                    <td className="px-4 py-3 text-white/55">{r.nextOperation}</td>
                    <td className="px-4 py-3"><div className="flex flex-col gap-1">{STATES.filter((s) => s !== r.reviewStatus).slice(0, 5).map((s) => <button key={s} onClick={() => transition(r.reference, s)} className="border border-white/10 px-2 py-1 text-left font-mono text-[9px] uppercase tracking-wider text-white/45 hover:border-amber-400/50 hover:text-amber-300">{s}</button>)}</div></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-white/35">No pilot intakes match this filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdminPage<Props>(ctx);
  if (!guard.authorized) return guard.redirect;
  const status = typeof ctx.query.status === "string" && STATES.includes(ctx.query.status as PilotLifecycleState) ? ctx.query.status as PilotLifecycleState : undefined;
  return { props: { items: JSON.parse(JSON.stringify(listPilotQueue({ status }))), activeStatus: status ?? "ALL" } };
};
