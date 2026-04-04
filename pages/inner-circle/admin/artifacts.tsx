/* pages/inner-circle/admin/artifacts.tsx */
import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import {
  Archive,
  Database,
  Download,
  ShieldCheck,
} from "lucide-react";

import Layout from "@/components/layout/Layout";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { readArtifactRegistry } from "@/lib/server/diagnostics/artifact-registry";

type Props = {
  items: Array<{
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
  }>;
};

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export default function AdminArtifactsPage({ items }: Props) {
  return (
    <Layout title="Artefact Registry | Abraham of London">
      <main className="min-h-screen bg-black text-slate-200 p-8">
        <header className="mb-12 border-l-4 border-amber-500 pl-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            Artefact <span className="text-amber-500">Registry</span>
          </h1>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
            Persistent report binaries, versions, and storage locations
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-xl">
            <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Total artefacts</div>
            <div className="mt-3 text-3xl font-serif text-white">{items.length}</div>
          </div>
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-xl">
            <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Providers</div>
            <div className="mt-3 text-3xl font-serif text-white">
              {new Set(items.map((x) => x.storageProvider)).size}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-xl">
            <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Diagnostics</div>
            <div className="mt-3 text-3xl font-serif text-white">
              {new Set(items.map((x) => x.diagnosticRef)).size}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-xl">
            <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Binary class</div>
            <div className="mt-3 text-3xl font-serif text-white">PDF</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
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
              <div key={item.artifactId} className="px-6 py-5 hover:bg-white/[0.02] transition-colors">
                <div className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.6fr_0.6fr]">
                  <div>
                    <div className="text-blue-400 text-[10px] font-mono uppercase tracking-widest">
                      {item.diagnosticRef}
                    </div>
                    <div className="mt-1 text-white font-medium">
                      {item.fileName}
                    </div>
                    <div className="mt-1 text-slate-500 text-xs break-all">
                      {item.objectKey}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Version</div>
                    <div className="mt-1 text-slate-200">{item.version}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Storage</div>
                    <div className="mt-1 text-slate-200">{item.storageProvider}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Size</div>
                    <div className="mt-1 text-slate-200">{formatBytes(item.byteLength)}</div>
                  </div>

                  <div className="flex items-center lg:justify-end">
                    <Link
                      href={`/inner-circle/reports/${encodeURIComponent(item.diagnosticRef)}`}
                      className="inline-flex items-center gap-2 border border-white/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/80 hover:bg-white/[0.04]"
                    >
                      Open
                      <Download className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  <span>Created {new Date(item.createdAt).toLocaleString("en-GB")}</span>
                  <span>SHA {item.sha256.slice(0, 16)}…</span>
                  <span>{item.mimeType}</span>
                  <span>{item.artifactId}</span>
                  {item.createdBy ? <span>By {item.createdBy}</span> : null}
                </div>
              </div>
            ))}

            {!items.length ? (
              <div className="px-6 py-20 text-center text-slate-500">
                <Database className="mx-auto h-10 w-10 mb-4 text-slate-700" />
                No artefacts archived yet.
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  try {
    const sessionId = readAccessCookie(context.req as any);
    if (!sessionId) {
      return {
        redirect: {
          destination: `/inner-circle?returnTo=${encodeURIComponent(context.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    const ctx = await getSessionContext(sessionId);
    if (!ctx?.ok || !ctx?.valid || !tierAtLeast(String(ctx.tier || "public"), "private")) {
      return {
        redirect: {
          destination: "/inner-circle/dashboard",
          permanent: false,
        },
      };
    }

    const registry = readArtifactRegistry();

    return {
      props: {
        items: registry.items
          .slice()
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
          .map((item) => ({
            artifactId: item.artifactId,
            diagnosticRef: item.diagnosticRef,
            version: item.version,
            fileName: item.fileName,
            mimeType: item.mimeType,
            byteLength: item.byteLength,
            sha256: item.sha256,
            storageProvider: item.storageProvider,
            objectKey: item.objectKey,
            createdAt: item.createdAt,
            createdBy: item.createdBy ?? null,
          })),
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