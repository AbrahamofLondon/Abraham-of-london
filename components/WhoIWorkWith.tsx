/* components/WhoIWorkWith.tsx — High-Contrast Protocol Edition */
import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Users, Shield, Target, Compass, LucideIcon, AlertTriangle } from "lucide-react";

export interface WhoIWorkWithProps {
  className?: string;
}

const copy = {
  with: [
    { accent: "The Protectors", text: "Principals carrying real duty—families, teams, institutions.", icon: Shield },
    { accent: "The Integrators", text: "Leaders who hold doctrine and data without collapsing either into slogans.", icon: Compass },
    { accent: "The Truth-Seekers", text: "Operators who prefer hard diagnosis over soft affirmation.", icon: Target },
    { accent: "The Architects", text: "Builders focused on governance and legacy that outlives the moment.", icon: Users },
  ],
  notWith: [
    "Performative strategy: hype decks and momentum theatre.",
    "Validation-seeking leadership: comfort over accountability.",
    "Cultures allergic to reality: no appetite for constraints.",
    "Integrity-as-a-tool: when principle is treated as optional.",
  ],
  footer: "Advisory is finite. We reserve it for missions requiring precision and integrity.",
};

export default function WhoIWorkWith({ className = "" }: WhoIWorkWithProps): JSX.Element {
  return (
    <motion.section
      className={[
        "relative border border-white/10 bg-black overflow-hidden",
        className,
      ].join(" ")}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="relative z-10 p-8 md:p-12 lg:p-16">
        {/* Header: Hard-Line Precision */}
        <div className="mb-16 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[2px] w-8 bg-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-amber-500">
              Operational Fit
            </span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-white italic leading-tight tracking-tight">
            Selective <span className="text-amber-500">Alignment.</span>
          </h2>
          <p className="mt-6 text-zinc-300 text-base font-light leading-relaxed">
            Partnership quality dictates outcomes. We filter for depth and the institutional discipline to execute under pressure.
          </p>
        </div>

        {/* The Grid: 1px Separation */}
        <div className="grid gap-px bg-white/10 border border-white/10 lg:grid-cols-2">
          
          {/* THE ALLIANCE (WITH) */}
          <div className="bg-black p-10 group">
            <div className="flex items-center gap-4 mb-12">
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-white">
                The Alliance
              </h3>
            </div>

            <ul className="space-y-10">
              {copy.with.map((item, i) => (
                <li key={i} className="flex gap-5">
                  <item.icon className="h-5 w-5 shrink-0 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-2">
                      {item.accent}
                    </span>
                    <p className="text-[15px] text-zinc-200 leading-relaxed font-normal">
                      {item.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* THE DIVERGENCE (NOT WITH) */}
          <div className="bg-black p-10 group">
            <div className="flex items-center gap-4 mb-12">
              <XCircle className="h-4 w-4 text-zinc-500" />
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-400">
                The Divergence
              </h3>
            </div>

            <ul className="space-y-6">
              {copy.notWith.map((item, i) => (
                <li key={i} className="flex gap-4 items-start border-l border-zinc-800 pl-6">
                  <p className="text-[14px] text-zinc-400 leading-relaxed font-normal italic">
                    {item}
                  </p>
                </li>
              ))}
            </ul>

            {/* MANDATE FOOTER: Re-engineered for maximum contrast and legibility */}
            <div className="mt-16 bg-amber-500/[0.03] border border-amber-500/20 p-6">
              <div className="flex gap-4">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] leading-normal text-amber-500">
                  Notice: {copy.footer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}