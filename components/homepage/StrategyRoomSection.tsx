import { Lock } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

const conditions = [
  {
    label: "Entry condition",
    value: "The Fast Diagnostic has named an unresolved condition and the executive report has confirmed structural escalation risk.",
  },
  {
    label: "What it is",
    value: "A structured intervention surface. Not a workshop, not a retainer call. A governed session around a specific decision with a prior evidence record.",
  },
  {
    label: "What is produced",
    value: "A binding intervention record: the decision taken, the authority who took it, the dissenting positions retained, and the review trigger.",
  },
  {
    label: "What it is not",
    value: "A starting point. The Strategy Room is not available without a prior governed record. There is no cold entry.",
  },
];

export default function StrategyRoomSection() {
  return (
    <SectionShell
      id="strategy-room"
      eyebrow="Strategy Room"
      title="Execution intervention. Not a starting point."
      description="The Strategy Room is the governed intervention layer. It opens when the evidence record supports escalation — not before. It produces a binding session record, not a set of slides."
    >
      <div className="mx-auto max-w-[900px]">
        <div className="space-y-3">
          {conditions.map((item) => (
            <div
              key={item.label}
              className="flex gap-4 border border-white/[0.06] bg-white/[0.015] p-5"
            >
              <div className="min-w-0 flex-1">
                <p
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                    color: `${HOMEPAGE_GOLD}80`,
                  }}
                >
                  {item.label}
                </p>
                <p className="mt-3 text-[14px] leading-[1.8] text-white/62">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-6 flex items-center gap-3 border border-white/[0.05] bg-white/[0.01] px-5 py-4"
        >
          <Lock
            style={{
              width: 13,
              height: 13,
              color: "rgba(255,255,255,0.28)",
              flexShrink: 0,
            }}
          />
          <p
            style={{
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.32)",
            }}
          >
            Access is earned through the diagnostic ladder — not requested directly.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
