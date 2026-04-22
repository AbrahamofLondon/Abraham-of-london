import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import {
  getCommercialValidationDashboard,
  PRODUCT_CLASSES,
  VALIDATION_CHECKS,
  type ProductClass,
  type ValidationStatus,
} from "@/lib/admin/commercial-validation";

type DashboardData = Awaited<ReturnType<typeof getCommercialValidationDashboard>>;

type PageProps = {
  initialData: DashboardData;
};

const GOLD = "#C9A96E";

function statusColor(status: ValidationStatus): string {
  if (status === "PASS") return "rgba(110,231,183,0.85)";
  if (status === "FAIL") return "rgba(252,165,165,0.92)";
  return "rgba(251,191,36,0.88)";
}

function statusLabel(status: ValidationStatus): string {
  if (status === "PASS") return "GO";
  if (status === "FAIL") return "NO-GO";
  return "INCOMPLETE";
}

function cellText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="font-mono text-[8px] uppercase tracking-[0.32em] text-white/48">
          {title}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatusPill({ status }: { status: ValidationStatus }) {
  return (
    <span
      className="inline-flex min-w-[88px] justify-center border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.22em]"
      style={{
        borderColor: statusColor(status),
        color: statusColor(status),
        backgroundColor: status === "FAIL" ? "rgba(252,165,165,0.06)" : "transparent",
      }}
    >
      {status}
    </span>
  );
}

