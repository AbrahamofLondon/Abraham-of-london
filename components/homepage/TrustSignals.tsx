import * as React from "react";
import { Shield, Sparkles, CheckCircle2, FileText } from "lucide-react";

export default function TrustSignals(): JSX.Element {
  const signals = [
    {
      icon: <FileText className="h-4 w-4 text-amber-300" />,
      title: "Structured dossiers",
      body: "Briefings built like internal firm memos — concise, auditable, reusable.",
    },
    {
      icon: <CheckCircle2 className="h-4 w-4 text-amber-300" />,
      title: "Operational clarity",
      body: "Inputs → logic → outputs. No mysticism. No fluff. Just systems.",
    },
    {
      icon: <Shield className="h-4 w-4 text-amber-300" />,
      title: "Governance discipline",
      body: "Cadence, metrics, review loops — the boring stuff that makes it work.",
    },
    {
      icon: <Sparkles className="h-4 w-4 text-amber-300" />,
      title: "Canon-derived",
      body: "Not random posts. One spine powering everything you see.",
    },
  ];

  return (
    <section className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-amber-300">
                Proof before persuasion
              </p>
              <h2 className="mt-3 font-serif text-2xl md:text-3xl font-bold text-white">
                Posture is demonstrated.
              </h2>
              <p className="mt-3 max-w-2xl text-sm md:text-base text-white/65 leading-relaxed">
                The site should feel like walking into a serious office: calm, ordered, and ready to execute.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {signals.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-white/10 bg-black/40 p-5 hover:border-white/15 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10">
                    {s.icon}
                  </div>
                  <div className="text-sm font-bold text-white">{s.title}</div>
                </div>
                <div className="mt-3 text-sm text-white/60 leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}