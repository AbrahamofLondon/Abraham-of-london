"use client";

import * as React from "react";
import { Crown, Lock } from "lucide-react";

export default function VaultTierCard({
  title,
  features,
  emphasis,
}: {
  title: string;
  features: string[];
  emphasis?: boolean;
}) {
  return (
    <div
      className={`p-8 border ${
        emphasis
          ? "border-amber-500/30 bg-amber-500/[0.03]"
          : "border-white/[0.08] bg-white/[0.02]"
      }`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-white font-serif text-2xl">{title}</h3>
        {emphasis && <Crown className="text-amber-400" />}
      </div>

      <ul className="mt-6 space-y-3 text-sm text-white/50">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>

      <button className="mt-8 w-full py-3 border border-white/[0.1] text-white text-xs uppercase tracking-wider hover:bg-white/[0.05]">
        Request Access
      </button>
    </div>
  );
}