function LaunchBanner({ data }: { data: DashboardData }) {
  const status = data.launchStatus;
  return (
    <div
      className="border px-5 py-4"
      style={{
        borderColor: statusColor(status),
        backgroundColor: status === "FAIL" ? "rgba(127,29,29,0.18)" : "rgba(255,255,255,0.025)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.36em] text-white/42">
            Launch Status
          </div>
          <div
            className="mt-2 font-serif text-4xl font-light leading-none"
            style={{ color: statusColor(status) }}
          >
            {statusLabel(status)}
          </div>
        </div>
        <div className="max-w-3xl">
          <div className="font-mono text-[8px] uppercase tracking-[0.26em] text-white/40">
            Unresolved blockers
          </div>
          <div className="mt-2 grid gap-1 text-[11px] leading-5 text-white/70 md:grid-cols-2">
            {data.blockers.slice(0, 10).map((blocker) => (
              <div key={blocker} className="border-l border-red-300/45 pl-2 text-red-100/80">
                {blocker}
              </div>
            ))}
            {data.blockers.length === 0 ? (
              <div className="text-emerald-200/80">No unresolved blockers recorded.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductMatrix({ data }: { data: DashboardData }) {
  return (
    <Panel title="Product-Class Validation Matrix">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse font-mono text-[10px]">
          <thead>
            <tr className="text-left text-white/38">
              <th className="border-b border-white/10 p-2">Product</th>
              {VALIDATION_CHECKS.map((check) => (
                <th key={check} className="border-b border-white/10 p-2 uppercase">
                  {check.replace(/_/g, " ")}
                </th>
              ))}
              <th className="border-b border-white/10 p-2">Final</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((product) => (
              <tr key={product.id} className="border-b border-white/[0.06]">
                <td className="p-2 text-white/82">
                  <div>{product.label}</div>
                  <div className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/32">
                    {product.activeEntitlements} active / {product.unresolvedFailures} failed
                  </div>
                </td>
                {product.checks.map((check) => (
                  <td key={`${product.id}-${check.check}`} className="p-2 align-top">
                    <StatusPill status={check.status as ValidationStatus} />
                    <div className="mt-1 max-w-[18ch] truncate text-[8px] text-white/32" title={check.evidence}>
                      {check.evidence || "no evidence"}
                    </div>
                  </td>
                ))}
                <td className="p-2">
                  <StatusPill status={product.final as ValidationStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function WebhookPanel({ data }: { data: DashboardData }) {
  return (
    <Panel title="Webhook Integrity Panel">
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-2">
          {data.globalChecks
            .filter((check) => check.check.includes("webhook") || check.check.includes("fake_session"))
            .map((check) => (
              <div key={check.check} className="flex items-start justify-between gap-3 border border-white/10 bg-black/30 p-3">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/62">
                    {check.check.replace(/_/g, " ")}
                  </div>
                  <div className="mt-1 text-[11px] leading-5 text-white/36">
                    {check.evidence || "Manual Stripe dashboard evidence required."}
                  </div>
                </div>
                <StatusPill status={check.status as ValidationStatus} />
              </div>
            ))}
        </div>
        <div className="max-h-[280px] overflow-auto border border-white/10">
          <table className="w-full font-mono text-[10px]">
            <thead className="sticky top-0 bg-black text-white/38">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentCheckoutAudits.map((row) => (
                <tr key={row.id} className="border-t border-white/[0.06]">
                  <td className="p-2 text-white/48">{new Date(row.createdAt).toLocaleString("en-GB")}</td>
                  <td className="p-2 text-white/62">{cellText(row.email)}</td>
                  <td className="p-2 text-white/62">{cellText((row.metadata as any).product)}</td>
                  <td className="p-2">
                    <StatusPill status={row.success ? "PASS" : "FAIL"} />
                  </td>
                </tr>
              ))}
              {data.recentCheckoutAudits.length === 0 ? (
                <tr>
                  <td className="p-3 text-white/38" colSpan={4}>No checkout audit events in the last 14 days.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

function FailedQueue({ data }: { data: DashboardData }) {
  return (
    <Panel title="Failed Entitlement Queue">
      <div className="max-h-[260px] overflow-auto">
        <table className="w-full font-mono text-[10px]">
          <thead className="text-left text-white/38">
            <tr>
              <th className="p-2">Created</th>
              <th className="p-2">Email</th>
              <th className="p-2">Slug</th>
              <th className="p-2">State</th>
              <th className="p-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {data.failedGrants.map((row) => (
              <tr key={row.id} className="border-t border-white/[0.06]">
                <td className="p-2 text-white/45">{new Date(row.createdAt).toLocaleString("en-GB")}</td>
                <td className="p-2 text-white/70">{row.email}</td>
                <td className="p-2 text-white/70">{row.slug}</td>
                <td className="p-2"><StatusPill status={row.resolved ? "PASS" : "FAIL"} /></td>
                <td className="p-2 text-red-100/65">{row.error}</td>
              </tr>
            ))}
            {data.failedGrants.length === 0 ? (
              <tr>
                <td className="p-3 text-white/38" colSpan={5}>No failed entitlement grants recorded.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ManualEntryForm({
  onSaved,
}: {
  onSaved: (data: DashboardData) => void;
}) {
  const [productClass, setProductClass] = React.useState<ProductClass | "global">("global");
  const [checkKey, setCheckKey] = React.useState("stripe_webhook_routing");
  const [status, setStatus] = React.useState<ValidationStatus>("INCOMPLETE");
  const [evidence, setEvidence] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productClass, checkKey, status, evidence, note }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Validation save failed");
      const refreshed = await fetch("/api/admin/validation");
      const refreshedJson = await refreshed.json();
      if (refreshedJson.ok) onSaved(refreshedJson.data);
      setEvidence("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation save failed");
    } finally {
      setBusy(false);
    }
  }

  const checkOptions = React.useMemo(
    () =>
      productClass === "global"
        ? [
            "stripe_webhook_routing",
            "fake_session_rejection",
            "failed_grant_recovery",
            "cancel_paths",
            "policy_consistency",
          ]
        : [...VALIDATION_CHECKS],
    [productClass],
  );

  React.useEffect(() => {
    setCheckKey(checkOptions[0] || "payment");
  }, [checkOptions]);

  return (
    <Panel title="Manual Validation Entry">
      <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[1fr_1fr_120px_1.4fr_1.4fr_auto]">
        <select value={productClass} onChange={(event) => setProductClass(event.target.value as ProductClass | "global")} className="border border-white/10 bg-black px-3 py-2 font-mono text-[11px] text-white">
          <option value="global">Global</option>
          {PRODUCT_CLASSES.map((product) => (
            <option key={product.id} value={product.id}>{product.label}</option>
          ))}
        </select>
        <select value={checkKey} onChange={(event) => setCheckKey(event.target.value)} className="border border-white/10 bg-black px-3 py-2 font-mono text-[11px] text-white">
          {checkOptions.map((check) => (
            <option key={check} value={check}>{check}</option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as ValidationStatus)} className="border border-white/10 bg-black px-3 py-2 font-mono text-[11px] text-white">
          <option value="INCOMPLETE">INCOMPLETE</option>
          <option value="PASS">PASS</option>
          <option value="FAIL">FAIL</option>
        </select>
        <input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Evidence reference" className="border border-white/10 bg-black px-3 py-2 font-mono text-[11px] text-white placeholder:text-white/25" />
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Operator note" className="border border-white/10 bg-black px-3 py-2 font-mono text-[11px] text-white placeholder:text-white/25" />
        <button disabled={busy} className="border border-amber-400/40 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-amber-300 disabled:opacity-50">
          Save
        </button>
      </form>
      {error ? <div className="mt-2 text-xs text-red-200">{error}</div> : null}
    </Panel>
  );
}

function EmailLookup({
  data,
  onLookup,
}: {
  data: DashboardData;
  onLookup: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = React.useState(data.emailLookup?.email || "");
  return (
    <Panel title="Email Lookup / Support Drill">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onLookup(email);
        }}
        className="flex gap-3"
      >
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="customer@example.com" className="min-w-0 flex-1 border border-white/10 bg-black px-3 py-2 font-mono text-[11px] text-white placeholder:text-white/25" />
        <button className="border border-white/15 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/72">
          Lookup
        </button>
      </form>
      <div className="mt-4 max-h-[220px] overflow-auto border border-white/10">
        <table className="w-full font-mono text-[10px]">
          <thead className="text-left text-white/38">
            <tr>
              <th className="p-2">Product</th>
              <th className="p-2">Status</th>
              <th className="p-2">Source</th>
              <th className="p-2">Ends</th>
            </tr>
          </thead>
          <tbody>
            {(data.emailLookup?.entitlements || []).map((row) => (
              <tr key={row.id} className="border-t border-white/[0.06]">
                <td className="p-2 text-white/70">{row.productCode}</td>
                <td className="p-2 text-white/70">{row.status}</td>
                <td className="p-2 text-white/45">{row.source}</td>
                <td className="p-2 text-white/45">{row.endsAt || "lifetime"}</td>
              </tr>
            ))}
            {data.emailLookup && data.emailLookup.entitlements.length === 0 ? (
              <tr><td className="p-3 text-white/38" colSpan={4}>No entitlements for this email.</td></tr>
            ) : null}
            {!data.emailLookup ? (
              <tr><td className="p-3 text-white/38" colSpan={4}>Run lookup to inspect access state.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ValidationRunLog({ data }: { data: DashboardData }) {
  return (
    <Panel title="Validation Run Log">
      <div className="max-h-[320px] overflow-auto">
        <table className="w-full font-mono text-[10px]">
          <thead className="text-left text-white/38">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">Scope</th>
              <th className="p-2">Check</th>
              <th className="p-2">Status</th>
              <th className="p-2">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {data.validationRunLog.map((entry) => (
              <tr key={entry.id} className="border-t border-white/[0.06]">
                <td className="p-2 text-white/38">{new Date(entry.createdAt).toLocaleString("en-GB")}</td>
                <td className="p-2 text-white/62">{entry.productClass}</td>
                <td className="p-2 text-white/62">{entry.checkKey}</td>
                <td className="p-2"><StatusPill status={entry.status} /></td>
                <td className="p-2 text-white/45">{entry.evidence || entry.note || "-"}</td>
              </tr>
            ))}
            {data.validationRunLog.length === 0 ? (
              <tr><td className="p-3 text-white/38" colSpan={5}>No manual validation entries recorded.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function AdminValidationPage({ initialData }: PageProps) {
  const [data, setData] = React.useState(initialData);

  async function lookup(email: string) {
    const response = await fetch(`/api/admin/validation?email=${encodeURIComponent(email)}`);
    const result = await response.json();
    if (result.ok) setData(result.data);
  }

  return (
    <AdminLayout title="Live Commercial Validation">
      <Head>
        <title>Commercial Validation | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="space-y-5">
        <LaunchBanner data={data} />
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <ProductMatrix data={data} />
          <div className="space-y-5">
            <WebhookPanel data={data} />
            <FailedQueue data={data} />
          </div>
        </div>
        <ManualEntryForm onSaved={setData} />
        <div className="grid gap-5 xl:grid-cols-2">
          <EmailLookup data={data} onLookup={lookup} />
          <ValidationRunLog data={data} />
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect;
  const email = typeof ctx.query.email === "string" ? ctx.query.email : null;
  const initialData = await getCommercialValidationDashboard(email);
  return { props: { initialData } };
};
