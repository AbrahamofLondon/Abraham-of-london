// pages/admin/redis.tsx
import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import AdminLayout from "@/components/admin/AdminLayout";

// SSR: enforces admin auth before rendering.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.ok) return { redirect: { ...auth.redirect, permanent: false } };
  return { props: {} };
};

const RedisDiagnostic: NextPage = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vault/status")
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Redis diagnostic endpoint unavailable");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Redis Diagnostics">
        <div className="flex min-h-[420px] items-center justify-center bg-[#050505]">
          <div className="text-amber-700/50 font-mono text-xs">DIAGNOSTIC SCAN...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!status) {
    return (
      <AdminLayout title="Redis Diagnostics">
        <div className="bg-[#050505] p-8 font-mono">
          <div className="mx-auto max-w-3xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100/80">
            Redis diagnostic unavailable{error ? `: ${error}` : "."}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Redis Diagnostics">
    <div className="bg-[#050505] p-8 font-mono">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <span className="h-[1px] w-12 bg-amber-800/50" />
          <h1 className="text-amber-600/80 text-xs uppercase tracking-[0.3em]">
            🔧 Redis Diagnostic
          </h1>
        </div>
        
        <div className="space-y-4">
          <div className="border border-white/10 bg-black/60 backdrop-blur-sm p-6 rounded-2xl">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-amber-700/60 mb-4">
              Connection Status
            </h2>
            <div className={`${status.redis?.connected ? 'text-emerald-500' : 'text-red-500'} font-mono text-sm`}>
              {status.redis?.connected ? '✓ ACTIVE' : '✗ OFFLINE'}
            </div>
            {status.redis?.error && (
              <div className="text-red-500/70 text-xs mt-3 font-mono">
                {status.redis.error}
              </div>
            )}
          </div>

          <div className="border border-white/10 bg-black/60 backdrop-blur-sm p-6 rounded-2xl">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-amber-700/60 mb-4">
              Metrics
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-zinc-500">PING</span>
                <span className={status.redis?.ping ? 'text-emerald-500' : 'text-red-500'}>
                  {status.redis?.ping ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-zinc-500">KEYS</span>
                <span className="text-amber-600/80">
                  {typeof status.redis?.keys === "number" ? status.redis.keys : "Unavailable"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">MEMORY</span>
                <span className="text-amber-600/80">{status.redis?.memory ?? 'Unavailable'}</span>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-black/60 backdrop-blur-sm p-6 rounded-2xl">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-amber-700/60 mb-4">
              Asset Registry
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-zinc-500">DISK</span>
                <span className="text-amber-600/80">
                  {typeof status.disk?.assets === "number" ? status.disk.assets : "Unavailable"}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-zinc-500">REDIS CACHE</span>
                <span className="text-amber-600/80">
                  {typeof status.redis?.keys === "number" ? status.redis.keys : "Unavailable"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">SYNC STATE</span>
                <span className={status.redis?.keys === status.disk?.assets ? 'text-emerald-500' : 'text-amber-500'}>
                  {status.redis?.keys === status.disk?.assets ? 'SYNCHRONIZED' : 'PARTIAL'}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-black/60 backdrop-blur-sm p-6 rounded-2xl">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-amber-700/60 mb-4">
              System
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-zinc-500">STATUS</span>
                <span className={status.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}>
                  {status.status?.toUpperCase() ?? "Unavailable"}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-zinc-500">MESSAGE</span>
                <span className="text-zinc-400">{status.message ?? "Unavailable"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">TIMESTAMP</span>
                <span className="text-zinc-500 text-[8px]">
                  {status.timestamp ? new Date(status.timestamp).toLocaleString() : "Unavailable"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-block px-4 py-2 border border-amber-900/30 bg-amber-950/20 rounded-full">
            <p className="font-mono text-[8px] text-amber-700/60 tracking-[0.2em]">
              VAULT: {status.redis?.connected ? 'OPERATIONAL' : 'DEGRADED (CACHE ONLY)'}
            </p>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default RedisDiagnostic;
