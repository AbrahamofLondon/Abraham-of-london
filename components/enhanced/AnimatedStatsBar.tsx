"use client";

import * as React from "react";
import { Award, BookOpen, Target, Users } from "lucide-react";

type Stat = {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  meta: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const AnimatedStatsBar: React.FC = () => {
  const [v, setV] = React.useState({ a: 0, b: 0, c: 0, d: 0 });

  const stats: Stat[] = [
    {
      label: "Frameworks",
      value: 24,
      suffix: "+",
      icon: <Target className="h-4 w-4" />,
      meta: "Decision tools & matrices",
    },
    {
      label: "Institutions",
      value: 18,
      suffix: "+",
      icon: <Users className="h-4 w-4" />,
      meta: "Advisory + delivery packs",
    },
    {
      label: "Canon Volumes",
      value: 12,
      suffix: "+",
      icon: <BookOpen className="h-4 w-4" />,
      meta: "Thesis → systems → deployment",
    },
    {
      label: "Years",
      value: 8,
      suffix: "",
      icon: <Award className="h-4 w-4" />,
      meta: "Governance discipline",
    },
  ];

  React.useEffect(() => {
    const duration = 900;
    const start = performance.now();
    const targets = { a: stats[0].value, b: stats[1].value, c: stats[2].value, d: stats[3].value };

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      setV({
        a: Math.floor(eased * targets.a),
        b: Math.floor(eased * targets.b),
        c: Math.floor(eased * targets.c),
        d: Math.floor(eased * targets.d),
      });

      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, []);

  const values = [v.a, v.b, v.c, v.d];

  return (
    <section className="relative bg-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(245,158,11,0.10),transparent_55%)]" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                Authority snapshot
              </p>
              <p className="mt-2 text-sm font-light text-gray-300">
                High-signal metrics. No vanity. Just shipped assets and durable standards.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-200">
                Live posture
              </span>
            </div>
          </div>

          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={cx(
                  "relative px-6 py-7",
                  "border-white/10",
                  i === 0 ? "" : "border-t sm:border-t-0 sm:border-l"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <span className="text-amber-300">{s.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-300">
                      {s.label}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-serif text-4xl font-semibold text-amber-100">
                    {values[i]}
                  </span>
                  {s.suffix ? (
                    <span className="text-lg font-bold text-amber-300">{s.suffix}</span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm font-light text-gray-300">{s.meta}</p>

                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.08),transparent_55%)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedStatsBar;