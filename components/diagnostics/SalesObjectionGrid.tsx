"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, XCircle, Scale, Eye } from "lucide-react";

type Objection = {
  objection: string;
  answer: string;
  icon: React.ComponentType<any>;
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
            className="border border-white/[0.08] bg-white/[0.02] p-8"
          >
            <div className="flex items-start gap-4">
              <Icon className="mt-1 h-5 w-5 text-amber-400/68" />
              <div>
                <h3 className="font-serif text-2xl text-white">
                  {item.objection}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-white/50">
                  {item.answer}
                </p>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}