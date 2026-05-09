import * as React from "react";

import type { CrossOrgPatternIntelligence } from "@/lib/product/cross-org-pattern-intelligence";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export default function CrossScopePatternSummary({
  data,
}: {
  data: CrossOrgPatternIntelligence | null;
}) {
  if (!data) return null;

  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
        Cross-Scope Pattern Summary
      </p>
      <p className="mt-3 text-sm text-white/55">
        {data.scopeMode.replace(/_/g, " ")} · {data.organisationCount} organisation{data.organisationCount === 1 ? "" : "s"} · {data.authorisedScopeCount} authorised scope{data.authorisedScopeCount === 1 ? "" : "s"} · {data.depth}
      </p>
      {data.suppressionNotice ? (
        <p className="mt-3 text-sm text-white/45">{data.suppressionNotice}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {data.categories.map((category) => (
            <div key={category.id} className="border border-white/5 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-white/70">{category.label}</p>
                <span style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>{category.occurrences}</span>
              </div>
              <p className="mt-2 text-sm text-white/50">{category.summary}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
