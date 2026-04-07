"use client";

import * as React from "react";
import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { Crown, Scale, Globe, Heart, Users, Target } from "lucide-react";

type DomainStrength = "strong" | "developing" | "weak" | "critical";

type DomainItem = {
  domain: string;
  percent: number;
  strength: DomainStrength;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: DomainItem;
  }>;
};

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  Authority: Crown,
  Coherence: Scale,
  Environment: Globe,
  Trust: Heart,
  Execution: Users,
  Stakes: Target,
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function getStrengthDot(strength: DomainStrength): string {
  switch (strength) {
    case "strong":
      return "bg-emerald-400";
    case "developing":
      return "bg-amber-400";
    case "weak":
      return "bg-orange-400";
    case "critical":
    default:
      return "bg-red-400";
  }
}

function getStrengthText(strength: DomainStrength): string {
  switch (strength) {
    case "strong":
      return "text-emerald-400";
    case "developing":
      return "text-amber-400";
    case "weak":
      return "text-orange-400";
    case "critical":
    default:
      return "text-red-400";
  }
}

function normalizePercent(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function normalizeData(data: DomainItem[]): DomainItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    domain: String(item?.domain || "").trim(),
    percent: normalizePercent(item?.percent),
    strength:
      item?.strength === "strong" ||
      item?.strength === "developing" ||
      item?.strength === "weak" ||
      item?.strength === "critical"
        ? item.strength
        : "developing",
  }));
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  const Icon = DOMAIN_ICONS[item.domain] || Target;

  return (
    <div className="rounded-xl border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 text-amber-400" />
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
          {item.domain}
        </span>
      </div>

      <div className="mt-2 text-xl font-light text-white">{item.percent}%</div>

      <div className="mt-1 flex items-center gap-1.5">
        <div className={cn("h-1.5 w-1.5 rounded-full", getStrengthDot(item.strength))} />
        <span className={cn("text-[10px] font-mono", getStrengthText(item.strength))}>
          {item.strength.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export default function ConstitutionalRadarChart({
  data,
}: {
  data: DomainItem[];
}) {
  const safeData = React.useMemo(() => normalizeData(data), [data]);

  if (safeData.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/30 p-8 text-center backdrop-blur-sm">
        <div className="text-sm text-white/40">
          Complete the diagnostic to reveal the constitutional map.
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h3 className="font-serif text-lg text-white">Constitutional Map</h3>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
            Six-domain constitutional reading
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[8px] font-mono text-white/30">Strong</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-[8px] font-mono text-white/30">Developing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            <span className="text-[8px] font-mono text-white/30">Weak</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
            <span className="text-[8px] font-mono text-white/30">Critical</span>
          </div>
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={safeData} outerRadius="72%">
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="domain"
              tick={{
                fill: "rgba(255,255,255,0.4)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{
                fill: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
              }}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              dataKey="percent"
              stroke="#c9a96a"
              strokeWidth={2}
              fill="rgba(201, 169, 106, 0.15)"
              fillOpacity={0.32}
              isAnimationActive
              animationDuration={1000}
              animationBegin={200}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-[9px] font-mono uppercase tracking-[0.16em] text-white/20">
        Constitutional Alignment Index
      </div>
    </motion.div>
  );
}