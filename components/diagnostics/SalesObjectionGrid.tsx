"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, XCircle, Scale, Eye, CheckCircle2 } from "lucide-react";

type Objection = {
  objection: string;
  answer: string;
  icon: React.ComponentType<{ className?: string }>;
};

const OBJECTIONS: Objection[] = [
  {
    objection: "Why not just hire a consultant directly?",
    answer:
      "Because not every serious problem is ready for advisory. Some problems first require disciplined interpretation. This product creates a cleaner reading before money is spent on intervention theatre.",
    icon: Scale,
  },
  {
    objection: "Is this just another diagnostic score?",
    answer:
      "No. The value is not the score. The value is the report: narrative, domain matrix, exposure, correction priority, and execution posture arranged into one decision-grade artifact.",
    icon: Eye,
  },
  {
    objection: "Why should we do this now?",
    answer:
      "Because drift compounds quietly. Misalignment is cheaper to read early than to manage late. The right time is before escalation hardens, not after trust, capital, or execution has already been damaged.",
    icon: ShieldCheck,
  },
  {
    objection: "What if we are not ready for private advisory?",
    answer:
      "Then this is exactly the correct entry point. The reporting layer stands on its own. It helps you understand whether the matter needs correction, restraint, or escalation into a deeper mandate.",
    icon: XCircle,
  },
];

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default function SalesObjectionGrid() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {OBJECTIONS.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.article
            key={item.objection}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.08 }}
            className={cn(
              "relative overflow-hidden border border-white/[0.08] bg-white/[0.02] p-8",
              "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
            )}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-full border border-white/10 bg-white/[0.04] p-2.5">
                <Icon className="h-4.5 w-4.5 text-amber-400/68" />
              </div>

              <div className="min-w-0">
                <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/70">
                  Objection
                </div>
                <h3 className="mt-3 max-w-[22ch] font-serif text-2xl leading-tight text-white">
                  {item.objection}
                </h3>

                <div className="mt-6 border border-white/[0.08] bg-black/20 p-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400/70" />
                    <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
                      Answer
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-white/54">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}