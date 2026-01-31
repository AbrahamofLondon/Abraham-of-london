import * as React from "react";
import { Quote } from "lucide-react";

export default function CredibilityQuotes(): JSX.Element {
  const quotes = [
    {
      q: "This reads like an operator’s briefing — not internet content.",
      a: "Reader",
    },
    {
      q: "The material is structured. It feels like a system I can deploy.",
      a: "Founder",
    },
    {
      q: "There’s governance discipline in the way the thinking is laid out.",
      a: "Leadership team",
    },
  ];

  return (
    <section className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {quotes.map((x, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 hover:border-white/15 transition-colors"
            >
              <Quote className="h-5 w-5 text-amber-300" />
              <p className="mt-4 text-sm md:text-base text-white/75 leading-relaxed">
                “{x.q}”
              </p>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.32em] text-white/45">
                — {x.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}