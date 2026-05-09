import { SectionShell, HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const chain = [
  {
    step: "01",
    title: "You said",
    body: "A decision is stuck. The board is being named as the blocker.",
  },
  {
    step: "02",
    title: "You committed",
    body: "One accountable owner would be confirmed before escalation.",
  },
  {
    step: "03",
    title: "You did or did not respond",
    body: "The checkpoint records whether that commitment was met, delayed, or avoided.",
  },
  {
    step: "04",
    title: "The system carried it forward",
    body: "The unresolved contradiction stays with the case instead of disappearing behind a new form.",
  },
  {
    step: "05",
    title: "The next surface uses it",
    body: "Return Brief, Counsel Review, and Strategy Room use the record that already exists, if escalation is earned.",
  },
];

export default function MemoryContinuityPreview() {
  return (
    <SectionShell
      id="decision-memory"
      eyebrow="Decision memory"
      title="You are not starting again."
      description="The system becomes more valuable after use because it remembers evidence, commitments, missed responses, and unresolved contradiction."
    >
      <div className="mx-auto grid max-w-[960px] gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-white/[0.08] bg-white/[0.02] p-6">
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${HOMEPAGE_GOLD}CC` }}>
            Continuity chain
          </p>
          <p className="mt-4 text-[15px] leading-[1.85] text-white/62">
            Fast Diagnostic leads to checkpoint memory. Checkpoint memory informs
            Return Brief. Later escalation uses the case that already exists,
            not a fresh performance of the same problem.
          </p>
        </div>
        <div className="space-y-3">
          {chain.map((item) => (
            <div key={item.step} className="flex gap-4 border border-white/[0.08] bg-white/[0.02] p-5">
              <span style={{ ...mono, fontSize: "10px", color: `${HOMEPAGE_GOLD}B0`, width: "28px", flexShrink: 0 }}>
                {item.step}
              </span>
              <div>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.56)" }}>
                  {item.title}
                </p>
                <p className="mt-2 text-[14px] leading-[1.8] text-white/68">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
