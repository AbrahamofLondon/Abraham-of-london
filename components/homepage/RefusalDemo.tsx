import { SectionShell, HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const steps = [
  {
    label: "Evidence submitted",
    detail:
      'The user names the decision, the claimed owner, and the stated blocker: "waiting for board approval."',
    tone: "neutral",
  },
  {
    label: "Structural issue detected",
    detail:
      "The claimed authority and the exercised authority do not match. The decision is being discussed as if it is ready, but the mandate is still unstable.",
    tone: "warn",
  },
  {
    label: "Escalation not yet earned",
    detail:
      "The system will not promote this case into Strategy Room. Evidence of authority and financial consequence is still incomplete.",
    tone: "block",
  },
  {
    label: "Action required before escalation",
    detail:
      "Assign one accountable owner. Confirm authority in writing. Re-submit with evidence of consequence.",
    tone: "action",
  },
  {
    label: "Memory retained",
    detail:
      "The contradiction and the required correction stay on the case record. The next surface will use them instead of starting from zero.",
    tone: "memory",
  },
];

function toneStyles(tone: string) {
  if (tone === "block") {
    return {
      borderColor: "rgba(248,113,113,0.24)",
      labelColor: "rgba(248,113,113,0.84)",
      bodyColor: "rgba(255,255,255,0.72)",
    };
  }
  if (tone === "warn") {
    return {
      borderColor: "rgba(245,158,11,0.18)",
      labelColor: "rgba(245,158,11,0.84)",
      bodyColor: "rgba(255,255,255,0.66)",
    };
  }
  if (tone === "action") {
    return {
      borderColor: "rgba(201,169,110,0.22)",
      labelColor: `${HOMEPAGE_GOLD}CC`,
      bodyColor: "rgba(255,255,255,0.70)",
    };
  }
  if (tone === "memory") {
    return {
      borderColor: "rgba(110,231,183,0.18)",
      labelColor: "rgba(110,231,183,0.88)",
      bodyColor: "rgba(255,255,255,0.70)",
    };
  }
  return {
    borderColor: "rgba(255,255,255,0.10)",
    labelColor: "rgba(255,255,255,0.54)",
    bodyColor: "rgba(255,255,255,0.66)",
  };
}

export default function RefusalDemo() {
  return (
    <SectionShell
      id="refusal-demo"
      eyebrow="Refusal demo"
      title="How refusal works."
      description="Ordinary tools assume the decision is ready to be helped. This system is willing to stop the case, name what is missing, and retain the correction path."
    >
      <div className="mx-auto max-w-[760px] space-y-3">
        {steps.map((step) => {
          const styles = toneStyles(step.tone);
          return (
            <div
              key={step.label}
              className="border bg-white/[0.02] p-5"
              style={{ borderColor: styles.borderColor }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "10px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: styles.labelColor,
                }}
              >
                {step.label}
              </p>
              <p className="mt-3 text-[14px] leading-[1.8]" style={{ color: styles.bodyColor }}>
                {step.detail}
              </p>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
