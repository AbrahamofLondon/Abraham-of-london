import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { AlertTriangle, GitBranch, Link2, RefreshCcw } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import { canAccessProvenanceOperation } from "@/lib/admin/provenance-access-policy";
import type { ProvenanceChainAnchorRecord } from "@/lib/admin/provenance-chain-ledger";

type ChainStatus = "CONTINUOUS" | "BROKEN" | "UNAVAILABLE";

type AnchorSummary = {
  id: string;
  scope: string;
  scopeId: string;
  leafCount: number;
  merkleRoot: string;
  previousRoot: string | null;
  chainHash: string;
  computedAt: string;
  status: ChainStatus;
  failures: Array<{ anchorId?: string; reason: string }>;
};

type PageProps = {
  anchors: AnchorSummary[];
  generatedAt: string;
};

export function shortenAnchorHash(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function mapAnchor(row: {
  id: string;
  version: number;
  scope: string;
  scopeId: string;
  leafCount: number;
  merkleRoot: string;
  previousRoot: string | null;
  chainHash: string;
  computedAt: Date | string;
  fromTimestamp?: Date | string | null;
  toTimestamp?: Date | string | null;
}): ProvenanceChainAnchorRecord {
  return {
    id: row.id,
    version: 1,
    scope: row.scope,
    scopeId: row.scopeId,
    leafCount: row.leafCount,
    merkleRoot: row.merkleRoot,
    previousRoot: row.previousRoot ?? null,
    chainHash: row.chainHash,
    computedAt: toIso(row.computedAt) ?? "",
    fromTimestamp: toIso(row.fromTimestamp) ?? null,
    toTimestamp: toIso(row.toTimestamp) ?? null,
  };
}

function statusTone(status: ChainStatus): string {
  switch (status) {
    case "CONTINUOUS":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
    case "BROKEN":
      return "border-rose-500/25 bg-rose-500/10 text-rose-300";
    case "UNAVAILABLE":
      return "border-white/10 bg-white/5 text-white/35";
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const policy = canAccessProvenanceOperation(guard, "VIEW_FULL_PROVENANCE");
  if (!policy.allowed) {
    return {
      redirect: {
        destination: "/auth/access-denied",
        permanent: false,
      },
    };
  }

  const [{ prisma }, { verifyProvenanceChainSequence }] = await Promise.all([
    import("@/lib/prisma.server"),
    import("@/lib/admin/provenance-chain-ledger"),
  ]);

  const rows = await prisma.provenanceChainAnchor.findMany({
    orderBy: [
      { computedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 25,
    select: {
      id: true,
      version: true,
      scope: true,
      scopeId: true,
      leafCount: true,
      merkleRoot: true,
      previousRoot: true,
      chainHash: true,
      computedAt: true,
      fromTimestamp: true,
      toTimestamp: true,
    },
  });

  const pairs = Array.from(new Set(rows.map((row) => `${row.scope}\u0000${row.scopeId}`)));
  const statusByPair = new Map<string, { status: ChainStatus; failures: AnchorSummary["failures"] }>();

  await Promise.all(pairs.map(async (pair) => {
    const [scope, scopeId] = pair.split("\u0000");
    const chainRows = await prisma.provenanceChainAnchor.findMany({
      where: { scope, scopeId },
      orderBy: [
        { computedAt: "asc" },
        { id: "asc" },
      ],
      take: 250,
      select: {
        id: true,
        version: true,
        scope: true,
        scopeId: true,
        leafCount: true,
        merkleRoot: true,
        previousRoot: true,
        chainHash: true,
        computedAt: true,
        fromTimestamp: true,
        toTimestamp: true,
      },
    });
    const anchors = chainRows.map(mapAnchor);
    const verification = anchors.length > 0
      ? verifyProvenanceChainSequence(anchors)
      : { valid: false, failures: [] };
    statusByPair.set(pair, {
      status: anchors.length === 0 ? "UNAVAILABLE" : verification.valid ? "CONTINUOUS" : "BROKEN",
      failures: verification.failures,
    });
  }));

  return {
    props: {
      generatedAt: new Date().toISOString(),
      anchors: rows.map((row) => {
        const pair = `${row.scope}\u0000${row.scopeId}`;
        const status = statusByPair.get(pair) ?? { status: "UNAVAILABLE" as const, failures: [] };
        return {
          id: row.id,
          scope: row.scope,
          scopeId: row.scopeId,
          leafCount: row.leafCount,
          merkleRoot: row.merkleRoot,
          previousRoot: row.previousRoot,
          chainHash: row.chainHash,
          computedAt: row.computedAt.toISOString(),
          status: status.status,
          failures: status.failures,
        };
      }),
    },
  };
};

function ManualAnchorForm() {
  const [scope, setScope] = React.useState("DAILY");
  const [scopeId, setScopeId] = React.useState("");
  const [limit, setLimit] = React.useState("50");
  const [fromTimestamp, setFromTimestamp] = React.useState("");
  const [toTimestamp, setToTimestamp] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/provenance/create-anchor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          scopeId,
          limit,
          fromTimestamp: fromTimestamp || undefined,
          toTimestamp: toTimestamp || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Anchor creation failed");
      }
      setResult(data.status === "ANCHORED"
        ? `Anchor created: ${shortenAnchorHash(data.anchor?.chainHash)} (${data.leafCount} leaves, ${data.unavailableCount} unavailable).`
        : `No anchor created: ${data.reason ?? "No valid leaves available."}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Anchor creation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-white/10 bg-zinc-950/70 p-5">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
          Manual Anchor Creation
        </p>
        <p className="mt-1 text-sm text-white/45">
          Creates an internal chain anchor from existing oversight-cycle provenance hashes only.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/30">Scope</span>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="w-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="DAILY">DAILY</option>
            <option value="ACCOUNT">ACCOUNT</option>
            <option value="ORGANISATION">ORGANISATION</option>
            <option value="CYCLE_BATCH">CYCLE_BATCH</option>
          </select>
        </label>
        <label className="space-y-1 xl:col-span-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/30">Scope ID</span>
          <input
            value={scopeId}
            onChange={(event) => setScopeId(event.target.value)}
            placeholder={scope === "DAILY" ? "2026-05-14" : "account, organisation, or cycle id"}
            className="w-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/30">Limit</span>
          <input
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            inputMode="numeric"
            className="w-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="self-end border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-100 disabled:opacity-50"
        >
          {busy ? "Creating" : "Create Anchor"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/30">From timestamp</span>
          <input
            value={fromTimestamp}
            onChange={(event) => setFromTimestamp(event.target.value)}
            placeholder="Optional ISO timestamp"
            className="w-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/30">To timestamp</span>
          <input
            value={toTimestamp}
            onChange={(event) => setToTimestamp(event.target.value)}
            placeholder="Optional ISO timestamp"
            className="w-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>

      {result && <p className="border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100/75">{result}</p>}
      {error && <p className="border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100/75">{error}</p>}
    </form>
  );
}

export default function ProvenanceChainPage({
  anchors,
  generatedAt,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const continuous = anchors.filter((anchor) => anchor.status === "CONTINUOUS").length;
  const broken = anchors.filter((anchor) => anchor.status === "BROKEN").length;

  return (
    <AdminLayout title="Provenance Chain">
      <Head>
        <title>Provenance Chain | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-amber-400/80" />
                <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-400/70">
                  Security & Audit
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl text-white">Provenance Chain Operations</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/55">
                Internal append-only chain anchor ledger. This is not external WORM storage or blockchain anchoring.
              </p>
            </div>
            <a
              href="/admin/provenance-chain"
              className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/45 hover:text-white/70"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </a>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="border border-white/10 bg-zinc-950/70 p-4">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">Latest anchors</p>
            <p className="mt-2 text-2xl font-light text-white">{anchors.length}</p>
          </div>
          <div className="border border-white/10 bg-zinc-950/70 p-4">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">Continuous scopes</p>
            <p className="mt-2 text-2xl font-light text-emerald-300">{continuous}</p>
          </div>
          <div className="border border-white/10 bg-zinc-950/70 p-4">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">Broken scopes</p>
            <p className="mt-2 text-2xl font-light text-rose-300">{broken}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-sm text-amber-100/75">
            Manual anchor creation reads existing oversight-cycle provenance and stores only safe anchor metadata:
            roots, linkage hashes, counts, timestamps, and unavailable counts.
          </p>
        </div>

        <ManualAnchorForm />

        <section className="border border-white/10 bg-zinc-950/70">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-white/30" />
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
                Latest Chain Anchors
              </p>
            </div>
            <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/25">
              {formatTime(generatedAt)}
            </p>
          </div>

          {anchors.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-white/35">
              No provenance chain anchors recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-black/30">
                    {["Status", "Scope", "Scope ID", "Leaves", "Merkle root", "Previous root", "Chain hash", "Computed"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {anchors.map((anchor) => (
                    <tr key={anchor.id} className="border-t border-white/5 align-top hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <span className={`inline-flex border px-2 py-1 text-[8px] font-mono uppercase tracking-[0.16em] ${statusTone(anchor.status)}`}>
                          {anchor.status}
                        </span>
                        {anchor.failures.length > 0 && (
                          <p className="mt-1 max-w-xs text-[10px] text-rose-200/60">
                            {anchor.failures[0]?.reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-white/70">{anchor.scope}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-white/45">{anchor.scopeId}</td>
                      <td className="px-4 py-3 text-sm text-white/60">{anchor.leafCount}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-white/45" title={anchor.merkleRoot}>
                        {shortenAnchorHash(anchor.merkleRoot)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-white/45" title={anchor.previousRoot ?? undefined}>
                        {shortenAnchorHash(anchor.previousRoot)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-white/45" title={anchor.chainHash}>
                        {shortenAnchorHash(anchor.chainHash)}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/45">{formatTime(anchor.computedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
