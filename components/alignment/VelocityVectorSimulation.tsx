"use client";

import * as React from "react";
import { FastForward, Wind, Zap, GaugeCircle } from "lucide-react";

function Frame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0B0D10]",
        "shadow-[0_24px_70px_-40px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_65%)] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SliderBlock({
  title,
  value,
  min,
  max,
  accent,
  hint,
  onChange,
}: {
  title: string;
  value: number;
  min: number;
  max: number;
  accent: string;
  hint: string;
  onChange: (next: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
            {title}
          </div>
          <p className="mt-3 max-w-sm text-[11px] leading-6 text-white/36">
            {hint}
          </p>
        </div>

        <div className="text-right font-mono text-xl text-white">
          {value}
          <span className="ml-1 text-xs text-white/34">%</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-2 rounded-full bg-white/10">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, ${accent}88 0%, ${accent} 100%)`,
              boxShadow: `0 0 14px ${accent}44`,
            }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="mt-4 w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  width,
  accent,
  subtle = false,
}: {
  label: string;
  value: string;
  width: string;
  accent: string;
  subtle?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-4">
        <span
          className={[
            "font-mono text-[10px] uppercase tracking-[0.22em]",
            subtle ? "text-white/36" : "text-[#D6B77A]",
          ].join(" ")}
        >
          {label}
        </span>
        <span className={subtle ? "font-mono text-sm text-white/42" : "font-mono text-xl text-white"}>
          {value}
        </span>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-white/8 p-1">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width,
            background: accent,
            boxShadow: subtle ? "none" : "0 0 18px rgba(201,169,106,0.18)",
          }}
        />
      </div>
    </div>
  );
}

export default function VelocityVectorSimulation() {
  const [marketFriction, setMarketFriction] = React.useState(65);
  const [ogrResonance, setOgrResonance] = React.useState(94);

  const velocityGap = React.useMemo(() => {
    const denominator = Math.max(0.01, 100 - marketFriction);
    return Number((ogrResonance / denominator).toFixed(1));
  }, [marketFriction, ogrResonance]);

  const projectedWidth = `${Math.min(velocityGap * 24, 100)}%`;

  return (
    <section className="mx-auto my-16 max-w-6xl px-4 sm:px-6 lg:px-8">
      <Frame>
        {/* Header */}
        <div className="border-b border-white/[0.06] px-6 py-8 md:px-8 lg:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#C9A96A]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#D6B77A]">
                  Stage III.B — Velocity Projection
                </span>
              </div>

              <h2 className="mt-4 font-serif text-3xl text-white md:text-4xl">
                The Velocity <span className="italic text-[#D6B77A]">Vector</span>
              </h2>
            </div>

            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">
                System Status
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.26em] text-emerald-400">
                Active Simulation
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-0 lg:grid-cols-12">
          {/* Controls */}
          <div className="border-b border-white/[0.06] p-6 md:p-8 lg:col-span-4 lg:border-b-0 lg:border-r lg:border-white/[0.06] lg:p-10">
            <div className="grid gap-6">
              <SliderBlock
                title="Competitor Friction"
                value={marketFriction}
                min={10}
                max={90}
                accent="#C44D4D"
                hint="Estimated institutional drag of a typical legacy competitor."
                onChange={setMarketFriction}
              />

              <SliderBlock
                title="Your Resonance"
                value={ogrResonance}
                min={50}
                max={100}
                accent="#C9A96A"
                hint="Verified internal coherence and execution alignment."
                onChange={setOgrResonance}
              />
            </div>
          </div>

          {/* Visualization */}
          <div className="relative overflow-hidden p-6 md:p-8 lg:col-span-8 lg:p-10">
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(201,169,106,0.35) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(201,169,106,0.35) 0.5px, transparent 0.5px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative z-10">
              <div className="grid gap-10">
                <ComparisonBar
                  label="Legacy Market Pace"
                  value="1.0x"
                  width="25%"
                  accent="#4B5563"
                  subtle
                />

                <ComparisonBar
                  label="Your Penetration Velocity"
                  value={`${velocityGap}x`}
                  width={projectedWidth}
                  accent="linear-gradient(90deg, rgba(201,169,106,0.75) 0%, rgba(230,194,122,1) 100%)"
                />

                <div className="grid gap-5 border-t border-white/[0.06] pt-8 md:grid-cols-2">
                  <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-[#C9A96A]/12 p-3">
                        <FastForward className="h-5 w-5 text-[#D6B77A]" />
                      </div>
                      <div>
                        <h4 className="font-serif text-lg text-white">
                          Strategic Advantage
                        </h4>
                        <p className="mt-2 text-[12px] leading-6 text-white/48">
                          Every one month of your execution maps to approximately{" "}
                          <span className="font-semibold text-white">
                            {velocityGap} months
                          </span>{" "}
                          of typical competitor progress.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-[#C9A96A]/12 p-3">
                        <Wind className="h-5 w-5 text-[#D6B77A]" />
                      </div>
                      <div>
                        <h4 className="font-serif text-lg text-white">
                          Capital Efficiency
                        </h4>
                        <p className="mt-2 text-[12px] leading-6 text-white/48">
                          Reduced time-to-value shortens the reinvestment cycle and
                          improves domain expansion efficiency.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button className="inline-flex items-center gap-3 rounded-[22px] border border-[#C9A96A]/30 bg-[#C9A96A]/12 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[#E4C88E] transition hover:bg-[#C9A96A]/18 hover:shadow-[0_0_24px_rgba(201,169,106,0.14)]">
                    <GaugeCircle className="h-4 w-4" />
                    Authorise Phase III Execution
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-6 py-5 text-center">
          <p className="font-mono text-[8px] uppercase tracking-[0.46em] text-white/22">
            Abraham of London — Kinetic Forensics — MMXXVI
          </p>
        </div>
      </Frame>
    </section>
  );
}