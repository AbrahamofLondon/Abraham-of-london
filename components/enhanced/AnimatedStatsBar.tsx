"use client";

import * as React from "react";
import {
  Award,
  BookOpen,
  Shield,
  Target,
  Users,
  CheckCircle2,
} from "lucide-react";

type StatKey = "frameworks" | "clients" | "volumes" | "years";

type Stat = {
  key: StatKey;
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  meta: string;
};

function clamp(n: number, a: number, b: number) {
  return Math.min(Math.max(n, a), b);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedStatsBar() {
  const stats: Stat[] = [
    {
      key: "frameworks",
      label: "Strategic Frameworks",
      value: 24,
      suffix: "+",
      icon: <Target className="h-5 w-5" />,
      meta: "Decision tools • matrices • models",
    },
    {
      key: "clients",
      label: "Institutional Clients",
      value: 18,
      suffix: "+",
      icon: <Users className="h-5 w-5" />,
      meta: "Leadership teams • founders • institutions",
    },
    {
      key: "volumes",
      label: "Canon Volumes",
      value: 12,
      suffix: "+",
      icon: <BookOpen className="h-5 w-5" />,
      meta: "Thesis • systems • operator manuals",
    },
    {
      key: "years",
      label: "Years of Excellence",
      value: 8,
      suffix: "",
      icon: <Award className="h-5 w-5" />,
      meta: "Proof over posture",
    },
  ];

  const [counts, setCounts] = React.useState<Record<StatKey, number>>({
    frameworks: 0,
    clients: 0,
    volumes: 0,
    years: 0,
  });

  React.useEffect(() => {
    const duration = 1200; // tighter, more “instrument panel”
    const start = performance.now();

    const tick = (now: number) => {
      const t = clamp((now - start) / duration, 0, 1);
      const e = easeOutCubic(t);

      setCounts({
        frameworks: Math.floor(e * stats[0].value),
        clients: Math.floor(e * stats[1].value),
        volumes: Math.floor(e * stats[2].value),
        years: Math.floor(e * stats[3].value),
      });

      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="relative overflow-hidden bg-black">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(245,158,11,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_70%,rgba(59,130,246,0.08),transparent_55%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header rail */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-amber-300">
              Evidence bar
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light text-amber-100 sm:text-4xl">
              Output, not noise.
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-gray-200">
              <CheckCircle2 className="h-4 w-4 text-amber-300" />
              Partner-led
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-gray-200">
              <Shield className="h-4 w-4 text-amber-300" />
              Governance-ready
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.key}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/25 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-amber-500/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  {s.icon}
                </div>
                <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.35em] text-amber-200">
                  verified
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-4xl font-semibold text-amber-100">
                  {counts[s.key]}
                </span>
                {s.suffix ? (
                  <span className="text-lg font-bold text-amber-300">
                    {s.suffix}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm font-semibold text-gray-100">
                {s.label}
              </p>

              <p className="mt-3 text-sm font-light leading-relaxed text-gray-300">
                {s.meta}
              </p>

              {/* Sheen */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.07),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}