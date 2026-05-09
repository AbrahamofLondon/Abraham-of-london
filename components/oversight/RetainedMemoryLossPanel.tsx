import * as React from "react";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export default function RetainedMemoryLossPanel({ summary, retainedAssets }: {
  summary: string;
  retainedAssets: string[];
}) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem 1.1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.78)" }}>
        Active continuity if oversight stops
      </p>
      <p className="mt-3 text-sm leading-7 text-white/68">{summary}</p>
      {retainedAssets.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-white/55">
          {retainedAssets.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-white/42">No cycle archive has accumulated yet, so continuity loss is still limited to future review visibility rather than historic archive loss.</p>
      )}
    </section>
  );
}

