// pages/admin/redis.tsx
import { useEffect, useState } from "react";
import type { NextPage } from "next";

const RedisDiagnostic: NextPage = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vault/status")
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-amber-700/50 font-mono text-xs">DIAGNOSTIC SCAN...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8 font-mono">
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
            <div className={`text-${status?.redis.connected ? 'emerald' : 'red'}-500/90 font-mono text-sm`}>
              {status?.redis.connected ? '✓ ACTIVE' : '✗ OFFLINE'}
            </div>
            {status?.redis.error && (
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
                <span className={status?.redis.ping ? 'text-emerald-500' : 'text-red-500'}>
                  {status?.redis.ping ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-zinc-500">KEYS</span>
                <span className="text-amber-600/80">{status?.redis.keys || 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">MEMORY</span>
                <span className="text-amber-600/80">{status?.redis.memory || 'N/A'}</span>
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
                <span className="text-amber-600/80">{status?.disk.assets || 0}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-zinc-500">REDIS CACHE</span>
                <span className="text-amber-600/80">{status?.redis.keys || 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">SYNC STATE</span>
                <span className={status?.redis.keys === status?.disk.assets ? 'text-emerald-500' : 'text-amber-500'}>
                  {status?.redis.keys === status?.disk.assets ? 'SYNCHRONIZED' : 'PARTIAL'}
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
                <span className={status?.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}>
                  {status?.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-zinc-500">MESSAGE</span>
                <span className="text-zinc-400">{status?.message}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">TIMESTAMP</span>
                <span className="text-zinc-500 text-[8px]">
                  {new Date(status?.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-block px-4 py-2 border border-amber-900/30 bg-amber-950/20 rounded-full">
            <p className="font-mono text-[8px] text-amber-700/60 tracking-[0.2em]">
              VAULT: {status?.redis.connected ? 'OPERATIONAL' : 'DEGRADED (CACHE ONLY)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedisDiagnostic;