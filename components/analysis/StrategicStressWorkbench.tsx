"use client";

import * as React from "react";
import { useOGRStore } from "@/store/useOGRStore";
import ComparisonDelta from "@/components/analysis/ComparisonDelta";
import FormulaInspector from "@/components/debug/FormulaInspector";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Zap,
} from "lucide-react";

type NumericControlProps = {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  accent?: "amber" | "red" | "white";
};

type OutputCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
};

type CheckItemProps = {
  label: string;
  description: string;
  active: boolean;
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function accentClass(accent: NumericControlProps["accent"] = "amber"): string {
  switch (accent) {
    case "red":
      return "text-red-300";
    case "white":
      return "text-white";
    default:
      return "text-amber-300";
  }
}

function toneClasses(tone: OutputCardProps["tone"] = "default"): string {
  switch (tone) {
    case "good":
      return "border-emerald-500/18 bg-emerald-500/[0.04]";
    case "warn":
      return "border-amber-500/18 bg-amber-500/[0.04]";
    case "bad":
      return "border-red-500/18 bg-red-500/[0.04]";
    default:
      return "border-white/[0.08] bg-white/[0.02]";
  }
}

function NumericControl({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  unit = "%",
  accent = "amber",
}: NumericControlProps) {
  const displayValue =
    unit === "M" ? `$${value}${unit}` : unit ? `${value}${unit}` : `${value}`;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/62">
            {label}
          </div>
          <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-white/38">
            {description}
          </p>
        </div>

        <div
          className={cn(
            "font-serif text-xl tabular-nums",
            accentClass(accent),
          )}
        >
          {displayValue}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10"
        style={{
          accentColor:
            accent === "red"
              ? "#f87171"
              : accent === "white"
                ? "#ffffff"
                : "#d4a84f",
        }}
      />
    </div>
  );
}

function OutputCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: OutputCardProps) {
  return (
    <div
      className={cn(
        "border p-7 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)] transition-colors",
        toneClasses(tone),
      )}
    >
      <div className="mb-5 text-amber-300/78">{icon}</div>

      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/36">
        {label}
      </div>

      <div className="mt-3 font-serif text-4xl leading-none text-white">
        {value}
      </div>

      <div className="mt-3 text-[11px] uppercase tracking-[0.12em] text-white/34">
        {sub}
      </div>
    </div>
  );
}

function CheckItem({ label, description, active }: CheckItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "mt-1.5 h-2.5 w-2.5 rounded-full",
          active
            ? "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.45)]"
            : "bg-red-500/30",
        )}
      />
      <div>
        <div
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.18em]",
            active ? "text-white/82" : "text-white/46",
          )}
        >
          {label}
        </div>
        <div className="mt-1 text-[11px] leading-relaxed text-white/38">
          {description}
        </div>
      </div>
    </div>
  );
}

export default function StrategicStressWorkbench() {
  const {
    resonanceScore,
    marketFriction,
    targetRevenue,
    computed,
    setResonance,
    setFriction,
    setRevenue,
    commitReport,
  } = useOGRStore();

  const [saveState, setSaveState] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = React.useState<string>("");

  const handleSaveScenario = async () => {
    try {
      setSaveState("saving");
      setSaveMessage("");

      const res = await commitReport();

      if (res?.success) {
        setSaveState("saved");
        setSaveMessage(`Scenario saved${res.id ? ` • ${res.id}` : ""}`);
        return;
      }

      setSaveState("error");
      setSaveMessage("Scenario save failed.");
    } catch {
      setSaveState("error");
      setSaveMessage("Scenario save failed.");
    }
  };

  const handleResetScenario = () => {
    setResonance(92.5);
    setFriction(65);
    setRevenue(100);
    setSaveState("idle");
    setSaveMessage("");
  };

  const confidenceTone: OutputCardProps["tone"] = computed.isAuthorizedToExecute
    ? "good"
    : computed.sovereignCertainty >= 70
      ? "warn"
      : "bad";

  const alphaTone: OutputCardProps["tone"] =
    computed.resonanceAlpha > 0 ? "good" : "bad";

  const taxTone: OutputCardProps["tone"] =
    computed.integrationTax < 20
      ? "good"
      : computed.integrationTax < 30
        ? "warn"
        : "bad";

  const velocityTone: OutputCardProps["tone"] =
    computed.velocityMultiplier >= 1.2
      ? "good"
      : computed.velocityMultiplier >= 1
        ? "warn"
        : "bad";

  return (
    <div className="min-h-screen bg-[#050505] p-6 font-mono text-[#F9F7F2] selection:bg-amber-500 selection:text-black lg:p-16">
      <header className="mb-14 flex flex-col gap-8 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-amber-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-amber-300">
              Strategic Stress Workbench
            </span>
          </div>

          <h1 className="mt-5 font-serif text-4xl tracking-tight text-white md:text-5xl">
            Scenario sensitivity under operating pressure
          </h1>

          <p className="mt-5 max-w-2xl text-[12px] leading-relaxed text-white/42">
            Model scenario sensitivity across alignment, friction, revenue, and
            execution confidence. Use this surface to compare assumptions,
            inspect derived outputs, and judge whether current conditions support
            forward movement.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleSaveScenario}
            disabled={saveState === "saving"}
            className={cn(
              "inline-flex items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] transition-all",
              saveState === "saving"
                ? "cursor-wait bg-amber-500/70 text-black"
                : "bg-amber-500 text-black hover:bg-amber-400",
            )}
          >
            <FileCheck className="h-4 w-4" />
            {saveState === "saving" ? "Saving scenario" : "Save scenario"}
          </button>

          <button
            onClick={handleResetScenario}
            className="inline-flex items-center gap-3 border border-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-white/70 transition-all hover:bg-white/[0.04] hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Reset defaults
          </button>
        </div>
      </header>

      {(saveState === "saved" || saveState === "error") && saveMessage ? (
        <div
          className={cn(
            "mb-10 border px-5 py-4 text-[11px] uppercase tracking-[0.16em]",
            saveState === "saved"
              ? "border-emerald-500/18 bg-emerald-500/[0.05] text-emerald-300"
              : "border-red-500/18 bg-red-500/[0.05] text-red-300",
          )}
        >
          {saveMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <aside className="space-y-10 lg:col-span-4">
          <ComparisonDelta />

          <div className="relative overflow-hidden border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
            <div className="absolute right-0 top-0 p-5 opacity-10">
              <SlidersHorizontal className="h-10 w-10 text-amber-300" />
            </div>

            <div className="mb-8 flex items-center gap-2 border-b border-white/8 pb-5">
              <ArrowRight className="h-3.5 w-3.5 text-amber-300" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
                Scenario controls
              </h2>
            </div>

            <div className="space-y-10">
              <NumericControl
                label="Core resonance"
                description="Alignment of internal resources, leadership coherence, and operating signal quality."
                value={resonanceScore}
                min={0}
                max={100}
                step={0.1}
                onChange={setResonance}
                unit="%"
                accent="amber"
              />

              <NumericControl
                label="Market friction"
                description="External resistance, drag, and execution difficulty imposed by operating conditions."
                value={marketFriction}
                min={0}
                max={99.9}
                step={0.1}
                onChange={setFriction}
                unit="%"
                accent="red"
              />

              <NumericControl
                label="Revenue baseline"
                description="Capital base used to estimate sensitivity, drag, and projected upside or downside."
                value={targetRevenue}
                min={10}
                max={5000}
                step={10}
                onChange={setRevenue}
                unit="M"
                accent="white"
              />
            </div>
          </div>
        </aside>

        <main className="space-y-10 lg:col-span-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormulaInspector type="tax">
              <OutputCard
                icon={<AlertTriangle className="h-5 w-5" />}
                label="Execution drag"
                value={`${computed.integrationTax}%`}
                sub="Estimated integration cost"
                tone={taxTone}
              />
            </FormulaInspector>

            <FormulaInspector type="velocity">
              <OutputCard
                icon={<Zap className="h-5 w-5" />}
                label="Execution velocity"
                value={`${computed.velocityMultiplier}x`}
                sub="Estimated movement multiplier"
                tone={velocityTone}
              />
            </FormulaInspector>

            <FormulaInspector type="alpha">
              <OutputCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Projected alpha"
                value={`$${computed.resonanceAlpha}M`}
                sub="Estimated upside or downside"
                tone={alphaTone}
              />
            </FormulaInspector>

            <FormulaInspector type="certainty">
              <OutputCard
                icon={<Scale className="h-5 w-5" />}
                label="Confidence to proceed"
                value={`${computed.sovereignCertainty}%`}
                sub={
                  computed.isAuthorizedToExecute
                    ? "Conditions support movement"
                    : "Conditions do not yet support movement"
                }
                tone={confidenceTone}
              />
            </FormulaInspector>
          </div>

          <div className="overflow-hidden border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
            <div className="mb-8 border-b border-white/8 pb-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/58">
                Protocol checks
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <CheckItem
                label="Alignment standard"
                active={resonanceScore > 85}
                description="Core resonance is high enough to support coherent movement."
              />
              <CheckItem
                label="Friction absorption"
                active={computed.integrationTax < 20}
                description="Operating drag remains within a tolerable range."
              />
              <CheckItem
                label="Positive alpha"
                active={computed.resonanceAlpha > 0}
                description="Projected upside remains positive under current assumptions."
              />
            </div>
          </div>

          <div className="overflow-hidden border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
            <div className="mb-8 border-b border-white/8 pb-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/58">
                  Operating interpretation
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-[12px] leading-relaxed text-white/52">
              <p>
                Use this workbench to test the interaction between internal
                alignment, external friction, revenue scale, and execution
                confidence.
              </p>
              <p>
                The objective is not visual drama. It is disciplined judgment:
                whether present conditions support movement, correction, or restraint.
              </p>
              <p>
                Save scenarios when they represent meaningful decision states,
                not casual experimentation.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}