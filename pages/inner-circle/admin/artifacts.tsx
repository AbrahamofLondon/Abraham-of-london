/* pages/inner-circle/admin/artifacts.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { Archive, Database, Download } from "lucide-react";

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

const AdminArtifactsPage: NextPage<Props> = ({ items }) => {
  const providerCount = new Set(items.map((x) => safeString(x.storageProvider))).size;
  const diagnosticCount = new Set(items.map((x) => safeString(x.diagnosticRef))).size;

  return (
    <Layout title="Artefact Registry | Abraham of London">
      <main className="min-h-screen bg-black p-8 text-slate-200">
        <header className="mb-12 border-l-4 border-amber-500 pl-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            Artefact <span className="text-amber-500">Registry</span>
          </h1>
          <p className="mt-1 text-xs font-mono uppercase tracking-widest text-slate-500">
            Persistent report binaries, versions, and storage locations
          </p>
        </header>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl border border-slate-900 bg-slate-950 p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Total artefacts
            </div>
            <div className="mt-3 text-3xl font-serif text-white">{items.length}</div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950 p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Providers
            </div>
            <div className="mt-3 text-3xl font-serif text-white">{providerCount}</div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950 p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Diagnostics
            </div>
            <div className="mt-3 text-3xl font-serif text-white">{diagnosticCount}</div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950 p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Binary class
            </div>
            <div className="mt-3 text-3xl font-serif text-white">PDF</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <Archive className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-black uppercase tracking-widest text-slate-300">
                Stored artefacts
              </span>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              immutable registry
            </span>
          </div>

          <div className="divide-y divide-white/5">
            {items.map((item) => (
              <div
                key={item.artifactId}
                className="px-6 py-5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.6fr_0.6fr]">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-blue-400">
                      {item.diagnosticRef}
                    </div>

                    <div className="mt-1 font-medium text-white">
                      {item.fileName}
                    </div>

                    <div className="mt-1 break-all text-xs text-slate-500">
                      {item.objectKey}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      Version
                    </div>
                    <div className="mt-1 text-slate-200">{item.version}</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      Storage
                    </div>
                    <div className="mt-1 text-slate-200">
                      {item.storageProvider}
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

                  <div className="flex items-center lg:justify-end">
                    <Link
                      href={`/inner-circle/reports/${encodeURIComponent(
                        item.diagnosticRef,
                      )}`}
                      className="inline-flex items-center gap-2 border border-white/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/80 hover:bg-white/[0.04]"
                    >
                      Open
                      <Download className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  <span>
                    Created {new Date(item.createdAt).toLocaleString("en-GB")}
                  </span>
                  <span>SHA {safeString(item.sha256).slice(0, 16)}…</span>
                  <span>{item.mimeType}</span>
                  <span>{item.artifactId}</span>
                  {item.createdBy ? <span>By {item.createdBy}</span> : null}
                </div>
              </div>
            ))}

            {!items.length ? (
              <div className="px-6 py-20 text-center text-slate-500">
                <Database className="mx-auto mb-4 h-10 w-10 text-slate-700" />
                No artefacts archived yet.
              </div>
            ) : null}
          </div>
        </div>
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