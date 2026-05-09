import { SectionShell, HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const trustCards = [
  {
    title: "Source-labelled evidence",
    body: "User-reported means user-reported. System-inferred means system-inferred. The homepage does not collapse them into one confidence story.",
  },
  {
    title: "No fabricated verification",
    body: "The system will not call an outcome verified unless evidence is provided. Self-reported outcomes do not become independent proof by tone alone.",
  },
  {
    title: "Refusal when evidence is weak",
    body: "If the case is not ready, escalation is not earned. The system can withhold progression instead of pretending the record is stronger than it is.",
  },
  {
    title: "Estimates are labelled",
    body: "Estimated means estimated. Consequence language is marked as estimate until stronger evidence supports it.",
  },
  {
    title: "Unsafe or private material is suppressed",
    body: "Insufficient, unsafe, or private material is withheld rather than exposed. The public surface shows the finding, not the internal mechanics.",
  },
];

export default function TrustArchitectureBlock() {
  return (
    <SectionShell
      id="trust-architecture"
      eyebrow="Trust architecture"
      title="What the system will not pretend."
      description="Trust is created by rule discipline, not by slogans. These are public-facing constraints on what the system will say, label, verify, or suppress."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {trustCards.map((card) => (
          <div key={card.title} className="border border-white/[0.08] bg-white/[0.02] p-5">
            <p
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: `${HOMEPAGE_GOLD}CC`,
              }}
            >
              {card.title}
            </p>
            <p className="mt-3 text-[14px] leading-[1.8] text-white/58">{card.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
