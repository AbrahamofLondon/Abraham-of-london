import { SectionShell, HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const spineSteps = [
  { key: "Detect",      body: "A signal is identified against evidence, authority, consequence, and execution reality." },
  { key: "Compare",     body: "The signal is compared against the available record base, with the comparison basis clearly labelled." },
  { key: "Consequence", body: "A consequence path is projected across 30, 60, and 90 days — labelled as estimate, not certainty." },
  { key: "Recommend",   body: "The next admissible move is named. If no admissible move exists, the system withholds one." },
  { key: "Verify",      body: "A future review point is created so the system can return to what happened next." },
  { key: "Review",      body: "Consequential claims are routed for operator review where human confirmation is required." },
  { key: "Remember",    body: "Evidence is written to institutional memory only when posture and review support it." },
  { key: "Correct",     body: "If the system was wrong, the record can reflect it. Correction is built into the architecture." },
];

export default function VerificationSpineBlock() {
  return (
    <SectionShell
      id="verification-spine"
      eyebrow="Verification spine"
      title="The system does not stop at recommendation."
      description="Every material output creates a future review point. Dispute is accepted as review input. Memory updates only when the evidence supports it."
    >
      {/* Chain label */}
      <div
        className="mx-auto mb-8 max-w-[900px] border border-white/[0.07] bg-white/[0.015] px-6 py-4 text-center"
      >
        <p
          style={{
            ...mono,
            fontSize: "10px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: `${HOMEPAGE_GOLD}CC`,
            lineHeight: 2,
          }}
        >
          {"Detect → Compare → Consequence → Recommend → Verify → Review → Remember → Correct"}
        </p>
      </div>

      {/* Step grid */}
      <div className="mx-auto grid max-w-[900px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {spineSteps.map((step, i) => (
          <div
            key={step.key}
            className="border border-white/[0.07] bg-white/[0.02] p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                style={{
                  ...mono,
                  fontSize: "8px",
                  color: `${HOMEPAGE_GOLD}80`,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                style={{
                  ...mono,
                  fontSize: "9px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: `${HOMEPAGE_GOLD}CC`,
                }}
              >
                {step.key}
              </p>
            </div>
            <p className="text-[13px] leading-[1.78] text-white/52">{step.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
