/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import {
  Archive,
  Database,
  Download,
  FileText,
  HardDrive,
  ShieldCheck,
} from "lucide-react";

import Layout from "@/components/layout/Layout";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import {
  getSessionContext,
  tierAtLeast,
} from "@/lib/server/auth/tokenStore.postgres";
import { readArtifactRegistry } from "@/lib/server/diagnostics/artifact-registry";

type ArtifactRow = {
  artifactId: string;
  diagnosticRef: string;
  version: string;
  fileName: string;
  mimeType: string;
  byteLength: number;
  sha256: string;
  storageProvider: string;
  objectKey: string;
  createdAt: string;
  createdBy: string | null;
};

type Props = {
  items: ArtifactRow[];
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = n;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatDate(value: string): string {
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) return "—";
  return ts.toLocaleString("en-GB");
}

const AdminArtifactsPage: NextPage<Props> = ({ items }) => {
  const providerCount = new Set(
    items.map((x) => safeString(x.storageProvider)).filter(Boolean),
  ).size;

  const diagnosticCount = new Set(
    items.map((x) => safeString(x.diagnosticRef)).filter(Boolean),
  ).size;

  const totalBytes = items.reduce(
    (sum, item) => sum + safeNumber(item.byteLength, 0),
    0,
  );

  return (
    <Layout title="Artifact Registry | Abraham of London">
      <main className="min-h-screen bg-[#040507] text-slate-200">
        <section className="border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_22%)]">
          <div className="mx-auto max-w-7xl px-8 pb-14 pt-16">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/90">
                <Archive className="h-3.5 w-3.5" />
                Inner Circle Admin • Artifact Registry
              </div>

              <h1 className="mt-7 text-4xl font-black tracking-tight text-white md:text-6xl">
                Governed artifact
                <span className="text-amber-500"> registry</span>
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-400 md:text-base">
                This registry surfaces archived binaries, immutable references,
                storage locations, and issuance lineage for the protected report
                layer. Quiet infrastructure. Serious utility.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/5 bg-slate-950/90 p-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Total artifacts
              </div>
              <div className="mt-3 text-3xl font-serif text-white">
                {items.length}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/90 p-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Providers
              </div>
              <div className="mt-3 text-3xl font-serif text-white">
                {providerCount}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/90 p-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Diagnostics
              </div>
              <div className="mt-3 text-3xl font-serif text-white">
                {diagnosticCount}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/90 p-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Stored volume
              </div>
              <div className="mt-3 text-3xl font-serif text-white">
                {formatBytes(totalBytes)}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-16">
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/90 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-3 border-b border-white/5 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-black uppercase tracking-widest text-slate-300">
                  Stored artifacts
                </span>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" />
                immutable registry
              </div>
            </div>

            {!items.length ? (
              <div className="px-6 py-20 text-center text-slate-500">
                <HardDrive className="mx-auto mb-4 h-10 w-10 text-slate-700" />
                No artifacts archived yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {items.map((item) => (
                  <div
                    key={item.artifactId}
                    className="px-6 py-5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.75fr_0.75fr_0.6fr_0.8fr]">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-blue-400">
                          {item.diagnosticRef || "unscoped"}
                        </div>

                        <div className="mt-1 flex items-center gap-2 font-medium text-white">
                          <FileText className="h-4 w-4 text-amber-400/80" />
                          <span className="truncate">{item.fileName}</span>
                        </div>

                        <div className="mt-2 break-all text-xs text-slate-500">
                          {item.objectKey || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                          Version
                        </div>
                        <div className="mt-1 text-slate-200">
                          {item.version || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                          Storage
                        </div>
                        <div className="mt-1 text-slate-200">
                          {item.storageProvider || "local"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                          Size
                        </div>
                        <div className="mt-1 text-slate-200">
                          {formatBytes(item.byteLength)}
                        </div>
                      </div>

                      <div className="flex items-center xl:justify-end">
                        <Link
                          href={`/inner-circle/reports/${encodeURIComponent(
                            item.diagnosticRef,
                          )}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/[0.04]"
                        >
                          Open
                          <Download className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      <span>Created {formatDate(item.createdAt)}</span>
                      <span>SHA {safeString(item.sha256).slice(0, 16) || "—"}…</span>
                      <span>{item.mimeType || "application/octet-stream"}</span>
                      <span>{item.artifactId || "—"}</span>
                      {item.createdBy ? <span>By {item.createdBy}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  try {
    const sessionId = readAccessCookie(context.req as any);

    if (!sessionId) {
      return {
        redirect: {
          destination: `/inner-circle?returnTo=${encodeURIComponent(
            context.resolvedUrl,
          )}`,
          permanent: false,
        },
      };
    }

    const ctx = await getSessionContext(sessionId);

    if (
      !ctx?.ok ||
      !ctx?.valid ||
      !tierAtLeast(safeString((ctx as any)?.tier, "public"), "private")
    ) {
      return {
        redirect: {
          destination: "/inner-circle/dashboard",
          permanent: false,
        },
      };
    }

    const registry = readArtifactRegistry();
    const rawItems = Array.isArray(registry?.items) ? registry.items : [];

    const items: ArtifactRow[] = rawItems
      .slice()
      .sort((a: any, b: any) =>
        safeString(b?.createdAt).localeCompare(safeString(a?.createdAt)),
      )
      .map((item: any) => ({
        artifactId: safeString(item?.artifactId),
        diagnosticRef: safeString(item?.diagnosticRef),
        version: safeString(item?.version),
        fileName: safeString(item?.fileName, "diagnostic-report.pdf"),
        mimeType: safeString(item?.mimeType, "application/pdf"),
        byteLength: safeNumber(item?.byteLength, 0),
        sha256: safeString(item?.sha256),
        storageProvider: safeString(item?.storageProvider, "local"),
        objectKey: safeString(item?.objectKey),
        createdAt: safeString(item?.createdAt),
        createdBy: safeString(item?.createdBy) || null,
      }));

    return {
      props: {
        items: JSON.parse(JSON.stringify(items)),
      },
    };
  } catch (error) {
    console.error("[inner-circle/admin/artifacts]", error);

    return {
      props: {
        items: [],
      },
    };
  }
};

export default AdminArtifactsPage;