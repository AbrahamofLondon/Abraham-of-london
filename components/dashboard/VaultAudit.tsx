'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, Server, Activity, Database, Layers } from "lucide-react";
import type { DashboardStats } from "@/types/pdf-dashboard";
import { syncVaultRegistry } from "@/app/actions/sync-vault";

export function VaultAudit() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [syncing, setSyncing] = useState(false);

  const fetchAuditData = async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/stats')
      ]);
      setDbStatus(hRes.ok ? 'online' : 'offline');
      if (sRes.ok) setStats(await sRes.json());
    } catch {
      setDbStatus('offline');
    }
  };

  useEffect(() => { fetchAuditData(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    await syncVaultRegistry();
    await fetchAuditData();
    setSyncing(false);
  };

  const completionRate = stats ? Math.round((stats.availablePDFs / stats.totalPDFs) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <Card className="border-t-4 border-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black">VAULT ARCHITECTURE AUDIT</CardTitle>
            <CardDescription>Systematic sync between FileSystem and Neon PostgreSQL</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="text-xs font-bold uppercase border p-2 rounded hover:bg-secondary disabled:opacity-50"
            >
              <Activity className={`w-3 h-3 inline mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronizing...' : 'Run Sync'}
            </button>
            <Badge className={dbStatus === 'online' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}>
              <Server className="w-3 h-3 mr-1" /> {dbStatus.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-2 text-sm font-mono">
            <span>Portfolio Integrity</span>
            <span>{completionRate}%</span>
          </div>
          <Progress value={completionRate} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Assets Indexed</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.totalPDFs || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Database Registry</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">Neon PostgreSQL</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Region</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold uppercase">eu-west-2</div></CardContent>
        </Card>
      </div>
    </div>
  );
}