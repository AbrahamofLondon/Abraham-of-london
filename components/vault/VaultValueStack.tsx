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
          className="border p-6 text-sm"
          style={{
            borderColor: "var(--ds-border)",
            backgroundColor: "var(--ds-panel)",
            color: "var(--ds-text-muted)",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
