import { SectionShell, HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

const artifactRows = [
  {
    label: "Finding",
    value: "The decision is delayed because authority is being treated as assumed rather than confirmed.",
  },
  {
    label: "Contradiction",
    value: "The team says the board is blocking movement, but no one has named who can bind the next move today.",
  },
  {
    label: "Required move",
    value: "Confirm one accountable owner and restate the decision in writing before escalation.",
  },
  {
    label: "Consequence warning",
    value: "Estimated exposure: delay compounds commercial and governance cost over the next 30 to 90 days.",
  },
  {
    label: "Checkpoint",
    value: "A 14-day checkpoint is scheduled to confirm whether authority was clarified or avoidance continued.",
  },
  {
    label: "Memory note",
    value: "This contradiction remains attached to the case record until evidence shows it was resolved.",
  },
];

export default function OutputArtifactPreview() {
  return (
    <SectionShell
      id="output-preview"
      eyebrow="Output preview"
      title="What comes back."
      description="The first return is not a motivational summary. It is a governed reading of the decision as submitted, including what is missing and what must happen next."
    >
      <div className="mx-auto max-w-[900px] border" style={{ borderColor: "rgba(201,169,110,0.24)", backgroundColor: "rgba(255,255,255,0.02)" }}>
        <div className="border-b border-white/[0.08] px-6 py-6 md:px-8">
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${HOMEPAGE_GOLD}CC` }}>
            Sample governed return
          </p>
          <h3
            className="mt-3"
            style={{
              ...serif,
              fontSize: "clamp(1.45rem, 3vw, 2rem)",
              lineHeight: 1.08,
              color: "#F5F5F5",
              fontStyle: "italic",
            }}
          >
            Escalation blocked by unresolved authority.
          </h3>
          <p className="mt-4 max-w-[58ch] text-[14px] leading-[1.8] text-white/56">
            The case is serious enough for consequence, but not yet clean
            enough for escalation.
          </p>
        </div>
        <div className="grid gap-px md:grid-cols-2" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          {artifactRows.map((row) => (
            <div key={row.label} className="p-5 md:p-6" style={{ backgroundColor: "rgb(3,3,5)" }}>
              <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                {row.label}
              </p>
              <p className="mt-3 text-[14px] leading-[1.8] text-white/72">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
