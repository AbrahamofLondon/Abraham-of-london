// components/dashboard/PdfAnalyticsWidget.tsx
import * as React from "react";
import Link from "next/link";
import { ChevronRight, FileText, TrendingUp, Activity, AlertTriangle } from "lucide-react";

interface TelemetryData {
  resonance: number;
  activeNodes: number;
  metrics: {
    friction: number;
    load: number;
  };
}

export function PdfAnalyticsWidget() {
  const [telemetry, setTelemetry] = React.useState<TelemetryData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch('/api/telemetry/resonance');
        const data = await response.json();
        setTelemetry(data);
      } catch (error) {
        console.error('Failed to fetch telemetry:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="border border-white/5 bg-white/[0.01] p-6 backdrop-blur-sm">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8A6A2F] border-t-transparent" />
        </div>
      </div>
    );
  }

  const isDisordered = telemetry?.resonance && telemetry.resonance < 60;

  return (
    <div className="border border-white/5 bg-white/[0.01] p-6 backdrop-blur-sm transition-all hover:bg-white/[0.02]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="border border-[#8A6A2F]/20 bg-[#8A6A2F]/10 p-2">
            <FileText className="h-4 w-4 text-[#8A6A2F]" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8A6A2F]">
              PDF Analytics
            </h3>
            <p className="text-[9px] text-zinc-500">Live Telemetry Stream</p>
          </div>
        </div>
        <Link
          href="/pdf-dashboard"
          className="group flex items-center gap-2 text-[8px] font-mono uppercase tracking-wider text-zinc-500 transition-colors hover:text-white"
        >
          <span>Full Dashboard</span>
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {isDisordered && (
        <div className="mb-4 border-l-2 border-red-500 bg-red-500/5 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <p className="text-[8px] font-mono uppercase text-red-400">
              Resonance Critical: {telemetry?.resonance}%
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-white/10 p-3">
          <p className="text-[7px] font-mono uppercase tracking-wider text-zinc-500">
            Systemic Resonance
          </p>
          <p className="text-2xl font-light tracking-tighter">
            {telemetry?.resonance || 0}%
          </p>
        </div>

        <div className="border border-white/10 p-3">
          <p className="text-[7px] font-mono uppercase tracking-wider text-zinc-500">
            Active Nodes
          </p>
          <p className="text-2xl font-light tracking-tighter">
            {telemetry?.activeNodes || 0}
          </p>
        </div>

        <div className="border border-white/10 p-3">
          <p className="text-[7px] font-mono uppercase tracking-wider text-zinc-500">
            Friction Index
          </p>
          <p className="text-lg font-light tracking-tighter">
            {telemetry?.metrics?.friction || 0}%
          </p>
        </div>

        <div className="border border-white/10 p-3">
          <p className="text-[7px] font-mono uppercase tracking-wider text-zinc-500">
            System Load
          </p>
          <p className="text-lg font-light tracking-tighter">
            {telemetry?.metrics?.load || 0}%
          </p>
        </div>
      </div>

      <div className="mt-4 h-1 w-full bg-white/5">
        <div
          className="h-full bg-[#8A6A2F] transition-all duration-500"
          style={{ width: `${telemetry?.resonance || 0}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between text-[6px] font-mono uppercase text-zinc-600">
        <span>Protocol OGR-IV</span>
        <span>Node: Canary Wharf</span>
        <span>v1.6</span>
      </div>
    </div>
  );
}