"use client";

import * as React from "react";
import { Crown } from "lucide-react";

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
      className="p-8 border"
      style={
        emphasis
          ? { borderColor: "var(--ds-accent)", backgroundColor: "var(--ds-accent-soft)" }
          : { borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }
      }
    >
      <div className="flex justify-between items-center">
        <h3 className="font-serif text-2xl" style={{ color: "var(--ds-text)" }}>{title}</h3>
        {emphasis && <Crown style={{ color: "var(--ds-accent)" }} />}
      </div>

      <ul className="mt-6 space-y-3 text-sm" style={{ color: "var(--ds-text-muted)" }}>
        {features.map((f) => (
          <li key={f}>· {f}</li>
        ))}
      </ul>

      <button
        className="mt-8 w-full py-3 border text-xs uppercase tracking-wider transition-colors"
        style={{ borderColor: "var(--ds-border)", color: "var(--ds-text)" }}
      >
        Request Access
      </button>
    </div>
  );
}
