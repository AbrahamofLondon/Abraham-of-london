"use client";

import * as React from "react";

const ITEMS = [
  "Institutional playbooks",
  "Diagnostic frameworks",
  "Canonical essays",
  "Decision systems",
];

export default function VaultValueStack() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ITEMS.map((item) => (
        <div
          key={item}
          className="border border-white/[0.08] bg-white/[0.02] p-6 text-white/60 text-sm"
        >
          {item}
        </div>
      ))}
    </div>
  );
}