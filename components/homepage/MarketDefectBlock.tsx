import { SectionShell } from "@/components/homepage/homepagePrimitives";

const defects = [
  {
    label: "AI tools",
    body: "give suggestions after the user has already framed the decision.",
  },
  {
    label: "Dashboards",
    body: "show data without testing whether the decision is actually owned.",
  },
  {
    label: "Consultants",
    body: "write recommendations after weak authority and weak evidence have already been normalized.",
  },
  {
    label: "Assessments",
    body: "produce scores even when the organisation is avoiding the real question.",
  },
];

export default function MarketDefectBlock() {
  return (
    <SectionShell
      id="market-defect"
      eyebrow="Market defect"
      title="Most tools help too early."
      description="Serious failure often begins before advice is useful. The decision is not owned, the evidence is weak, the authority is unclear, the consequence is understated, or the organisation is avoiding the real question. This system tests that before it lets the case proceed."
    >
      <div className="grid gap-px md:grid-cols-2 xl:grid-cols-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
        {defects.map((item) => (
          <div key={item.label} className="p-5" style={{ backgroundColor: "rgb(3,3,5)" }}>
            <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.16em] text-white/40">
              {item.label}
            </p>
            <p className="mt-3 text-[14px] leading-[1.8] text-white/56">{item.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
