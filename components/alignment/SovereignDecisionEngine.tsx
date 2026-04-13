"use client";

import * as React from "react";
import { useOGRStore } from "@/store/useOGRStore";
import {
  ShieldCheck,
  Cpu,
  Network,
  ArrowRightCircle,
  Fingerprint,
  AlertCircle,
  Lock,
  Orbit,
  PoundSterling,
  Layers3,
  BadgeCheck,
  Activity,
} from "lucide-react";

function Shell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[30px] border border-white/[0.08]",
        "bg-[linear-gradient(180deg,rgba(12,12,13,0.96)_0%,rgba(6,6,7,0.98)_100%)]",
        "shadow-[0_32px_90px_-55px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_60%)] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PanelTitle({
  icon: Icon,
  eyebrow,
  title,
  body,
  accent = "text-[#D6B77A]",
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  body?: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/42">
          {eyebrow}
        </span>
      </div>
      <h3 className="mt-4 font-serif text-2xl leading-tight text-white">{title}</h3>
      {body ? (
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/52">{body}</p>
      ) : null}
    </div>
  );
}

function SliderRail({
  icon: Icon,
  title,
  value,
  min,
  max,
  step,
  accent,
  hint,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
  accent: string;
  hint: string;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color: accent }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
              {title}
            </span>
          </div>
          <p className="mt-3 max-w-sm text-[11px] leading-6 text-white/40">{hint}</p>
        </div>

        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
            live
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {value.toFixed(1)}
            <span className="ml-1 text-sm text-white/35">%</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative h-2 rounded-full bg-white/10">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, ${accent}99 0%, ${accent} 100%)`,
              boxShadow: `0 0 20px ${accent}33`,
            }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-4 w-full cursor-pointer appearance-none bg-transparent accent-white"
        />

        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-white/22">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

function NumberCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "gold" | "danger" | "success";
}) {
  const toneClass =
    tone === "gold"
      ? "text-[#E4C88E]"
      : tone === "danger"
      ? "text-red-300"
      : tone === "success"
      ? "text-emerald-300"
      : "text-white";

  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-300 hover:border-white/[0.12]">
      <div className="text-[10px] font-mono uppercase tracking-[0.20em] text-white/35">
        {label}
      </div>
      <div className={`mt-4 text-3xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </div>
      <div className="mt-2 text-xs leading-6 text-white/38">{hint}</div>
    </div>
  );
}

function DecisionBand({
  certainty,
}: {
  certainty: number;
}) {
  if (certainty >= 90) {
    return {
      label: "Authorized",
      title: "Resonance lock achieved",
      body:
        "The current relationship between internal resonance and external friction supports disciplined sovereign execution.",
      className:
        "border-[#C9A96A]/20 bg-[#C9A96A]/[0.08] text-[#E4C88E]",
      icon: ShieldCheck,
    };
  }

  if (certainty >= 75) {
    return {
      label: "Conditional",
      title: "Alignment is promising but incomplete",
      body:
        "The geometry is directionally viable, but the present state still carries enough drag to justify correction before commitment.",
      className:
        "border-amber-500/20 bg-amber-500/[0.08] text-amber-300",
      icon: AlertCircle,
    };
  }

  return {
    label: "Locked",
    title: "Critical dissonance detected",
    body:
      "Integration drag exceeds acceptable yield conditions. Execution should remain locked until coherence is materially restored.",
    className:
      "border-red-500/20 bg-red-500/[0.08] text-red-300",
    icon: Lock,
  };
}

export default function SovereignDecisionEngine() {
  const {
    resonanceScore,
    marketFriction,
    targetRevenue,
    computed,
    setResonance,
    setFriction,
    setRevenue,
  } = useOGRStore();

  const certainty = computed.sovereignCertainty;
  const band = DecisionBand({ certainty });
  const BandIcon = band.icon;

  const isAuthorized = computed.isAuthorizedToExecute;
  const alphaPositive = computed.resonanceAlpha >= 0;

  const alphaTone = alphaPositive ? "success" : "danger";
  const alphaLabel = alphaPositive ? "Alpha-generative" : "Alpha-destructive";

  return (
    <section className="mx-auto my-20 max-w-7xl px-4 sm:px-6 lg:px-8">
      <Shell>
        {/* HEADER */}
        <div className="relative border-b border-white/[0.06] px-6 py-8 md:px-8 lg:px-10 lg:py-10">
          <div className="absolute right-6 top-6 opacity-[0.05] md:right-10 md:top-8">
            <Fingerprint className="h-28 w-28 text-[#C9A96A]" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="h-px w-10 bg-[#C9A96A]/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.40em] text-[#D6B77A]">
                Stage III.D — Deterministic Execution
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <h1 className="font-serif text-4xl leading-[0.94] text-white md:text-5xl lg:text-6xl">
                  The Sovereign{" "}
                  <span className="italic text-[#D6B77A]">Decision Engine</span>
                </h1>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-white/56 md:text-base">
                  A governed execution surface for testing whether the present
                  geometry justifies commitment, correction, or restraint.
                </p>
              </div>

              <div className="flex items-end lg:justify-end">
                <div
                  className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 ${band.className}`}
                >
                  <BandIcon className="h-4 w-4" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em]">
                    {band.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CORE GRID */}
        <div className="grid gap-0 lg:grid-cols-12">
          {/* PANEL 1 — INPUTS */}
          <div className="border-b border-white/[0.06] p-6 md:p-8 lg:col-span-4 lg:border-b-0 lg:border-r lg:border-white/[0.06] lg:p-10">
            <PanelTitle
              icon={Layers3}
              eyebrow="Panel I"
              title="Input Geometry"
              body="Adjust the live operating conditions that govern the OGR result."
            />

            <div className="mt-8 grid gap-5">
              <SliderRail
                icon={Cpu}
                title="Internal Resonance Fidelity"
                value={resonanceScore}
                min={0}
                max={100}
                step={0.5}
                accent="#C9A96A"
                hint="Measures internal coherence, clarity, and execution harmony."
                onChange={setResonance}
              />

              <SliderRail
                icon={Network}
                title="External Friction Coefficient"
                value={marketFriction}
                min={0}
                max={99.9}
                step={0.5}
                accent="#D35B5B"
                hint="Measures market drag, resistance, and environmental pressure."
                onChange={setFriction}
              />

              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2">
                  <PoundSterling className="h-4 w-4 text-[#D6B77A]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
                    Target Revenue
                  </span>
                </div>

                <p className="mt-3 max-w-sm text-[11px] leading-6 text-white/40">
                  Capital baseline in millions processed through the OGR filter.
                </p>

                <div className="mt-5">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={targetRevenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="w-full rounded-[18px] border border-white/[0.10] bg-black/30 px-4 py-3 text-lg text-white outline-none transition placeholder:text-white/20 focus:border-[#C9A96A]/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PANEL 2 — DECISION CORE */}
          <div className="border-b border-white/[0.06] p-6 md:p-8 lg:col-span-4 lg:border-b-0 lg:border-r lg:border-white/[0.06] lg:p-10">
            <PanelTitle
              icon={Orbit}
              eyebrow="Panel II"
              title="Decision Core"
              body="The sovereign reading of whether this move should proceed."
            />

            <div className="mt-8">
              <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">
                  Sovereign Certainty
                </div>
                <div className="mt-5 font-serif text-[4.6rem] leading-none tracking-[-0.05em] text-white">
                  {certainty.toFixed(2)}
                  <span className="ml-2 text-2xl text-[#D6B77A]">%</span>
                </div>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(certainty, 100)}%`,
                      background:
                        certainty >= 90
                          ? "linear-gradient(90deg, rgba(201,169,106,0.78) 0%, rgba(228,200,142,1) 100%)"
                          : certainty >= 75
                          ? "linear-gradient(90deg, rgba(245,158,11,0.75) 0%, rgba(252,211,77,1) 100%)"
                          : "linear-gradient(90deg, rgba(239,68,68,0.75) 0%, rgba(248,113,113,1) 100%)",
                      boxShadow:
                        certainty >= 90
                          ? "0 0 22px rgba(201,169,106,0.18)"
                          : certainty >= 75
                          ? "0 0 18px rgba(245,158,11,0.14)"
                          : "0 0 18px rgba(239,68,68,0.14)",
                    }}
                  />
                </div>

                <div className={`mt-6 rounded-[20px] border p-5 ${band.className}`}>
                  <div className="flex items-start gap-4">
                    <BandIcon className="mt-0.5 h-5 w-5" />
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em]">
                        {band.title}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/72">
                        {band.body}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!isAuthorized}
                  className={[
                    "group mt-6 inline-flex w-full items-center justify-center gap-4 rounded-[22px] border px-6 py-5",
                    "font-mono text-[10px] uppercase tracking-[0.34em] font-semibold transition-all duration-300",
                    isAuthorized
                      ? "border-[#C9A96A]/35 bg-[#C9A96A]/14 text-[#E4C88E] hover:bg-[#C9A96A]/20 hover:shadow-[0_0_24px_rgba(201,169,106,0.16)]"
                      : "border-white/[0.08] bg-white/[0.03] text-white/28 cursor-not-allowed",
                  ].join(" ")}
                >
                  <span>
                    {isAuthorized ? "Authorize Sovereign Move" : "Alignment Required"}
                  </span>
                  <ArrowRightCircle className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* PANEL 3 — REVENUE / ALPHA / CONTEXT */}
          <div className="p-6 md:p-8 lg:col-span-4 lg:p-10">
            <PanelTitle
              icon={Activity}
              eyebrow="Panel III"
              title="Yield Context"
              body="Financial and execution context for interpreting the current geometry."
            />

            <div className="mt-8 grid gap-4">
              <NumberCard
                label="Integration Tax"
                value={`${computed.integrationTax.toFixed(2)}%`}
                hint="Cost of alignment required to absorb the move."
                tone="default"
              />

              <NumberCard
                label="Velocity Multiplier"
                value={`${computed.velocityMultiplier.toFixed(2)}x`}
                hint="Relative execution speed against market resistance."
                tone="gold"
              />

              <NumberCard
                label="Resonance Alpha"
                value={`${computed.resonanceAlpha >= 0 ? "+" : ""}${computed.resonanceAlpha.toFixed(2)}M`}
                hint={alphaLabel}
                tone={alphaTone}
              />

              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-[#D6B77A]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.20em] text-white/36">
                    Execution Authorization Context
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-white/56">
                  {isAuthorized
                    ? "This configuration clears the sovereign threshold. Internal strength is presently sufficient to justify execution despite existing market drag."
                    : certainty >= 75
                    ? "The move is not irrational, but it is not yet sovereign. The correct posture is disciplined correction before commitment."
                    : "This geometry remains capital-destructive or structurally overexposed. Execution should remain locked until alignment improves."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    </section>
  );
}